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
// v5.0: Enhanced for CV generation (Level + Proficiency)
export interface SkillDefinition {
	id: string;
	name: string;           // "Python", "Italian", "German", etc.
	icon: string;           // Lucide icon name: "code", "languages", "music", etc.
	color: string;          // Neon color: "neon-yellow", "neon-purple", "neon-cyan"
	targetPerDay: string;   // "30 mins", "1 hour", "2 hours"
	trackingOptions: string[]; // ["0 mins", "15 mins", "30 mins", "1 hour", "2 hours"]
	// v5.0 additions
	category?: 'language' | 'frontend' | 'backend' | 'devops' | 'soft-skill' | 'other';
	proficiency_level?: 1 | 2 | 3 | 4 | 5; // 1=Novice, 5=Expert
	years_experience?: number;
	show_on_cv?: boolean;   // Toggle visibility for Career page
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

// Exam component (v5.0) - for project tracking within a course
export interface ExamComponent {
	name: string;           // "Oral", "Written", "Project"
	weight_pct: number;     // 50%
	is_completed: boolean;
	deadline?: string;
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
	// v5.0 additions
	components?: ExamComponent[];  // Project tracking within a course
	createdAt: string;
}

// ============================================================================
// v5.0 CAREER TYPES - CV/Resume data
// ============================================================================

export type JobType = 'full-time' | 'contract' | 'freelance' | 'internship';

export interface Job {
	id: string;
	company: string;          // e.g. "Huxelerate", "Ericsson"
	role: string;             // e.g. "Software Engineer"
	location: string;         // e.g. "Milan, Italy (Remote)"
	type: JobType;
	startDate: string;        // ISO "2025-07-01"
	endDate: string | null;   // null = Present
	salary_gross_yr?: number; // Private data
	currency?: string;        // "EUR", "HUF"
	tech_stack: string[];     // ["C++", "Python", "Docker"]
	achievements?: string[];  // Bullet points for CV generation
	is_current: boolean;
}

export type EducationStatus = 'enrolled' | 'graduated' | 'paused';

export interface Education {
	id: string;
	institution: string;      // e.g. "University of Padova"
	degree: string;           // e.g. "MSc Computer Science"
	status: EducationStatus;
	startDate: string;
	endDate: string | null;
	scholarship_name?: string; // e.g. "Regional Scholarship"
	thesis_title?: string;
}

export interface Career {
	jobs: Job[];
	education: Education[];
}

// ============================================================================
// v5.0 STRATEGY TYPES - Campaign management
// ============================================================================

export type CampaignStatus = 'active' | 'planned' | 'completed' | 'failed';
export type RuleStatus = 'pending' | 'triggered' | 'safe';

export interface CampaignRule {
	condition: string;      // "If Project not assigned by Jan 15"
	action: string;         // "Drop Web Info Mgmt"
	deadline: string;       // "2026-01-15"
	status: RuleStatus;
}

export interface Campaign {
	id: string;
	name: string;             // e.g. "Winter Campaign 2026"
	startDate: string;
	endDate: string;
	status: CampaignStatus;
	focus_areas?: string[];   // ["Academics", "Visa"]
	// The "Kill List" Logic
	linked_exams: string[];   // IDs from 'academics' collection
	linked_docs: string[];    // IDs from 'bureaucracy' collection
	// Strategic Rules (Text based for now)
	rules: CampaignRule[];
}

export interface Strategy {
	campaigns: Campaign[];
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

// ============================================================================
// v5.0 FULL USER DATA - Includes Career and Strategy
// ============================================================================

export interface FullUserData {
	profile: Profile;
	academics: Exam[];
	finance: FinanceEntry[];
	transactions: Transaction[];
	bureaucracy: BureaucracyDoc[];
	skills: SkillDefinition[];
	habitDefinitions: HabitDefinition[];
	// v5.0 additions
	career?: Career;
	strategy?: Strategy;
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
			components: [
				{
					name: "Written",
					weight_pct: 70,
					is_completed: false,
					deadline: "2026-01-01"
				},
				{
					name: "Project",
					weight_pct: 30,
					is_completed: false,
					deadline: "2026-01-15"
				}
			],
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
			category: "backend",
			proficiency_level: 3,
			years_experience: 2,
			show_on_cv: true,
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
	],
	// v5.0 Career data
	career: {
		jobs: [
			{
				id: "job_placeholder",
				company: "Company Name",
				role: "Role Title",
				location: "City, Country",
				type: "full-time",
				startDate: "2024-01-01",
				endDate: null,
				tech_stack: ["TypeScript", "React"],
				achievements: ["Achievement 1", "Achievement 2"],
				is_current: true
			}
		],
		education: [
			{
				id: "edu_placeholder",
				institution: "University Name",
				degree: "Degree Program",
				status: "enrolled",
				startDate: "2024-10-01",
				endDate: "2026-08-30",
				scholarship_name: "Scholarship Name (optional)"
			}
		]
	},
	// v5.0 Strategy data
	strategy: {
		campaigns: [
			{
				id: "campaign_placeholder",
				name: "Campaign Name",
				startDate: "2026-01-10",
				endDate: "2026-02-20",
				status: "planned",
				focus_areas: ["Academics", "Career"],
				linked_exams: [],
				linked_docs: [],
				rules: [
					{
						condition: "Condition to check",
						action: "Action to take",
						deadline: "2026-01-15",
						status: "pending"
					}
				]
			}
		]
	}
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
// VALIDATION LOGIC - v5.0 with Career and Strategy support
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

	// v5.0 Career validation (optional but must be valid if present)
	if (data.career) {
		if (typeof data.career !== 'object') return { valid: false, error: 'Career must be an object' };
		if (data.career.jobs && !Array.isArray(data.career.jobs)) return { valid: false, error: 'Career jobs must be an array' };
		if (data.career.education && !Array.isArray(data.career.education)) return { valid: false, error: 'Career education must be an array' };
	}

	// v5.0 Strategy validation (optional but must be valid if present)
	if (data.strategy) {
		if (typeof data.strategy !== 'object') return { valid: false, error: 'Strategy must be an object' };
		if (data.strategy.campaigns && !Array.isArray(data.strategy.campaigns)) return { valid: false, error: 'Strategy campaigns must be an array' };
	}

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
