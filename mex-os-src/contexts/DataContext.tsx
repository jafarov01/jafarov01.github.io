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
	type SkillDefinition,
	type HabitDefinition,
	profileData
} from '../lib/seedData';

interface DataContextType {
	// Data
	profile: Profile | null;
	exams: Exam[];
	finances: FinanceEntry[];
	habits: HabitEntry[];
	transactions: Transaction[];
	bureaucracy: BureaucracyDoc[];
	skillDefinitions: SkillDefinition[];
	habitDefinitions: HabitDefinition[];
	loading: boolean;

	// Profile
	updateProfile: (data: Partial<Profile>) => Promise<void>;

	// Exams
	updateExamStatus: (examId: string, status: Exam['status']) => Promise<void>;
	updateExam: (examId: string, data: Partial<Exam>) => Promise<void>;
	addExam: (exam: Omit<Exam, 'id' | 'createdAt'>) => Promise<void>;
	deleteExam: (examId: string) => Promise<void>;

	// Habits
	updateHabit: (date: string, habitData: Partial<HabitEntry>) => Promise<void>;

	// Habit Definitions
	addHabitDefinition: (def: Omit<HabitDefinition, 'id' | 'createdAt'>) => Promise<void>;
	updateHabitDefinition: (id: string, data: Partial<HabitDefinition>) => Promise<void>;
	deleteHabitDefinition: (id: string) => Promise<void>;

	// Skill Definitions
	addSkillDefinition: (def: Omit<SkillDefinition, 'id' | 'createdAt'>) => Promise<void>;
	updateSkillDefinition: (id: string, data: Partial<SkillDefinition>) => Promise<void>;
	deleteSkillDefinition: (id: string) => Promise<void>;

	// Finance
	updateFinance: (id: string, data: Partial<FinanceEntry>) => Promise<void>;
	addFinance: (entry: Omit<FinanceEntry, 'id'>) => Promise<void>;
	deleteFinance: (id: string) => Promise<void>;

	// Transactions
	addTransaction: (tx: Omit<Transaction, 'id'>) => Promise<void>;
	updateTransaction: (id: string, data: Partial<Transaction>) => Promise<void>;
	deleteTransaction: (txId: string) => Promise<void>;

	// Bureaucracy
	updateBureaucracy: (docId: string, data: Partial<BureaucracyDoc>) => Promise<void>;
	addBureaucracy: (doc: Omit<BureaucracyDoc, 'id'>) => Promise<void>;
	deleteBureaucracy: (id: string) => Promise<void>;

	// Derived calculations
	getPassedCFUs: () => number;
	getUnlockedMoney: () => number;
	getLockedMoney: () => number;
	getPendingMoney: () => number;
	getGlobalStatus: () => 'green' | 'yellow' | 'red';
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
	const [skillDefinitions, setSkillDefinitions] = useState<SkillDefinition[]>([]);
	const [habitDefinitions, setHabitDefinitions] = useState<HabitDefinition[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		if (!user) {
			setProfile(null);
			setExams([]);
			setFinances([]);
			setHabits([]);
			setTransactions([]);
			setBureaucracy([]);
			setSkillDefinitions([]);
			setHabitDefinitions([]);
			setLoading(false);
			return;
		}

		setLoading(true);
		let loadedCount = 0;
		const totalCollections = 8;

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
			setExams(examList.sort((a, b) => {
				// TBD exams go to the end
				if (!a.exam_date && !b.exam_date) return 0;
				if (!a.exam_date) return 1;
				if (!b.exam_date) return -1;
				return new Date(a.exam_date).getTime() - new Date(b.exam_date).getTime();
			}));
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

		// Subscribe to transactions
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

		// Subscribe to bureaucracy
		const bureaucracyRef = collection(db, 'users', user.uid, 'bureaucracy');
		const unsubBureaucracy = onSnapshot(bureaucracyRef, (snapshot) => {
			const docList: BureaucracyDoc[] = [];
			snapshot.forEach((doc) => {
				docList.push({ ...doc.data(), id: doc.id } as BureaucracyDoc);
			});
			setBureaucracy(docList.sort((a, b) => {
				if (a.is_critical && !b.is_critical) return -1;
				if (!a.is_critical && b.is_critical) return 1;
				return 0;
			}));
			checkLoaded();
		});

		// Subscribe to skill definitions
		const skillsRef = collection(db, 'users', user.uid, 'skills');
		const unsubSkills = onSnapshot(skillsRef, (snapshot) => {
			const skillList: SkillDefinition[] = [];
			snapshot.forEach((doc) => {
				skillList.push({ ...doc.data(), id: doc.id } as SkillDefinition);
			});
			setSkillDefinitions(skillList.sort((a, b) =>
				new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
			));
			checkLoaded();
		});

		// Subscribe to habit definitions
		const habitDefsRef = collection(db, 'users', user.uid, 'habitDefinitions');
		const unsubHabitDefs = onSnapshot(habitDefsRef, (snapshot) => {
			const habitDefList: HabitDefinition[] = [];
			snapshot.forEach((doc) => {
				habitDefList.push({ ...doc.data(), id: doc.id } as HabitDefinition);
			});
			setHabitDefinitions(habitDefList.sort((a, b) =>
				new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
			));
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
			unsubSkills();
			unsubHabitDefs();
			unsubLifestyle();
		};
	}, [user]);

