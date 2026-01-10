import { doc, getDoc, writeBatch } from 'firebase/firestore';
import { db } from './firebase';

// ============================================================================
// TYPE DEFINITIONS - All data is dynamic and stored in Firestore
// ============================================================================

export interface Profile {
	name: string;
	unipd_id: string;
	cf: string;
	visa_expiry: string;
	university: string;
	degree: string;
}

// Dynamic skill definition - users can add/remove/edit skills
export interface SkillDefinition {
	id: string;
	name: string;           // "Python", "Italian", "German", etc.
	icon: string;           // Lucide icon name: "code", "languages", "music", etc.
	color: string;          // Neon color: "neon-yellow", "neon-purple", "neon-cyan"
	targetPerDay: string;   // "30 mins", "1 hour", "2 hours"
	trackingOptions: string[]; // ["0 mins", "15 mins", "30 mins", "1 hour", "2 hours"]
	createdAt: string;
}

// Dynamic habit definition - users can add/remove/edit habits
export interface HabitDefinition {
	id: string;
	name: string;           // "Gym Session", "Deep Work", "Meditation"
	icon: string;           // Lucide icon name
	color: string;          // Neon color token
	trackingType: 'boolean' | 'hours' | 'count';
	target?: number;        // Target value (e.g., 4 for 4h deep work, 8 for 8h sleep)
	maxValue?: number;      // For hours/count: max selectable value
	createdAt: string;
}

// Exam with full state machine support
export interface Exam {
	id: string;
	name: string;
	cfu: number;
	status: 'study_plan' | 'enrolled' | 'planned' | 'booked' | 'passed' | 'dropped';
	exam_date: string | null;  // null = TBD (date not yet known)
	strategy_notes: string;
	is_scholarship_critical: boolean;
	category: string;
	createdAt: string;
}

// Scholarship/Funding entries
export interface FinanceEntry {
	id: string;
	source: string;
	type: 'income' | 'expense';
	amount: number;
	status: 'received' | 'pending' | 'locked';
	unlock_condition: string;
	expected_date: string;
}

// Cashflow transactions
export interface Transaction {
	id: string;
	date: string;
	description: string;
	amount: number;
	type: 'income' | 'expense';
	category: 'salary' | 'freelance' | 'scholarship' | 'rent' | 'utilities' | 'food' | 'transport' | 'entertainment' | 'health' | 'education' | 'other';
	recurring: boolean;
	notes?: string;
}

// Bureaucracy documents
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

// Dynamic habit entry - uses IDs from definitions, not hardcoded keys
export interface HabitEntry {
	date: string;
	habits: Record<string, number | boolean>;  // { [habitId]: value }
	skills: Record<string, string>;            // { [skillId]: "30 mins" }
}

export interface FullUserData {
	profile: Profile;
	academics: Exam[];
	finance: FinanceEntry[];
	transactions: Transaction[];
	bureaucracy: BureaucracyDoc[];
	skills: SkillDefinition[];
	habitDefinitions: HabitDefinition[];
}

export const BLUEPRINT_TEMPLATE: FullUserData = {
	profile: {
		name: "",
		unipd_id: "",
		cf: "",
		visa_expiry: "",
		university: "",
		degree: ""
	},
	academics: [
		{
			id: "exam_id_placeholder",
			name: "Exam Name",
			cfu: 6,
			status: "planned", // 'study_plan' | 'enrolled' | 'planned' | 'booked' | 'passed' | 'dropped'
			exam_date: "2026-01-01T09:00:00",
			strategy_notes: "Study strategy here",
			is_scholarship_critical: true,
			category: "Mandatory Core",
			createdAt: new Date().toISOString()
		}
	],
	finance: [
		{
			id: "income_id_placeholder",
			source: "Scholarship / Job",
			type: "income", // 'income' | 'expense'
			amount: 0,
			status: "pending", // 'received' | 'pending' | 'locked'
			unlock_condition: "Condition to unlock",
			expected_date: "2026-01-01"
		}
	],
	transactions: [
		{
			id: "tx_id_placeholder",
			date: "2026-01-01",
			description: "Transaction description",
			amount: 0,
			type: "expense", // 'income' | 'expense'
			category: "food", // 'salary' | 'freelance' | 'scholarship' | 'rent' | 'utilities' | 'food' | 'transport' | 'entertainment' | 'health' | 'education' | 'other'
			recurring: false,
			notes: "Optional notes"
		}
	],
	bureaucracy: [
		{
			id: "doc_id_placeholder",
			name: "Document Name",
			type: "other", // 'visa' | 'residence_permit' | 'tax' | 'insurance' | 'university' | 'other'
			status: "valid", // 'valid' | 'expiring_soon' | 'expired' | 'pending' | 'unknown'
			issue_date: "2025-01-01",
			expiry_date: "2026-01-01",
			notes: "Document notes",
			is_critical: false
		}
	],
	skills: [
		{
			id: "skill_id_placeholder",
			name: "Skill Name",
			icon: "code", // Lucide icon name
			color: "neon-cyan",
			targetPerDay: "30 mins",
			trackingOptions: ["0 mins", "15 mins", "30 mins"],
			createdAt: new Date().toISOString()
		}
	],
	habitDefinitions: [
		{
			id: "habit_id_placeholder",
			name: "Habit Name",
			icon: "activity", // Lucide icon name
			color: "neon-purple",
			trackingType: "boolean", // 'boolean' | 'hours' | 'count'
			createdAt: new Date().toISOString()
		}
	]
};

