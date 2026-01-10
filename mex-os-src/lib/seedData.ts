import { doc, collection, getDocs, writeBatch } from 'firebase/firestore';
import { db } from './firebase';

export interface Profile {
	name: string;
	unipd_id: string;
	cf: string;
	visa_expiry: string;
	ranking_position: number;
}

export interface Exam {
	id: string;
	name: string;
	cfu: number;
	status: 'booked' | 'enrolled' | 'passed' | 'dropped' | 'intel';
	exam_date: string;
	strategy_notes: string;
	is_scholarship_critical: boolean;
	category: string;
}

export interface FinanceEntry {
	id: string;
	source: string;
	type: 'income' | 'expense';
	amount: number;
	status: 'received' | 'pending' | 'locked';
	unlock_condition: string;
	expected_date: string;
}

export interface HabitEntry {
	date: string;
	habits: {
		deep_work_hours: number;
		sleep_hours: number;
		gym_session: boolean;
		calories: number;
	};
	skills: {
		python_practice: string;
		italian_practice: string;
	};
}

// Real data from prompt.md
export const profileData: Profile = {
	name: "Mex Jafarov",
	unipd_id: "2195746",
	cf: "JFRMHL01S1522530",
	visa_expiry: "UNKNOWN (Warning)",
	ranking_position: 60
};

export const examsData: Exam[] = [
	{
		id: "computability",
		name: "Computability",
		cfu: 6,
		status: "booked",
		exam_date: "2026-01-23T09:00:00",
		strategy_notes: "Main Event. 13 days deep work.",
		is_scholarship_critical: true,
		category: "Mandatory Core"
	},
	{
		id: "economics",
		name: "Economics",
		cfu: 6,
		status: "intel",
		exam_date: "2026-01-27T09:00:00",
		strategy_notes: "Easy Win",
		is_scholarship_critical: true,
		category: "Mandatory Core"
	},
	{
		id: "web_info_mgmt",
		name: "Web Info Management",
		cfu: 6,
		status: "intel",
		exam_date: "2026-01-30T09:00:00",
		strategy_notes: "KILL SWITCH if no project",
		is_scholarship_critical: true,
		category: "Mandatory Core"
	},
	{
		id: "sw_verification",
		name: "Software Verification",
		cfu: 6,
		status: "booked",
		exam_date: "2026-02-03T09:00:00",
		strategy_notes: "Oral Exam",
		is_scholarship_critical: true,
		category: "Mandatory Core"
	},
	{
		id: "runtimes",
		name: "Runtimes",
		cfu: 6,
		status: "booked",
		exam_date: "2026-02-20T09:00:00",
		strategy_notes: "Project based",
		is_scholarship_critical: true,
		category: "Mandatory Core"
	}
];

export const financeData: FinanceEntry[] = [
	{
		id: "installment_1_base",
		source: "Regional Scholarship",
		type: "income",
		amount: 2106.39,
		status: "received",
		unlock_condition: "None - Base installment",
		expected_date: "2025-12-15"
	},
	{
		id: "offsite_bonus",
		source: "Regional Scholarship",
		type: "income",
		amount: 3160.14,
		status: "pending",
		unlock_condition: "Rent Check Positive",
		expected_date: "2026-02-15"
	},
	{
		id: "installment_2_merit",
		source: "Regional Scholarship",
		type: "income",
		amount: 2106.39,
		status: "locked",
		unlock_condition: "20 CFUs needed",
		expected_date: "2026-03-15"
	}
];

export const initialHabitData: HabitEntry = {
	date: new Date().toISOString().split('T')[0],
	habits: {
		deep_work_hours: 0,
		sleep_hours: 0,
		gym_session: false,
		calories: 0
	},
	skills: {
		python_practice: "0 mins",
		italian_practice: "0 mins"
	}
};

export async function seedUserData(userId: string): Promise<boolean> {
	try {
		// Check if data already exists
		const userDocRef = doc(db, 'users', userId);
		const academicsRef = collection(db, 'users', userId, 'academics');
		const academicsSnapshot = await getDocs(academicsRef);

		if (!academicsSnapshot.empty) {
			console.log('Data already exists, skipping seed');
			return false;
		}

		const batch = writeBatch(db);

		// Seed profile
		batch.set(userDocRef, { profile: profileData });

		// Seed exams
		for (const exam of examsData) {
			const examRef = doc(db, 'users', userId, 'academics', exam.id);
			batch.set(examRef, exam);
		}

		// Seed finance
		for (const entry of financeData) {
			const financeRef = doc(db, 'users', userId, 'finance', entry.id);
			batch.set(financeRef, entry);
		}

		// Seed initial habit entry
		const habitRef = doc(db, 'users', userId, 'lifestyle', initialHabitData.date);
		batch.set(habitRef, initialHabitData);

		await batch.commit();
		console.log('Seed data uploaded successfully');
		return true;
	} catch (error) {
		console.error('Error seeding data:', error);
		throw error;
	}
}
