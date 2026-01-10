import { createContext, useContext, useEffect, useState, type ReactNode, useCallback } from 'react';
import {
	collection,
	doc,
	onSnapshot,
	updateDoc,
	setDoc,
	getDoc,
	getDocs,
	addDoc,
	deleteDoc,
	writeBatch
} from 'firebase/firestore'; // Added writeBatch
import { db } from '../lib/firebase';
import { useAuth } from './AuthContext';
import {
	type Profile, type Exam, type FinanceEntry, type HabitEntry, type Transaction,
	type BureaucracyDoc, type SkillDefinition, type HabitDefinition,
	type FullUserData,
	profileData,
	validateImportData
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

	// Habits (Entries)
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

	// Data Management
	exportData: () => Promise<FullUserData>;
	importData: (data: FullUserData) => Promise<void>;
	hardResetData: () => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
	const { user } = useAuth();
	const [profile, setProfile] = useState<Profile | null>(null);
	const [exams, setExams] = useState<Exam[]>([]);
	const [finances, setFinances] = useState<FinanceEntry[]>([]);
	const [habits, setHabits] = useState<HabitEntry[]>([]); // These are ENTRIES (lifestyle) in the UI usage
	const [transactions, setTransactions] = useState<Transaction[]>([]);
	const [bureaucracy, setBureaucracy] = useState<BureaucracyDoc[]>([]);

	const [skillDefinitions, setSkillDefinitions] = useState<SkillDefinition[]>([]);
	const [habitDefinitions, setHabitDefinitions] = useState<HabitDefinition[]>([]);
	const [loading, setLoading] = useState(true);

	// --- DATA MANAGEMENT ---

	const exportData = async (): Promise<FullUserData> => {
		if (!user || !profile) throw new Error("No user data");
		return {
			profile,
			academics: exams,
			finance: finances,
			transactions,
			bureaucracy,
			skills: skillDefinitions,
			habitDefinitions: habitDefinitions
		};
	};

	const hardResetData = async () => {
		if (!user) return;
		const batch = writeBatch(db);

		// Delete all subcollections
		const collections = ['academics', 'finance', 'transactions', 'bureaucracy', 'skills', 'habitDefinitions', 'lifestyle'];

		for (const colName of collections) {
			const snapshot = await getDocs(collection(db, 'users', user.uid, colName));
			snapshot.docs.forEach(doc => batch.delete(doc.ref));
		}

		// DO NOT delete the root user document. This preserves the Profile and isInitialized flag.
		// We only update the timestamp.
		batch.update(doc(db, 'users', user.uid), {
			updatedAt: new Date().toISOString()
			// isInitialized remains true, preventing auto-seed on refresh
		});

		await batch.commit();

		// Reset Local State - Keep Profile, clear others
		// setProfile(null); // Keep the current profile!
		setExams([]);
		setFinances([]);
		setTransactions([]);
		setBureaucracy([]);
		setSkillDefinitions([]);
		setHabitDefinitions([]);
		setHabits([]);
	};

	// (Empty - removal)

	const importData = async (data: FullUserData) => {
		if (!user) return;

		// STRICT VALIDATION
		const validation = validateImportData(data);
		if (!validation.valid) {
			console.error("Import failed:", validation.error);
			throw new Error(`Import failed: ${validation.error}. Please check against Blueprint.`);
		}

		await hardResetData();

		const batch = writeBatch(db);
		const userRef = doc(db, 'users', user.uid);

		// Profile
		batch.set(userRef, {
			profile: data.profile,
			isInitialized: true,
			updatedAt: new Date().toISOString()
		});

		// Collections logic
		const importCollections = [
			{ name: 'academics', data: data.academics },
			{ name: 'finance', data: data.finance },
			{ name: 'transactions', data: data.transactions },
			{ name: 'bureaucracy', data: data.bureaucracy },
			{ name: 'skills', data: data.skills },
			{ name: 'habitDefinitions', data: data.habitDefinitions }
		];

		importCollections.forEach(col => {
			if (!col.data) return;
			col.data.forEach((item: any) => {
				const itemRef = item.id
					? doc(db, 'users', user.uid, col.name, item.id)
					: doc(collection(db, 'users', user.uid, col.name));
				batch.set(itemRef, { ...item, id: item.id || itemRef.id });
			});
		});

		await batch.commit();
		setProfile(data.profile);
	};

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
		const totalCollections = 8; // profile + 7 cols

		const checkLoaded = () => {
			loadedCount++;
			if (loadedCount >= totalCollections) setLoading(false);
		};

		// 1. Profile
		const userDocRef = doc(db, 'users', user.uid);
		const unsubProfile = onSnapshot(userDocRef, (snapshot) => {
			if (snapshot.exists()) {
				setProfile(snapshot.data().profile as Profile);
			} else {
				setProfile(profileData);
			}
			checkLoaded();
		});

		// 2. Academics (Exams)
		const academicsRef = collection(db, 'users', user.uid, 'academics');
		const unsubAcademics = onSnapshot(academicsRef, (snapshot) => {
			const examList: Exam[] = [];
			snapshot.forEach((doc) => {
				examList.push({ ...doc.data(), id: doc.id } as Exam);
			});
			setExams(examList.sort((a, b) => {
				if (!a.exam_date && !b.exam_date) return 0;
				if (!a.exam_date) return 1;
				if (!b.exam_date) return -1;
				return new Date(a.exam_date).getTime() - new Date(b.exam_date).getTime();
			}));
			checkLoaded();
		});

		// 3. Finance
		const financeRef = collection(db, 'users', user.uid, 'finance');
		const unsubFinance = onSnapshot(financeRef, (snapshot) => {
			const list: FinanceEntry[] = [];
			snapshot.forEach((doc) => list.push({ ...doc.data(), id: doc.id } as FinanceEntry));
			setFinances(list);
			checkLoaded();
		});

		// 4. Transactions
		const txRef = collection(db, 'users', user.uid, 'transactions');
		const unsubTx = onSnapshot(txRef, (snapshot) => {
			const list: Transaction[] = [];
			snapshot.forEach((doc) => list.push({ ...doc.data(), id: doc.id } as Transaction));
			setTransactions(list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
			checkLoaded();
		});

		// 5. Bureaucracy
		const burRef = collection(db, 'users', user.uid, 'bureaucracy');
		const unsubBur = onSnapshot(burRef, (snapshot) => {
			const list: BureaucracyDoc[] = [];
			snapshot.forEach((doc) => list.push({ ...doc.data(), id: doc.id } as BureaucracyDoc));
			setBureaucracy(list);
			checkLoaded();
		});

		// 6. Skill Definitions
		const skillRef = collection(db, 'users', user.uid, 'skills');
		const unsubSkills = onSnapshot(skillRef, (snapshot) => {
			const list: SkillDefinition[] = [];
			snapshot.forEach((doc) => list.push({ ...doc.data(), id: doc.id } as SkillDefinition));
			setSkillDefinitions(list);
			checkLoaded();
		});

		// 7. Habit Definitions
		const habitDefRef = collection(db, 'users', user.uid, 'habitDefinitions');
		const unsubHabitDefs = onSnapshot(habitDefRef, (snapshot) => {
			const list: HabitDefinition[] = [];
			snapshot.forEach((doc) => list.push({ ...doc.data(), id: doc.id } as HabitDefinition));
			setHabitDefinitions(list);
			checkLoaded();
		});

		// 8. Lifestyle (Habit Entries)
		const lifestyleRef = collection(db, 'users', user.uid, 'lifestyle');
		const unsubLifestyle = onSnapshot(lifestyleRef, (snapshot) => {
			const list: HabitEntry[] = [];
			snapshot.forEach((doc) => list.push({ ...doc.data(), date: doc.id } as HabitEntry));
			setHabits(list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
			checkLoaded();
		});

		return () => {
			unsubProfile();
			unsubAcademics();
			unsubFinance();
			unsubTx();
			unsubBur();
			unsubSkills();
			unsubHabitDefs();
			unsubLifestyle();
		};
	}, [user]);

	// Operations
	const updateProfile = async (data: Partial<Profile>) => {
		if (!user) return;
		const userDocRef = doc(db, 'users', user.uid);
		await updateDoc(userDocRef, { profile: { ...profile, ...data } });
	};

	const updateExamStatus = async (examId: string, status: Exam['status']) => {
		if (!user) return;
		const examRef = doc(db, 'users', user.uid, 'academics', examId);
		await updateDoc(examRef, { status });
		// Scholarship unlock logic handled manually/separately to save complexity here
	};

	const updateExam = async (examId: string, data: Partial<Exam>) => {
		if (!user) return;
		await updateDoc(doc(db, 'users', user.uid, 'academics', examId), data);
	};

	const addExam = async (exam: Omit<Exam, 'id' | 'createdAt'>) => {
		if (!user) return;
		await addDoc(collection(db, 'users', user.uid, 'academics'), { ...exam, createdAt: new Date().toISOString() });
	};

	const deleteExam = async (examId: string) => {
		if (!user) return;
		await deleteDoc(doc(db, 'users', user.uid, 'academics', examId));
	};

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

	const addHabitDefinition = async (def: Omit<HabitDefinition, 'id' | 'createdAt'>) => {
		if (!user) return;
		await addDoc(collection(db, 'users', user.uid, 'habitDefinitions'), { ...def, createdAt: new Date().toISOString() });
	};

	const updateHabitDefinition = async (id: string, data: Partial<HabitDefinition>) => {
		if (!user) return;
		await updateDoc(doc(db, 'users', user.uid, 'habitDefinitions', id), data);
	};

	const deleteHabitDefinition = async (id: string) => {
		if (!user) return;
		await deleteDoc(doc(db, 'users', user.uid, 'habitDefinitions', id));
	};

	const addSkillDefinition = async (def: Omit<SkillDefinition, 'id' | 'createdAt'>) => {
		if (!user) return;
		await addDoc(collection(db, 'users', user.uid, 'skills'), { ...def, createdAt: new Date().toISOString() });
	};

	const updateSkillDefinition = async (id: string, data: Partial<SkillDefinition>) => {
		if (!user) return;
		await updateDoc(doc(db, 'users', user.uid, 'skills', id), data);
	};

	const deleteSkillDefinition = async (id: string) => {
		if (!user) return;
		await deleteDoc(doc(db, 'users', user.uid, 'skills', id));
	};

	const updateFinance = async (id: string, data: Partial<FinanceEntry>) => {
		if (!user) return;
		await updateDoc(doc(db, 'users', user.uid, 'finance', id), data);
	};

	const addFinance = async (entry: Omit<FinanceEntry, 'id'>) => {
		if (!user) return;
		await addDoc(collection(db, 'users', user.uid, 'finance'), entry);
	};

	const deleteFinance = async (id: string) => {
		if (!user) return;
		await deleteDoc(doc(db, 'users', user.uid, 'finance', id));
	};

	const addTransaction = async (tx: Omit<Transaction, 'id'>) => {
		if (!user) return;
		await addDoc(collection(db, 'users', user.uid, 'transactions'), tx);
	};

	const updateTransaction = async (id: string, data: Partial<Transaction>) => {
		if (!user) return;
		await updateDoc(doc(db, 'users', user.uid, 'transactions', id), data);
	};

	const deleteTransaction = async (id: string) => {
		if (!user) return;
		await deleteDoc(doc(db, 'users', user.uid, 'transactions', id));
	};

	const updateBureaucracy = async (docId: string, data: Partial<BureaucracyDoc>) => {
		if (!user) return;
		await updateDoc(doc(db, 'users', user.uid, 'bureaucracy', docId), data);
	};

	const addBureaucracy = async (docData: Omit<BureaucracyDoc, 'id'>) => {
		if (!user) return;
		await addDoc(collection(db, 'users', user.uid, 'bureaucracy'), docData);
	};

	const deleteBureaucracy = async (id: string) => {
		if (!user) return;
		await deleteDoc(doc(db, 'users', user.uid, 'bureaucracy', id));
	};

	// Calculations
	const getPassedCFUs = useCallback(() => {
		return exams
			.filter(e => e.status === 'passed' && e.is_scholarship_critical)
			.reduce((sum, e) => sum + e.cfu, 0);
	}, [exams]);

	const getUnlockedMoney = useCallback(() => {
		return finances.filter(f => f.status === 'received').reduce((sum, f) => sum + f.amount, 0);
	}, [finances]);

	const getLockedMoney = useCallback(() => {
		return finances.filter(f => f.status === 'locked').reduce((sum, f) => sum + f.amount, 0);
	}, [finances]);

	const getPendingMoney = useCallback(() => {
		return finances.filter(f => f.status === 'pending').reduce((sum, f) => sum + f.amount, 0);
	}, [finances]);

	const getMonthlyIncome = useCallback((year: number, month: number) => {
		return transactions
			.filter(tx => tx.type === 'income' && new Date(tx.date).getFullYear() === year && new Date(tx.date).getMonth() === month)
			.reduce((sum, tx) => sum + tx.amount, 0);
	}, [transactions]);

	const getMonthlyExpenses = useCallback((year: number, month: number) => {
		return transactions
			.filter(tx => tx.type === 'expense' && new Date(tx.date).getFullYear() === year && new Date(tx.date).getMonth() === month)
			.reduce((sum, tx) => sum + tx.amount, 0);
	}, [transactions]);

	const getNetBalance = useCallback(() => {
		const inc = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
		const exp = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
		return inc - exp;
	}, [transactions]);

	const getGlobalStatus = useCallback((): 'green' | 'yellow' | 'red' => {
		// Simplified status logic
		const hasCritical = bureaucracy.some(d => d.is_critical && (d.status === 'expired' || d.status === 'unknown'));
		if (hasCritical) return 'red';
		return 'green';
	}, [bureaucracy]);


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
			getNetBalance,
			exportData,
			importData,
			hardResetData
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
