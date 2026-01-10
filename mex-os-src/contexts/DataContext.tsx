import { createContext, useContext, useEffect, useState, type ReactNode, useCallback } from 'react';
import {
	collection,
	doc,
	onSnapshot,
	updateDoc,
	setDoc,
	getDoc
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from './AuthContext';
import { type Profile, type Exam, type FinanceEntry, type HabitEntry, profileData } from '../lib/seedData';

interface DataContextType {
	profile: Profile | null;
	exams: Exam[];
	finances: FinanceEntry[];
	habits: HabitEntry[];
	loading: boolean;
	updateExamStatus: (examId: string, status: Exam['status']) => Promise<void>;
	updateHabit: (date: string, habitData: Partial<HabitEntry>) => Promise<void>;
	getPassedCFUs: () => number;
	getUnlockedMoney: () => number;
	getLockedMoney: () => number;
	getPendingMoney: () => number;
	getGlobalStatus: () => 'green' | 'yellow' | 'red';
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
	const { user } = useAuth();
	const [profile, setProfile] = useState<Profile | null>(null);
	const [exams, setExams] = useState<Exam[]>([]);
	const [finances, setFinances] = useState<FinanceEntry[]>([]);
	const [habits, setHabits] = useState<HabitEntry[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		if (!user) {
			setProfile(null);
			setExams([]);
			setFinances([]);
			setHabits([]);
			setLoading(false);
			return;
		}

		setLoading(true);

		// Subscribe to profile
		const userDocRef = doc(db, 'users', user.uid);
		const unsubProfile = onSnapshot(userDocRef, (snapshot) => {
			if (snapshot.exists()) {
				setProfile(snapshot.data().profile as Profile);
			} else {
				setProfile(profileData);
			}
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
		});

		// Subscribe to finance
		const financeRef = collection(db, 'users', user.uid, 'finance');
		const unsubFinance = onSnapshot(financeRef, (snapshot) => {
			const financeList: FinanceEntry[] = [];
			snapshot.forEach((doc) => {
				financeList.push({ ...doc.data(), id: doc.id } as FinanceEntry);
			});
			setFinances(financeList);
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
			setLoading(false);
		});

		return () => {
			unsubProfile();
			unsubAcademics();
			unsubFinance();
			unsubLifestyle();
		};
	}, [user]);

	const updateExamStatus = async (examId: string, status: Exam['status']) => {
		if (!user) return;
		const examRef = doc(db, 'users', user.uid, 'academics', examId);
		await updateDoc(examRef, { status });

		// Update scholarship unlock if 20 CFUs reached
		const passedCFUs = getPassedCFUs() + (status === 'passed' ?
			(exams.find(e => e.id === examId)?.cfu || 0) : 0);

		if (passedCFUs >= 20) {
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

	const getGlobalStatus = useCallback((): 'green' | 'yellow' | 'red' => {
		const now = new Date();
		const nextExam = exams.find(e => new Date(e.exam_date) > now && e.status !== 'passed');

		if (!nextExam) return 'green';

		const daysUntil = Math.ceil(
			(new Date(nextExam.exam_date).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
		);

		const passedCFUs = getPassedCFUs();

		// Red: Less than 7 days to exam or visa warning
		if (daysUntil <= 7 || profile?.visa_expiry.includes('WARNING')) {
			return 'red';
		}

		// Yellow: Less than 14 days or low CFU progress
		if (daysUntil <= 14 || passedCFUs < 10) {
			return 'yellow';
		}

		return 'green';
	}, [exams, profile, getPassedCFUs]);

	return (
		<DataContext.Provider value={{
			profile,
			exams,
			finances,
			habits,
			loading,
			updateExamStatus,
			updateHabit,
			getPassedCFUs,
			getUnlockedMoney,
			getLockedMoney,
			getPendingMoney,
			getGlobalStatus
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
