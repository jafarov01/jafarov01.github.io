import { createContext, useContext, useEffect, useState, type ReactNode, useCallback } from 'react';
import {
	collection,
	doc,
	onSnapshot,
	updateDoc,
	setDoc,
	getDoc,
	addDoc,
	deleteDoc
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from './AuthContext';
import {
	type Profile,
	type Exam,
	type FinanceEntry,
	type HabitEntry,
	type Transaction,
	type BureaucracyDoc,
	profileData
} from '../lib/seedData';

interface DataContextType {
	profile: Profile | null;
	exams: Exam[];
	finances: FinanceEntry[];
	habits: HabitEntry[];
	transactions: Transaction[];
	bureaucracy: BureaucracyDoc[];
	loading: boolean;
	updateExamStatus: (examId: string, status: Exam['status']) => Promise<void>;
	updateHabit: (date: string, habitData: Partial<HabitEntry>) => Promise<void>;
	addTransaction: (tx: Omit<Transaction, 'id'>) => Promise<void>;
	deleteTransaction: (txId: string) => Promise<void>;
	updateBureaucracy: (docId: string, data: Partial<BureaucracyDoc>) => Promise<void>;
	getPassedCFUs: () => number;
	getUnlockedMoney: () => number;
	getLockedMoney: () => number;
	getPendingMoney: () => number;
	getGlobalStatus: () => 'green' | 'yellow' | 'red';
	// Cashflow helpers
	getMonthlyIncome: (year: number, month: number) => number;
	getMonthlyExpenses: (year: number, month: number) => number;
	getNetBalance: () => number;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
	const { user } = useAuth();
	const [profile, setProfile] = useState<Profile | null>(null);
	const [exams, setExams] = useState<Exam[]>([]);
	const [finances, setFinances] = useState<FinanceEntry[]>([]);
	const [habits, setHabits] = useState<HabitEntry[]>([]);
	const [transactions, setTransactions] = useState<Transaction[]>([]);
	const [bureaucracy, setBureaucracy] = useState<BureaucracyDoc[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		if (!user) {
			setProfile(null);
			setExams([]);
			setFinances([]);
			setHabits([]);
			setTransactions([]);
			setBureaucracy([]);
			setLoading(false);
			return;
		}

		setLoading(true);
		let loadedCount = 0;
		const totalCollections = 6;

		const checkLoaded = () => {
			loadedCount++;
			if (loadedCount >= totalCollections) setLoading(false);
		};

		// Subscribe to profile
		const userDocRef = doc(db, 'users', user.uid);
		const unsubProfile = onSnapshot(userDocRef, (snapshot) => {
			if (snapshot.exists()) {
				setProfile(snapshot.data().profile as Profile);
			} else {
				setProfile(profileData);
			}
			checkLoaded();
		});

		// Subscribe to academics
		const academicsRef = collection(db, 'users', user.uid, 'academics');
		const unsubAcademics = onSnapshot(academicsRef, (snapshot) => {
			const examList: Exam[] = [];
			snapshot.forEach((doc) => {
				examList.push({ ...doc.data(), id: doc.id } as Exam);
			});
			setExams(examList.sort((a, b) =>
				new Date(a.exam_date).getTime() - new Date(b.exam_date).getTime()
			));
			checkLoaded();
		});

		// Subscribe to finance (scholarship)
		const financeRef = collection(db, 'users', user.uid, 'finance');
		const unsubFinance = onSnapshot(financeRef, (snapshot) => {
			const financeList: FinanceEntry[] = [];
			snapshot.forEach((doc) => {
				financeList.push({ ...doc.data(), id: doc.id } as FinanceEntry);
			});
			setFinances(financeList);
			checkLoaded();
		});

		// Subscribe to transactions (NEW)
		const transactionsRef = collection(db, 'users', user.uid, 'transactions');
		const unsubTransactions = onSnapshot(transactionsRef, (snapshot) => {
			const txList: Transaction[] = [];
			snapshot.forEach((doc) => {
				txList.push({ ...doc.data(), id: doc.id } as Transaction);
			});
			setTransactions(txList.sort((a, b) =>
				new Date(b.date).getTime() - new Date(a.date).getTime()
			));
			checkLoaded();
		});

		// Subscribe to bureaucracy (NEW)
		const bureaucracyRef = collection(db, 'users', user.uid, 'bureaucracy');
		const unsubBureaucracy = onSnapshot(bureaucracyRef, (snapshot) => {
			const docList: BureaucracyDoc[] = [];
			snapshot.forEach((doc) => {
				docList.push({ ...doc.data(), id: doc.id } as BureaucracyDoc);
			});
			setBureaucracy(docList.sort((a, b) => {
				// Critical items first
				if (a.is_critical && !b.is_critical) return -1;
				if (!a.is_critical && b.is_critical) return 1;
				return 0;
			}));
			checkLoaded();
		});

		// Subscribe to lifestyle/habits
		const lifestyleRef = collection(db, 'users', user.uid, 'lifestyle');
		const unsubLifestyle = onSnapshot(lifestyleRef, (snapshot) => {
			const habitList: HabitEntry[] = [];
			snapshot.forEach((doc) => {
				habitList.push({ ...doc.data(), date: doc.id } as HabitEntry);
			});
			setHabits(habitList.sort((a, b) =>
				new Date(b.date).getTime() - new Date(a.date).getTime()
			));
			checkLoaded();
		});

		return () => {
			unsubProfile();
			unsubAcademics();
			unsubFinance();
			unsubTransactions();
			unsubBureaucracy();
			unsubLifestyle();
		};
	}, [user]);

	const updateExamStatus = async (examId: string, status: Exam['status']) => {
		if (!user) return;
		const examRef = doc(db, 'users', user.uid, 'academics', examId);
		await updateDoc(examRef, { status });

		const examBeingUpdated = exams.find(e => e.id === examId);
		const currentPassedCFUs = exams
			.filter(e => e.status === 'passed' && e.is_scholarship_critical && e.id !== examId)
			.reduce((sum, e) => sum + e.cfu, 0);

		const newTotalCFUs = currentPassedCFUs +
			(status === 'passed' && examBeingUpdated?.is_scholarship_critical ? (examBeingUpdated?.cfu || 0) : 0);

		if (newTotalCFUs >= 20) {
			const meritInstallment = finances.find(f => f.id === 'installment_2_merit');
			if (meritInstallment && meritInstallment.status === 'locked') {
				const financeRef = doc(db, 'users', user.uid, 'finance', 'installment_2_merit');
				await updateDoc(financeRef, { status: 'pending' });
			}
		}
	};

	const updateHabit = async (date: string, habitData: Partial<HabitEntry>) => {
		if (!user) return;
		const habitRef = doc(db, 'users', user.uid, 'lifestyle', date);
		const habitDoc = await getDoc(habitRef);

		if (habitDoc.exists()) {
			await updateDoc(habitRef, habitData);
		} else {
			await setDoc(habitRef, {
				date,
				habits: {
					deep_work_hours: 0,
					sleep_hours: 0,
					gym_session: false,
					calories: 0,
					...(habitData.habits || {})
				},
				skills: {
					python_practice: "0 mins",
					italian_practice: "0 mins",
					...(habitData.skills || {})
				}
			});
		}
	};

	// NEW: Transaction management
	const addTransaction = async (tx: Omit<Transaction, 'id'>) => {
		if (!user) return;
		const txRef = collection(db, 'users', user.uid, 'transactions');
		await addDoc(txRef, tx);
	};

	const deleteTransaction = async (txId: string) => {
		if (!user) return;
		const txRef = doc(db, 'users', user.uid, 'transactions', txId);
		await deleteDoc(txRef);
	};

	// NEW: Bureaucracy management
	const updateBureaucracy = async (docId: string, data: Partial<BureaucracyDoc>) => {
		if (!user) return;
		const docRef = doc(db, 'users', user.uid, 'bureaucracy', docId);
		await updateDoc(docRef, data);
	};

	const getPassedCFUs = useCallback(() => {
		return exams
			.filter(e => e.status === 'passed' && e.is_scholarship_critical)
			.reduce((sum, e) => sum + e.cfu, 0);
	}, [exams]);

	const getUnlockedMoney = useCallback(() => {
		return finances
			.filter(f => f.status === 'received')
			.reduce((sum, f) => sum + f.amount, 0);
	}, [finances]);

	const getLockedMoney = useCallback(() => {
		return finances
			.filter(f => f.status === 'locked')
			.reduce((sum, f) => sum + f.amount, 0);
	}, [finances]);

	const getPendingMoney = useCallback(() => {
		return finances
			.filter(f => f.status === 'pending')
			.reduce((sum, f) => sum + f.amount, 0);
	}, [finances]);

	// NEW: Cashflow calculations
	const getMonthlyIncome = useCallback((year: number, month: number) => {
		return transactions
			.filter(tx => {
				const txDate = new Date(tx.date);
				return tx.type === 'income' &&
					txDate.getFullYear() === year &&
					txDate.getMonth() === month;
			})
			.reduce((sum, tx) => sum + tx.amount, 0);
	}, [transactions]);

	const getMonthlyExpenses = useCallback((year: number, month: number) => {
		return transactions
			.filter(tx => {
				const txDate = new Date(tx.date);
				return tx.type === 'expense' &&
					txDate.getFullYear() === year &&
					txDate.getMonth() === month;
			})
			.reduce((sum, tx) => sum + tx.amount, 0);
	}, [transactions]);

	const getNetBalance = useCallback(() => {
		const totalIncome = transactions
			.filter(tx => tx.type === 'income')
			.reduce((sum, tx) => sum + tx.amount, 0);
		const totalExpenses = transactions
			.filter(tx => tx.type === 'expense')
			.reduce((sum, tx) => sum + tx.amount, 0);
		return totalIncome - totalExpenses;
	}, [transactions]);

	const getGlobalStatus = useCallback((): 'green' | 'yellow' | 'red' => {
		const now = new Date();
		const nextExam = exams.find(e => new Date(e.exam_date) > now && e.status !== 'passed');

		// Check bureaucracy for critical warnings
		const hasCriticalBureaucracy = bureaucracy.some(
			doc => doc.is_critical && (doc.status === 'expired' || doc.status === 'unknown')
		);

		if (hasCriticalBureaucracy) return 'red';

		if (!nextExam) return 'green';

		const daysUntil = Math.ceil(
			(new Date(nextExam.exam_date).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
		);

		if (daysUntil <= 7 || profile?.visa_expiry.includes('WARNING')) {
			return 'red';
		}

		if (daysUntil <= 14) {
			return 'yellow';
		}

		return 'green';
	}, [exams, profile, bureaucracy]);

	return (
		<DataContext.Provider value={{
			profile,
			exams,
			finances,
			habits,
			transactions,
			bureaucracy,
			loading,
			updateExamStatus,
			updateHabit,
			addTransaction,
			deleteTransaction,
			updateBureaucracy,
			getPassedCFUs,
			getUnlockedMoney,
			getLockedMoney,
			getPendingMoney,
			getGlobalStatus,
			getMonthlyIncome,
			getMonthlyExpenses,
			getNetBalance
		}}>
			{children}
		</DataContext.Provider>
	);
}

export function useData() {
	const context = useContext(DataContext);
	if (context === undefined) {
		throw new Error('useData must be used within a DataProvider');
	}
	return context;
}