// ============================================================================
// INITIAL SEED DATA - Only used for first-time setup, never overwrites user data
// ============================================================================

export const profileData: Profile = {
	name: "New User",
	unipd_id: "",
	cf: "",
	visa_expiry: "",
	university: "",
	degree: ""
};

// Default skill definitions (users can modify these)
export const skillDefinitionsData: SkillDefinition[] = [
	{
		id: "python",
		name: "Python",
		icon: "code",
		color: "neon-yellow",
		targetPerDay: "30 mins",
		trackingOptions: ["0 mins", "15 mins", "30 mins", "1 hour", "2 hours"],
		createdAt: new Date().toISOString()
	},
	{
		id: "italian",
		name: "Italian",
		icon: "languages",
		color: "neon-purple",
		targetPerDay: "20 mins",
		trackingOptions: ["0 mins", "10 mins", "20 mins", "30 mins", "1 hour"],
		createdAt: new Date().toISOString()
	}
];

// Default habit definitions (users can modify these)
export const habitDefinitionsData: HabitDefinition[] = [
	{
		id: "gym_session",
		name: "Gym Session",
		icon: "dumbbell",
		color: "neon-green",
		trackingType: "boolean",
		createdAt: new Date().toISOString()
	},
	{
		id: "deep_work_hours",
		name: "Deep Work",
		icon: "brain",
		color: "neon-cyan",
		trackingType: "hours",
		target: 4,
		maxValue: 8,
		createdAt: new Date().toISOString()
	},
	{
		id: "sleep_hours",
		name: "Sleep",
		icon: "moon",
		color: "neon-purple",
		trackingType: "hours",
		target: 8,
		maxValue: 12,
		createdAt: new Date().toISOString()
	}
];

export const examsData: Exam[] = [
	{
		id: "computability",
		name: "Computability",
		cfu: 6,
		status: "booked",
		exam_date: "2026-01-23T09:00:00",
		strategy_notes: "Main Event. 13 days deep work.",
		is_scholarship_critical: true,
		category: "Mandatory Core",
		createdAt: new Date().toISOString()
	},
	{
		id: "economics",
		name: "Economics",
		cfu: 6,
		status: "planned",
		exam_date: "2026-01-27T09:00:00",
		strategy_notes: "Easy Win",
		is_scholarship_critical: true,
		category: "Mandatory Core",
		createdAt: new Date().toISOString()
	},
	{
		id: "web_info_mgmt",
		name: "Web Info Management",
		cfu: 6,
		status: "planned",
		exam_date: "2026-01-30T09:00:00",
		strategy_notes: "KILL SWITCH if no project",
		is_scholarship_critical: true,
		category: "Mandatory Core",
		createdAt: new Date().toISOString()
	},
	{
		id: "sw_verification",
		name: "Software Verification",
		cfu: 6,
		status: "booked",
		exam_date: "2026-02-03T09:00:00",
		strategy_notes: "Oral Exam",
		is_scholarship_critical: true,
		category: "Mandatory Core",
		createdAt: new Date().toISOString()
	},
	{
		id: "runtimes",
		name: "Runtimes",
		cfu: 6,
		status: "booked",
		exam_date: "2026-02-20T09:00:00",
		strategy_notes: "Project based",
		is_scholarship_critical: true,
		category: "Mandatory Core",
		createdAt: new Date().toISOString()
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
		notes: "Permanent, no expiry",
		is_critical: false
	},
	{
		id: "uni_enrollment",
		name: "University Enrollment",
		type: "university",
		status: "valid",
		issue_date: "2025-09-01",
		expiry_date: "2026-09-30",
		notes: "Academic Year Enrollment",
		is_critical: true
	},
	{
		id: "health_insurance",
		name: "Health Coverage",
		type: "insurance",
		status: "pending",
		notes: "Verify health system registration",
		is_critical: true
	}
];

// ============================================================================
// SEED FUNCTION - Only seeds collections that don't exist yet
// ============================================================================

export async function seedUserData(userId: string): Promise<boolean> {
	try {
		const batch = writeBatch(db);

		// Check user document for initialization flag
		const userDocRef = doc(db, 'users', userId);
		const userDocSnap = await getDoc(userDocRef);

		// If user is already initialized, DO NOT SEED anything automatically
		if (userDocSnap.exists()) {
			return true;
		}

		console.log('User not initialized. Creating empty profile...');

		// JUST create the Profile. NO demo data in subcollections.
		batch.set(userDocRef, {
			profile: profileData, // "New User" default profile
			isInitialized: true,
			createdAt: new Date().toISOString()
		});

		await batch.commit();
		console.log('Empty profile initialized successfully.');

		return true;
	} catch (error) {
		console.error('Error initializing user profile:', error);
		return false;
	}
}
