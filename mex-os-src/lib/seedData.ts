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

// ============================================================================
// VALIDATION LOGIC
// ============================================================================

export function validateImportData(data: any): { valid: boolean; error?: string } {
	if (!data || typeof data !== 'object') return { valid: false, error: 'Invalid JSON format' };

	const requiredKeys = ['profile', 'academics', 'finance', 'transactions', 'bureaucracy', 'skills', 'habitDefinitions'];
	for (const key of requiredKeys) {
		if (!(key in data)) return { valid: false, error: `Missing required section: ${key}` };
	}

	// Basic Type Checks (Soft validation to allow for user customizations, but ensure structure)
	if (typeof data.profile.name !== 'string') return { valid: false, error: 'Profile name is missing or invalid' };
	if (!Array.isArray(data.academics)) return { valid: false, error: 'Academics must be an array' };
	if (!Array.isArray(data.finance)) return { valid: false, error: 'Finance must be an array' };
	if (!Array.isArray(data.transactions)) return { valid: false, error: 'Transactions must be an array' };
	if (!Array.isArray(data.bureaucracy)) return { valid: false, error: 'Bureaucracy must be an array' };
	if (!Array.isArray(data.skills)) return { valid: false, error: 'Skills must be an array' };
	if (!Array.isArray(data.habitDefinitions)) return { valid: false, error: 'HabitDefinitions must be an array' };

	return { valid: true };
}

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
