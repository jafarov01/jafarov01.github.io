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

// Scholarship/Funding entries (existing)
export interface FinanceEntry {
	id: string;
	source: string;
	type: 'income' | 'expense';
	amount: number;
	status: 'received' | 'pending' | 'locked';
	unlock_condition: string;
	expected_date: string;
}

// NEW: Cashflow transactions
export interface Transaction {
	id: string;
	date: string;
	description: string;
	amount: number;
	type: 'income' | 'expense';
	category: 'salary' | 'freelance' | 'rent' | 'utilities' | 'food' | 'transport' | 'entertainment' | 'other';
	recurring: boolean;
	notes?: string;
}

// NEW: Bureaucracy documents
export interface BureaucracyDoc {
	id: string;
	name: string;
	type: 'visa' | 'residence_permit' | 'tax' | 'insurance' | 'university' | 'other';
	status: 'valid' | 'expiring_soon' | 'expired' | 'pending' | 'unknown';
	issue_date?: string;
	expiry_date?: string;
	notes: string;
	is_critical: boolean;
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

// NEW: Sample transactions for cashflow
export const transactionsData: Transaction[] = [
	{
		id: "tx_salary_jan",
		date: "2026-01-05",
		description: "Remote Job Salary",
		amount: 1500,
		type: "income",
		category: "salary",
		recurring: true,
		notes: "Monthly remote work income"
	},
	{
		id: "tx_rent_jan",
		date: "2026-01-01",
		description: "Padova Rent",
		amount: 450,
		type: "expense",
		category: "rent",
		recurring: true
	},
	{
		id: "tx_groceries_jan",
		date: "2026-01-08",
		description: "Weekly Groceries",
		amount: 85,
		type: "expense",
		category: "food",
		recurring: false
	},
	{
		id: "tx_transport_jan",
		date: "2026-01-03",
		description: "Monthly Transport Pass",
		amount: 35,
		type: "expense",
		category: "transport",
		recurring: true
	}
];

// NEW: Bureaucracy documents
export const bureaucracyData: BureaucracyDoc[] = [
	{
		id: "visa_permit",
		name: "Student Visa / Residence Permit",
		type: "visa",
		status: "unknown",
		notes: "CRITICAL: Expiry date unknown. Must verify immediately.",
		is_critical: true
	},
	{
		id: "codice_fiscale",
		name: "Codice Fiscale",
		type: "tax",
		status: "valid",
		issue_date: "2025-09-15",
		notes: "JFRMHL01S1522530 - Permanent, no expiry",
		is_critical: false
	},
	{
		id: "uni_enrollment",
		name: "UniPD Enrollment 2025-2026",
		type: "university",
		status: "valid",
		issue_date: "2025-09-01",
		expiry_date: "2026-09-30",
		notes: "MSc Computer Science - Year 1",
		is_critical: true
	},
	{
		id: "health_insurance",
		name: "EHIC / Health Coverage",
		type: "insurance",
		status: "pending",
		notes: "Verify Italian health system registration",
		is_critical: true
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
		const academicsRef = collection(db, 'users', userId, 'academics');
		const academicsSnapshot = await getDocs(academicsRef);

		if (!academicsSnapshot.empty) {
			// Check if new collections need seeding
			const transactionsRef = collection(db, 'users', userId, 'transactions');
			const transactionsSnapshot = await getDocs(transactionsRef);

			if (transactionsSnapshot.empty) {
				// Seed only new collections for existing users
				console.log('Seeding new collections for existing user...');
				const batch = writeBatch(db);

				for (const tx of transactionsData) {
					const txRef = doc(db, 'users', userId, 'transactions', tx.id);
					batch.set(txRef, tx);
				}

				for (const docEntry of bureaucracyData) {
					const docRef = doc(db, 'users', userId, 'bureaucracy', docEntry.id);
					batch.set(docRef, docEntry);
				}

				await batch.commit();
				console.log('New collections seeded for existing user');
			} else {
				console.log('Data already exists, skipping seed');
			}
			return false;
		}

		const batch = writeBatch(db);
		const userDocRef = doc(db, 'users', userId);

		// Seed profile
		batch.set(userDocRef, { profile: profileData });

		// Seed exams
		for (const exam of examsData) {
			const examRef = doc(db, 'users', userId, 'academics', exam.id);
			batch.set(examRef, exam);
		}

		// Seed scholarship finance
		for (const entry of financeData) {
			const financeRef = doc(db, 'users', userId, 'finance', entry.id);
			batch.set(financeRef, entry);
		}

		// Seed transactions (NEW)
		for (const tx of transactionsData) {
			const txRef = doc(db, 'users', userId, 'transactions', tx.id);
			batch.set(txRef, tx);
		}

		// Seed bureaucracy (NEW)
		for (const docEntry of bureaucracyData) {
			const docRef = doc(db, 'users', userId, 'bureaucracy', docEntry.id);
			batch.set(docRef, docEntry);
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
