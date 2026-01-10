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
	type FullUserData, type Job, type Education, type Campaign,
	profileData,
	validateImportData
} from '../lib/seedData';
import { calculateSkillAnalytics, calculateAllSkillAnalytics, type SkillAnalytics } from '../lib/skillAlgorithm';

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
	// v5.0 additions
	jobs: Job[];
	education: Education[];
	campaigns: Campaign[];
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

	// v5.0 Career
	addJob: (job: Omit<Job, 'id'>) => Promise<void>;
	updateJob: (id: string, data: Partial<Job>) => Promise<void>;
	deleteJob: (id: string) => Promise<void>;
	addEducation: (edu: Omit<Education, 'id'>) => Promise<void>;
	updateEducation: (id: string, data: Partial<Education>) => Promise<void>;
	deleteEducation: (id: string) => Promise<void>;

	// v5.0 Strategy
	addCampaign: (campaign: Omit<Campaign, 'id'>) => Promise<void>;
	updateCampaign: (id: string, data: Partial<Campaign>) => Promise<void>;
	deleteCampaign: (id: string) => Promise<void>;
	getActiveCampaign: () => Campaign | null;

	// Derived calculations
	getPassedCFUs: () => number;
	getUnlockedMoney: () => number;
	getLockedMoney: () => number;
	getPendingMoney: () => number;
	getGlobalStatus: () => 'green' | 'yellow' | 'red';
	getMonthlyIncome: (year: number, month: number) => number;
	getMonthlyExpenses: (year: number, month: number) => number;
	getNetBalance: () => number;
	
	// v6.0 Skill Analytics
	getSkillAnalytics: (skillId: string) => SkillAnalytics | null;
	getAllSkillAnalytics: () => SkillAnalytics[];

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
	// v5.0 additions
	const [jobs, setJobs] = useState<Job[]>([]);
	const [education, setEducation] = useState<Education[]>([]);
	const [campaigns, setCampaigns] = useState<Campaign[]>([]);
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
			habitDefinitions: habitDefinitions,
			// v5.0 additions
			career: {
				jobs,
				education
			},
			strategy: {
				campaigns
			}
		};
	};

	const hardResetData = async () => {
		if (!user) return;
		const batch = writeBatch(db);

		// Delete all subcollections - v5.0: includes jobs, education, campaigns
		const collections = ['academics', 'finance', 'transactions', 'bureaucracy', 'skills', 'habitDefinitions', 'lifestyle', 'jobs', 'education', 'campaigns'];

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
		// v5.0
		setJobs([]);
		setEducation([]);
		setCampaigns([]);
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
			{ name: 'habitDefinitions', data: data.habitDefinitions },
			// v5.0 Career & Strategy
			{ name: 'jobs', data: data.career?.jobs },
			{ name: 'education', data: data.career?.education },
			{ name: 'campaigns', data: data.strategy?.campaigns }
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
			// v5.0
			setJobs([]);
			setEducation([]);
			setCampaigns([]);
			setLoading(false);
			return;
		}

		setLoading(true);
		let loadedCount = 0;
		const totalCollections = 11; // profile + 7 cols + 3 v5.0 cols

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

		// 9. Jobs (v5.0 Career)
		const jobsRef = collection(db, 'users', user.uid, 'jobs');
		const unsubJobs = onSnapshot(jobsRef, (snapshot) => {
			const list: Job[] = [];
			snapshot.forEach((doc) => list.push({ ...doc.data(), id: doc.id } as Job));
			setJobs(list.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()));
			checkLoaded();
		});

		// 10. Education (v5.0 Career)
		const educationRef = collection(db, 'users', user.uid, 'education');
		const unsubEducation = onSnapshot(educationRef, (snapshot) => {
			const list: Education[] = [];
			snapshot.forEach((doc) => list.push({ ...doc.data(), id: doc.id } as Education));
			setEducation(list.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()));
			checkLoaded();
		});

		// 11. Campaigns (v5.0 Strategy)
		const campaignsRef = collection(db, 'users', user.uid, 'campaigns');
		const unsubCampaigns = onSnapshot(campaignsRef, (snapshot) => {
			const list: Campaign[] = [];
			snapshot.forEach((doc) => list.push({ ...doc.data(), id: doc.id } as Campaign));
			setCampaigns(list.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()));
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
			// v5.0
			unsubJobs();
			unsubEducation();
			unsubCampaigns();
		};
	}, [user]);

	// Operations
	const updateProfile = async (data: Partial<Profile>) => {
		if (!user) throw new Error('User not authenticated');
		try {
			const userDocRef = doc(db, 'users', user.uid);
			await updateDoc(userDocRef, { profile: { ...profile, ...data } });
		} catch (error) {
			console.error('Failed to update profile:', error);
			throw error;
		}
	};

	const updateExamStatus = async (examId: string, status: Exam['status']) => {
		if (!user) throw new Error('User not authenticated');
		try {
			const examRef = doc(db, 'users', user.uid, 'academics', examId);
			await updateDoc(examRef, { status });
		} catch (error) {
			console.error('Failed to update exam status:', error);
			throw error;
		}
	};

	const updateExam = async (examId: string, data: Partial<Exam>) => {
		if (!user) throw new Error('User not authenticated');
		try {
			await updateDoc(doc(db, 'users', user.uid, 'academics', examId), data);
		} catch (error) {
			console.error('Failed to update exam:', error);
			throw error;
		}
	};

	const addExam = async (exam: Omit<Exam, 'id' | 'createdAt'>) => {
		if (!user) throw new Error('User not authenticated');
		try {
			await addDoc(collection(db, 'users', user.uid, 'academics'), { ...exam, createdAt: new Date().toISOString() });
		} catch (error) {
			console.error('Failed to add exam:', error);
			throw error;
		}
	};

	const deleteExam = async (examId: string) => {
		if (!user) throw new Error('User not authenticated');
		try {
			await deleteDoc(doc(db, 'users', user.uid, 'academics', examId));
		} catch (error) {
			console.error('Failed to delete exam:', error);
			throw error;
		}
	};

	const updateHabit = async (date: string, habitData: Partial<HabitEntry>) => {
		if (!user) throw new Error('User not authenticated');
		try {
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
		} catch (error) {
			console.error('Failed to update habit:', error);
			throw error;
		}
	};

	const addHabitDefinition = async (def: Omit<HabitDefinition, 'id' | 'createdAt'>) => {
		if (!user) throw new Error('User not authenticated');
		try {
			await addDoc(collection(db, 'users', user.uid, 'habitDefinitions'), { ...def, createdAt: new Date().toISOString() });
		} catch (error) {
			console.error('Failed to add habit definition:', error);
			throw error;
		}
	};

	const updateHabitDefinition = async (id: string, data: Partial<HabitDefinition>) => {
		if (!user) throw new Error('User not authenticated');
		try {
			await updateDoc(doc(db, 'users', user.uid, 'habitDefinitions', id), data);
		} catch (error) {
			console.error('Failed to update habit definition:', error);
			throw error;
		}
	};

	const deleteHabitDefinition = async (id: string) => {
		if (!user) throw new Error('User not authenticated');
		try {
			await deleteDoc(doc(db, 'users', user.uid, 'habitDefinitions', id));
		} catch (error) {
			console.error('Failed to delete habit definition:', error);
			throw error;
		}
	};

	const addSkillDefinition = async (def: Omit<SkillDefinition, 'id' | 'createdAt'>) => {
		if (!user) throw new Error('User not authenticated');
		try {
			await addDoc(collection(db, 'users', user.uid, 'skills'), { ...def, createdAt: new Date().toISOString() });
		} catch (error) {
			console.error('Failed to add skill definition:', error);
			throw error;
		}
	};

	const updateSkillDefinition = async (id: string, data: Partial<SkillDefinition>) => {
		if (!user) throw new Error('User not authenticated');
		try {
			await updateDoc(doc(db, 'users', user.uid, 'skills', id), data);
		} catch (error) {
			console.error('Failed to update skill definition:', error);
			throw error;
		}
	};

	const deleteSkillDefinition = async (id: string) => {
		if (!user) throw new Error('User not authenticated');
		try {
			await deleteDoc(doc(db, 'users', user.uid, 'skills', id));
		} catch (error) {
			console.error('Failed to delete skill definition:', error);
			throw error;
		}
	};

	const updateFinance = async (id: string, data: Partial<FinanceEntry>) => {
		if (!user) throw new Error('User not authenticated');
		try {
			await updateDoc(doc(db, 'users', user.uid, 'finance', id), data);
		} catch (error) {
			console.error('Failed to update finance entry:', error);
			throw error;
		}
	};

	const addFinance = async (entry: Omit<FinanceEntry, 'id'>) => {
		if (!user) throw new Error('User not authenticated');
		try {
			await addDoc(collection(db, 'users', user.uid, 'finance'), entry);
		} catch (error) {
			console.error('Failed to add finance entry:', error);
			throw error;
		}
	};

	const deleteFinance = async (id: string) => {
		if (!user) throw new Error('User not authenticated');
		try {
			await deleteDoc(doc(db, 'users', user.uid, 'finance', id));
		} catch (error) {
			console.error('Failed to delete finance entry:', error);
			throw error;
		}
	};

	const addTransaction = async (tx: Omit<Transaction, 'id'>) => {
		if (!user) throw new Error('User not authenticated');
		try {
			await addDoc(collection(db, 'users', user.uid, 'transactions'), tx);
		} catch (error) {
			console.error('Failed to add transaction:', error);
			throw error;
		}
	};

	const updateTransaction = async (id: string, data: Partial<Transaction>) => {
		if (!user) throw new Error('User not authenticated');
		try {
			await updateDoc(doc(db, 'users', user.uid, 'transactions', id), data);
		} catch (error) {
			console.error('Failed to update transaction:', error);
			throw error;
		}
	};

	const deleteTransaction = async (id: string) => {
		if (!user) throw new Error('User not authenticated');
		try {
			await deleteDoc(doc(db, 'users', user.uid, 'transactions', id));
		} catch (error) {
			console.error('Failed to delete transaction:', error);
			throw error;
		}
	};

	const updateBureaucracy = async (docId: string, data: Partial<BureaucracyDoc>) => {
		if (!user) throw new Error('User not authenticated');
		try {
			await updateDoc(doc(db, 'users', user.uid, 'bureaucracy', docId), data);
		} catch (error) {
			console.error('Failed to update bureaucracy document:', error);
			throw error;
		}
	};

	const addBureaucracy = async (docData: Omit<BureaucracyDoc, 'id'>) => {
		if (!user) throw new Error('User not authenticated');
		try {
			await addDoc(collection(db, 'users', user.uid, 'bureaucracy'), docData);
		} catch (error) {
			console.error('Failed to add bureaucracy document:', error);
			throw error;
		}
	};

	const deleteBureaucracy = async (id: string) => {
		if (!user) throw new Error('User not authenticated');
		try {
			await deleteDoc(doc(db, 'users', user.uid, 'bureaucracy', id));
		} catch (error) {
			console.error('Failed to delete bureaucracy document:', error);
			throw error;
		}
	};

	// v5.0 Career Operations
	const addJob = async (job: Omit<Job, 'id'>) => {
		if (!user) throw new Error('User not authenticated');
		try {
			await addDoc(collection(db, 'users', user.uid, 'jobs'), { ...job, createdAt: new Date().toISOString() });
		} catch (error) {
			console.error('Failed to add job:', error);
			throw error;
		}
	};

	const updateJob = async (id: string, data: Partial<Job>) => {
		if (!user) throw new Error('User not authenticated');
		try {
			await updateDoc(doc(db, 'users', user.uid, 'jobs', id), data);
		} catch (error) {
			console.error('Failed to update job:', error);
			throw error;
		}
	};

	const deleteJob = async (id: string) => {
		if (!user) throw new Error('User not authenticated');
		try {
			await deleteDoc(doc(db, 'users', user.uid, 'jobs', id));
		} catch (error) {
			console.error('Failed to delete job:', error);
			throw error;
		}
	};

	const addEducation = async (edu: Omit<Education, 'id'>) => {
		if (!user) throw new Error('User not authenticated');
		try {
			await addDoc(collection(db, 'users', user.uid, 'education'), { ...edu, createdAt: new Date().toISOString() });
		} catch (error) {
			console.error('Failed to add education:', error);
			throw error;
		}
	};

	const updateEducation = async (id: string, data: Partial<Education>) => {
		if (!user) throw new Error('User not authenticated');
		try {
			await updateDoc(doc(db, 'users', user.uid, 'education', id), data);
		} catch (error) {
			console.error('Failed to update education:', error);
			throw error;
		}
	};

	const deleteEducation = async (id: string) => {
		if (!user) throw new Error('User not authenticated');
		try {
			await deleteDoc(doc(db, 'users', user.uid, 'education', id));
		} catch (error) {
			console.error('Failed to delete education:', error);
			throw error;
		}
	};

	// v5.0 Strategy Operations
	const addCampaign = async (campaign: Omit<Campaign, 'id'>) => {
		if (!user) throw new Error('User not authenticated');
		try {
			await addDoc(collection(db, 'users', user.uid, 'campaigns'), { ...campaign, createdAt: new Date().toISOString() });
		} catch (error) {
			console.error('Failed to add campaign:', error);
			throw error;
		}
	};

	const updateCampaign = async (id: string, data: Partial<Campaign>) => {
		if (!user) throw new Error('User not authenticated');
		try {
			await updateDoc(doc(db, 'users', user.uid, 'campaigns', id), data);
		} catch (error) {
			console.error('Failed to update campaign:', error);
			throw error;
		}
	};

	const deleteCampaign = async (id: string) => {
		if (!user) throw new Error('User not authenticated');
		try {
			await deleteDoc(doc(db, 'users', user.uid, 'campaigns', id));
		} catch (error) {
			console.error('Failed to delete campaign:', error);
			throw error;
		}
	};

	const getActiveCampaign = useCallback((): Campaign | null => {
		const now = new Date();
		return campaigns.find(c =>
			c.status === 'active' &&
			new Date(c.startDate) <= now &&
			new Date(c.endDate) >= now
		) || campaigns.find(c => c.status === 'active') || null;
	}, [campaigns]);

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
		// Simplified status logic - includes v5.0 campaign rules
		const hasCritical = bureaucracy.some(d => d.is_critical && (d.status === 'expired' || d.status === 'unknown'));
		if (hasCritical) return 'red';

		// Check for triggered campaign rules
		const activeCampaign = campaigns.find(c => c.status === 'active');
		if (activeCampaign) {
			const hasTriggeredRule = activeCampaign.rules?.some(r => r.status === 'triggered');
			if (hasTriggeredRule) return 'yellow';
		}

		return 'green';
	}, [bureaucracy, campaigns]);

	// v6.0 Skill Analytics
	const getSkillAnalytics = useCallback((skillId: string): SkillAnalytics | null => {
		const skill = skillDefinitions.find(s => s.id === skillId);
		if (!skill) return null;
		return calculateSkillAnalytics(skill, habits);
	}, [skillDefinitions, habits]);

	const getAllSkillAnalytics = useCallback((): SkillAnalytics[] => {
		return calculateAllSkillAnalytics(skillDefinitions, habits);
	}, [skillDefinitions, habits]);


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
			// v5.0
			jobs,
			education,
			campaigns,
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
			// v5.0 Career
			addJob,
			updateJob,
			deleteJob,
			addEducation,
			updateEducation,
			deleteEducation,
			// v5.0 Strategy
			addCampaign,
			updateCampaign,
			deleteCampaign,
			getActiveCampaign,
			// Calculations
			getPassedCFUs,
			getUnlockedMoney,
			getLockedMoney,
			getPendingMoney,
			getGlobalStatus,
			getMonthlyIncome,
			getMonthlyExpenses,
			getNetBalance,
			// v6.0 Skill Analytics
			getSkillAnalytics,
			getAllSkillAnalytics,
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