	// =========================================================================
	// Profile Operations
	// =========================================================================
	const updateProfile = async (data: Partial<Profile>) => {
		if (!user) return;
		const userDocRef = doc(db, 'users', user.uid);
		await updateDoc(userDocRef, { profile: { ...profile, ...data } });
	};

	// =========================================================================
	// Exam Operations
	// =========================================================================
	const updateExamStatus = async (examId: string, status: Exam['status']) => {
		if (!user) return;
		const examRef = doc(db, 'users', user.uid, 'academics', examId);
		await updateDoc(examRef, { status });

		// Check for scholarship unlock
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

	const updateExam = async (examId: string, data: Partial<Exam>) => {
		if (!user) return;
		const examRef = doc(db, 'users', user.uid, 'academics', examId);
		await updateDoc(examRef, data);
	};

	const addExam = async (exam: Omit<Exam, 'id' | 'createdAt'>) => {
		if (!user) return;
		const examRef = collection(db, 'users', user.uid, 'academics');
		await addDoc(examRef, { ...exam, createdAt: new Date().toISOString() });
	};

	const deleteExam = async (examId: string) => {
		if (!user) return;
		const examRef = doc(db, 'users', user.uid, 'academics', examId);
		await deleteDoc(examRef);
	};

	// =========================================================================
	// Habit Entry Operations
	// =========================================================================
	const updateHabit = async (date: string, habitData: Partial<HabitEntry>) => {
		if (!user) return;
		const habitRef = doc(db, 'users', user.uid, 'lifestyle', date);
		const habitDoc = await getDoc(habitRef);

		if (habitDoc.exists()) {
			const existing = habitDoc.data() as HabitEntry;
			await updateDoc(habitRef, {
				habits: { ...existing.habits, ...(habitData.habits || {}) },
				skills: { ...existing.skills, ...(habitData.skills || {}) }
			});
		} else {
			// Create new entry with defaults
			const defaultHabits: Record<string, number | boolean> = {};
			const defaultSkills: Record<string, string> = {};

			habitDefinitions.forEach(def => {
				defaultHabits[def.id] = def.trackingType === 'boolean' ? false : 0;
			});
			skillDefinitions.forEach(def => {
				defaultSkills[def.id] = def.trackingOptions[0];
			});

			await setDoc(habitRef, {
				date,
				habits: { ...defaultHabits, ...(habitData.habits || {}) },
				skills: { ...defaultSkills, ...(habitData.skills || {}) }
			});
		}
	};

	// =========================================================================
	// Habit Definition Operations
	// =========================================================================
	const addHabitDefinition = async (def: Omit<HabitDefinition, 'id' | 'createdAt'>) => {
		if (!user) return;
		const colRef = collection(db, 'users', user.uid, 'habitDefinitions');
		await addDoc(colRef, { ...def, createdAt: new Date().toISOString() });
	};

	const updateHabitDefinition = async (id: string, data: Partial<HabitDefinition>) => {
		if (!user) return;
		const docRef = doc(db, 'users', user.uid, 'habitDefinitions', id);
		await updateDoc(docRef, data);
	};

	const deleteHabitDefinition = async (id: string) => {
		if (!user) return;
		const docRef = doc(db, 'users', user.uid, 'habitDefinitions', id);
		await deleteDoc(docRef);
	};

	// =========================================================================
	// Skill Definition Operations
	// =========================================================================
	const addSkillDefinition = async (def: Omit<SkillDefinition, 'id' | 'createdAt'>) => {
		if (!user) return;
		const colRef = collection(db, 'users', user.uid, 'skills');
		await addDoc(colRef, { ...def, createdAt: new Date().toISOString() });
	};

	const updateSkillDefinition = async (id: string, data: Partial<SkillDefinition>) => {
		if (!user) return;
		const docRef = doc(db, 'users', user.uid, 'skills', id);
		await updateDoc(docRef, data);
	};

	const deleteSkillDefinition = async (id: string) => {
		if (!user) return;
		const docRef = doc(db, 'users', user.uid, 'skills', id);
		await deleteDoc(docRef);
	};

	// =========================================================================
	// Finance Operations
	// =========================================================================
	const updateFinance = async (id: string, data: Partial<FinanceEntry>) => {
		if (!user) return;
		const docRef = doc(db, 'users', user.uid, 'finance', id);
		await updateDoc(docRef, data);
	};

	const addFinance = async (entry: Omit<FinanceEntry, 'id'>) => {
		if (!user) return;
		const colRef = collection(db, 'users', user.uid, 'finance');
		await addDoc(colRef, entry);
	};

	const deleteFinance = async (id: string) => {
		if (!user) return;
		const docRef = doc(db, 'users', user.uid, 'finance', id);
		await deleteDoc(docRef);
	};

	// =========================================================================
	// Transaction Operations
	// =========================================================================
	const addTransaction = async (tx: Omit<Transaction, 'id'>) => {
		if (!user) return;
		const txRef = collection(db, 'users', user.uid, 'transactions');
		await addDoc(txRef, tx);
	};

	const updateTransaction = async (id: string, data: Partial<Transaction>) => {
		if (!user) return;
		const docRef = doc(db, 'users', user.uid, 'transactions', id);
		await updateDoc(docRef, data);
	};

	const deleteTransaction = async (txId: string) => {
		if (!user) return;
		const txRef = doc(db, 'users', user.uid, 'transactions', txId);
		await deleteDoc(txRef);
	};

	// =========================================================================
	// Bureaucracy Operations
	// =========================================================================
	const updateBureaucracy = async (docId: string, data: Partial<BureaucracyDoc>) => {
		if (!user) return;
		const docRef = doc(db, 'users', user.uid, 'bureaucracy', docId);
		await updateDoc(docRef, data);
	};

	const addBureaucracy = async (docData: Omit<BureaucracyDoc, 'id'>) => {
		if (!user) return;
		const colRef = collection(db, 'users', user.uid, 'bureaucracy');
		await addDoc(colRef, docData);
	};

	const deleteBureaucracy = async (id: string) => {
		if (!user) return;
		const docRef = doc(db, 'users', user.uid, 'bureaucracy', id);
		await deleteDoc(docRef);
	};

	// =========================================================================
	// Derived Calculations
	// =========================================================================
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
		const nextExam = exams.find(e =>
			e.exam_date && new Date(e.exam_date) > now && e.status !== 'passed'
		);

		// Check bureaucracy for critical warnings
		const hasCriticalBureaucracy = bureaucracy.some(
			doc => doc.is_critical && (doc.status === 'expired' || doc.status === 'unknown')
		);

		if (hasCriticalBureaucracy) return 'red';

		if (!nextExam || !nextExam.exam_date) return 'green';

		const daysUntil = Math.ceil(
			(new Date(nextExam.exam_date).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
		);

		if (daysUntil <= 7) return 'red';
		if (daysUntil <= 14) return 'yellow';

		return 'green';
	}, [exams, bureaucracy]);

	return (
		<DataContext.Provider value={{
			profile,
			exams,
			finances,
			habits,
			transactions,
			bureaucracy,
			skillDefinitions,
			habitDefinitions,
			loading,
			updateProfile,
			updateExamStatus,
			updateExam,
			addExam,
			deleteExam,
			updateHabit,
			addHabitDefinition,
			updateHabitDefinition,
			deleteHabitDefinition,
			addSkillDefinition,
			updateSkillDefinition,
			deleteSkillDefinition,
			updateFinance,
			addFinance,
			deleteFinance,
			addTransaction,
			updateTransaction,
			deleteTransaction,
			updateBureaucracy,
			addBureaucracy,
			deleteBureaucracy,
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
