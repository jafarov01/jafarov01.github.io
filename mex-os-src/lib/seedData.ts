import { doc, getDoc, writeBatch } from 'firebase/firestore';
import { db } from './firebase';

// ============================================================================
// TYPE DEFINITIONS - All data is dynamic and stored in Firestore
// ============================================================================

export interface Profile {
	name: string;
	// v7.0 CV Contact Info
	professional_title?: string;  // "Software Developer"
	location?: string;            // "Budapest, Hungary"
	email?: string;               // CV contact email
	phone?: string;               // CV contact phone
	linkedin_url?: string;        // LinkedIn profile URL
	github_url?: string;          // GitHub profile URL
	professional_summary?: string; // CV summary paragraph
	// existing fields
	unipd_id: string;
	cf: string;
	visa_expiry: string;
	university: string;
	degree: string;
}

// Dynamic skill definition - users can add/remove/edit skills
// v5.0: Enhanced for CV generation (Level + Proficiency)
// v6.0: Unified Skill Registry - single source of truth for all skills
export interface SkillDefinition {
	id: string;
	name: string;           // "Python", "Italian", "German", etc.
	icon: string;           // Lucide icon name: "code", "languages", "music", etc.
	color: string;          // Neon color: "neon-yellow", "neon-purple", "neon-cyan"
	targetPerDay: string;   // "30 mins", "1 hour", "2 hours"
	trackingOptions: string[]; // ["0 mins", "15 mins", "30 mins", "1 hour", "2 hours"]
	// v5.0 additions
	category?: 'language' | 'frontend' | 'backend' | 'devops' | 'database' | 'tools' | 'soft-skill' | 'other';
	proficiency_level?: 1 | 2 | 3 | 4 | 5; // 1=Novice, 5=Expert (now CALCULATED from practice)
	years_experience?: number;  // Prior experience before tracking started
	show_on_cv?: boolean;   // Toggle visibility for Career page
	// v6.0 additions - Unified Skill Registry
	is_tracked?: boolean;   // Whether to show in Protocol for daily practice tracking
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
export type WorkMode = 'remote' | 'onsite' | 'hybrid';

export interface Job {
	id: string;
	company: string;          // e.g. "Huxelerate", "Ericsson"
	role: string;             // e.g. "Software Engineer"
	location: string;         // e.g. "Milan, Italy (Remote)"
	type: JobType;
	work_mode?: WorkMode;     // v7.0: Remote / Onsite / Hybrid
	startDate: string;        // ISO "2025-07-01"
	endDate: string | null;   // null = Present
	salary_gross_yr?: number; // Private data
	currency?: string;        // "EUR", "HUF"
	tech_stack: string[];     // Skill names from skills collection (e.g., ["Python", "React"])
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
	location?: string;        // v7.0: e.g. "Budapest, Hungary"
	scholarship_name?: string; // e.g. "Regional Scholarship"
	thesis_title?: string;
	thesis_description?: string; // v7.0: Multi-line thesis project description
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
	category: 'salary' | 'freelance' | 'scholarship' | 'gift' | 'refund' | 'other_income' | 'rent' | 'utilities' | 'food' | 'transport' | 'entertainment' | 'health' | 'education' | 'other_expense';
	recurring: boolean;
	notes?: string;
}

// Bureaucracy documents
export interface BureaucracyDoc {
	id: string;
	name: string;
	type: 'visa' | 'residence_permit' | 'tax' | 'insurance' | 'university' | 'mobility' | 'other';
	status: 'valid' | 'expiring_soon' | 'expired' | 'pending' | 'processing' | 'submitted' | 'unknown';
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
		// v7.0 CV Contact Info
		professional_title: "Software Developer",
		location: "City, Country",
		email: "your.email@example.com",
		phone: "+1 234 567 8900",
		linkedin_url: "https://linkedin.com/in/yourprofile",
		github_url: "https://github.com/yourusername",
		professional_summary: "A results-driven Software Engineer with X years of experience...",
		// existing fields
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
			category: "food", // Income: 'salary' | 'freelance' | 'scholarship' | 'gift' | 'refund' | 'other_income' / Expense: 'rent' | 'utilities' | 'food' | 'transport' | 'entertainment' | 'health' | 'education' | 'other_expense'
			recurring: false,
			notes: "Optional notes"
		}
	],
	bureaucracy: [
		{
			id: "doc_id_placeholder",
			name: "Document Name",
			type: "other", // 'visa' | 'residence_permit' | 'tax' | 'insurance' | 'university' | 'mobility' | 'other'
			status: "valid", // 'valid' | 'expiring_soon' | 'expired' | 'pending' | 'processing' | 'submitted' | 'unknown'
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
			trackingOptions: ["0 mins", "15 mins", "30 mins", "1 hour", "2 hours"],
			category: "backend", // 'language' | 'frontend' | 'backend' | 'devops' | 'database' | 'tools' | 'soft-skill' | 'other'
			years_experience: 0, // Prior years of experience before tracking started
			show_on_cv: true, // Show in Career CV Skills section
			is_tracked: true, // Show in Protocol for daily practice
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
				work_mode: "remote", // 'remote' | 'onsite' | 'hybrid'
				startDate: "2024-01-01",
				endDate: null,
				tech_stack: ["Python", "React"], // Skill names from skills collection
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
				location: "City, Country", // v7.0
				scholarship_name: "Scholarship Name (optional)",
				thesis_title: "Thesis Title (optional)",
				thesis_description: "Description of your thesis project..." // v7.0
			}
		]
	},
	// v5.0 Strategy data - v7.0 enhanced with automatic deadline detection
	strategy: {
		campaigns: [
			{
				id: "campaign_placeholder",
				name: "Campaign Name",
				startDate: "2026-01-10",
				endDate: "2026-02-20",
				status: "active", // 'active' | 'planned' | 'completed' | 'failed'
				focus_areas: ["Academics", "Career"],
				linked_exams: [], // IDs from academics - actions can be executed on these
				linked_docs: [],  // IDs from bureaucracy - for reference
				rules: [
					{
						condition: "If project topic NOT assigned by deadline", // Describe the IF condition
						action: "DROP the linked exam", // What to do - DROP/BOOK keywords trigger exam actions
						deadline: "2026-01-15", // When deadline passes, decision modal appears
						status: "pending" // 'pending' | 'triggered' | 'safe'
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
	professional_title: "",
	location: "",
	email: "",
	phone: "",
	linkedin_url: "",
	github_url: "",
	professional_summary: "",
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

	// ============================================================================
	// FIELD-LEVEL VALIDATION
	// ============================================================================

	// Validate academics (exams)
	const validExamStatuses = ['study_plan', 'enrolled', 'planned', 'booked', 'passed', 'dropped'];
	for (const exam of data.academics) {
		if (!exam.name || typeof exam.name !== 'string') {
			return { valid: false, error: `Exam missing required 'name' field` };
		}
		if (typeof exam.cfu !== 'number' || exam.cfu < 0 || exam.cfu > 30) {
			return { valid: false, error: `Invalid CFU value for exam: ${exam.name}. Must be a number between 0 and 30.` };
		}
		if (exam.status && !validExamStatuses.includes(exam.status)) {
			return { valid: false, error: `Invalid status '${exam.status}' for exam: ${exam.name}. Valid values: ${validExamStatuses.join(', ')}` };
		}
		if (exam.exam_date && isNaN(Date.parse(exam.exam_date))) {
			return { valid: false, error: `Invalid date format for exam: ${exam.name}` };
		}
	}

	// Validate transactions
	const validTxCategories = ['salary', 'freelance', 'scholarship', 'gift', 'refund', 'other_income', 'rent', 'utilities', 'food', 'transport', 'entertainment', 'health', 'education', 'other_expense'];
	const validTxTypes = ['income', 'expense'];
	for (const tx of data.transactions) {
		if (!tx.description || typeof tx.description !== 'string') {
			return { valid: false, error: `Transaction missing required 'description' field` };
		}
		if (typeof tx.amount !== 'number' || tx.amount < 0) {
			return { valid: false, error: `Invalid amount for transaction: ${tx.description}. Must be a non-negative number.` };
		}
		if (tx.type && !validTxTypes.includes(tx.type)) {
			return { valid: false, error: `Invalid type '${tx.type}' for transaction: ${tx.description}. Valid values: ${validTxTypes.join(', ')}` };
		}
		if (tx.category && !validTxCategories.includes(tx.category)) {
			return { valid: false, error: `Invalid category '${tx.category}' for transaction: ${tx.description}. Valid values: ${validTxCategories.join(', ')}` };
		}
		if (tx.date && isNaN(Date.parse(tx.date))) {
			return { valid: false, error: `Invalid date format for transaction: ${tx.description}` };
		}
	}

	// Validate bureaucracy documents
	const validDocTypes = ['visa', 'residence_permit', 'tax', 'insurance', 'university', 'mobility', 'other'];
	const validDocStatuses = ['valid', 'expiring_soon', 'expired', 'pending', 'processing', 'submitted', 'unknown'];
	for (const doc of data.bureaucracy) {
		if (!doc.name || typeof doc.name !== 'string') {
			return { valid: false, error: `Bureaucracy document missing required 'name' field` };
		}
		if (doc.type && !validDocTypes.includes(doc.type)) {
			return { valid: false, error: `Invalid type '${doc.type}' for document: ${doc.name}. Valid values: ${validDocTypes.join(', ')}` };
		}
		if (doc.status && !validDocStatuses.includes(doc.status)) {
			return { valid: false, error: `Invalid status '${doc.status}' for document: ${doc.name}. Valid values: ${validDocStatuses.join(', ')}` };
		}
		if (doc.expiry_date && isNaN(Date.parse(doc.expiry_date))) {
			return { valid: false, error: `Invalid expiry date format for document: ${doc.name}` };
		}
		if (doc.issue_date && isNaN(Date.parse(doc.issue_date))) {
			return { valid: false, error: `Invalid issue date format for document: ${doc.name}` };
		}
	}

	// Validate skills (v6.0 Unified Skill Registry)
	const validSkillCategories = ['language', 'frontend', 'backend', 'devops', 'database', 'tools', 'soft-skill', 'other'];
	for (const skill of data.skills) {
		if (!skill.name || typeof skill.name !== 'string') {
			return { valid: false, error: `Skill missing required 'name' field` };
		}
		if (skill.category && !validSkillCategories.includes(skill.category)) {
			return { valid: false, error: `Invalid category '${skill.category}' for skill: ${skill.name}. Valid values: ${validSkillCategories.join(', ')}` };
		}
		if (skill.years_experience !== undefined && (typeof skill.years_experience !== 'number' || skill.years_experience < 0)) {
			return { valid: false, error: `Invalid years_experience for skill: ${skill.name}. Must be a non-negative number.` };
		}
		if (skill.is_tracked !== undefined && typeof skill.is_tracked !== 'boolean') {
			return { valid: false, error: `Invalid is_tracked for skill: ${skill.name}. Must be a boolean.` };
		}
		if (skill.show_on_cv !== undefined && typeof skill.show_on_cv !== 'boolean') {
			return { valid: false, error: `Invalid show_on_cv for skill: ${skill.name}. Must be a boolean.` };
		}
		// Deprecated: proficiency_level is now calculated, but accept it for backwards compatibility
	}

	// Validate habit definitions
	const validTrackingTypes = ['boolean', 'hours', 'count'];
	for (const habit of data.habitDefinitions) {
		if (!habit.name || typeof habit.name !== 'string') {
			return { valid: false, error: `Habit definition missing required 'name' field` };
		}
		if (habit.trackingType && !validTrackingTypes.includes(habit.trackingType)) {
			return { valid: false, error: `Invalid tracking type '${habit.trackingType}' for habit: ${habit.name}. Valid values: ${validTrackingTypes.join(', ')}` };
		}
	}

	// v5.0 Career validation (optional but must be valid if present)
	if (data.career) {
		if (typeof data.career !== 'object') return { valid: false, error: 'Career must be an object' };
		if (data.career.jobs && !Array.isArray(data.career.jobs)) return { valid: false, error: 'Career jobs must be an array' };
		if (data.career.education && !Array.isArray(data.career.education)) return { valid: false, error: 'Career education must be an array' };

		// Validate jobs
		const validJobTypes = ['full-time', 'contract', 'freelance', 'internship'];
		const validWorkModes = ['remote', 'onsite', 'hybrid'];
		for (const job of (data.career.jobs || [])) {
			if (!job.company || typeof job.company !== 'string') {
				return { valid: false, error: `Job missing required 'company' field` };
			}
			if (!job.role || typeof job.role !== 'string') {
				return { valid: false, error: `Job missing required 'role' field for company: ${job.company}` };
			}
			if (job.type && !validJobTypes.includes(job.type)) {
				return { valid: false, error: `Invalid job type '${job.type}' for: ${job.role} at ${job.company}. Valid values: ${validJobTypes.join(', ')}` };
			}
			if (job.work_mode && !validWorkModes.includes(job.work_mode)) {
				return { valid: false, error: `Invalid work mode '${job.work_mode}' for: ${job.role} at ${job.company}. Valid values: ${validWorkModes.join(', ')}` };
			}
			if (job.startDate && isNaN(Date.parse(job.startDate))) {
				return { valid: false, error: `Invalid start date for job: ${job.role} at ${job.company}` };
			}
		}

		// Validate education
		const validEduStatuses = ['enrolled', 'graduated', 'paused'];
		for (const edu of (data.career.education || [])) {
			if (!edu.institution || typeof edu.institution !== 'string') {
				return { valid: false, error: `Education entry missing required 'institution' field` };
			}
			if (edu.status && !validEduStatuses.includes(edu.status)) {
				return { valid: false, error: `Invalid education status '${edu.status}' for: ${edu.institution}. Valid values: ${validEduStatuses.join(', ')}` };
			}
		}
	}

	// v5.0 Strategy validation (optional but must be valid if present)
	// v7.0: Enhanced with rule validation for automatic deadline detection
	if (data.strategy) {
		if (typeof data.strategy !== 'object') return { valid: false, error: 'Strategy must be an object' };
		if (data.strategy.campaigns && !Array.isArray(data.strategy.campaigns)) return { valid: false, error: 'Strategy campaigns must be an array' };

		// Validate campaigns - status is flexible to allow user customization (e.g., 'active_phase_2')
		for (const campaign of (data.strategy.campaigns || [])) {
			if (!campaign.name || typeof campaign.name !== 'string') {
				return { valid: false, error: `Campaign missing required 'name' field` };
			}
			if (campaign.status && typeof campaign.status !== 'string') {
				return { valid: false, error: `Campaign status must be a string for: ${campaign.name}` };
			}
			if (campaign.startDate && isNaN(Date.parse(campaign.startDate))) {
				return { valid: false, error: `Invalid start date for campaign: ${campaign.name}` };
			}
			if (campaign.endDate && isNaN(Date.parse(campaign.endDate))) {
				return { valid: false, error: `Invalid end date for campaign: ${campaign.name}` };
			}

			// v7.0: Validate campaign rules
			if (campaign.rules && Array.isArray(campaign.rules)) {
				for (let i = 0; i < campaign.rules.length; i++) {
					const rule = campaign.rules[i];
					if (!rule.condition || typeof rule.condition !== 'string') {
						return { valid: false, error: `Rule ${i + 1} in campaign '${campaign.name}' missing required 'condition' field` };
					}
					if (!rule.action || typeof rule.action !== 'string') {
						return { valid: false, error: `Rule ${i + 1} in campaign '${campaign.name}' missing required 'action' field` };
					}
					if (!rule.deadline || isNaN(Date.parse(rule.deadline))) {
						return { valid: false, error: `Rule ${i + 1} in campaign '${campaign.name}' has invalid or missing deadline. Format: YYYY-MM-DD` };
					}
					// Rule status is flexible - allows custom suffixes like 'pending_check_jan15'
					if (rule.status && typeof rule.status !== 'string') {
						return { valid: false, error: `Rule status must be a string in campaign '${campaign.name}'` };
					}
				}
			}

			// Validate linked_exams are strings (IDs)
			if (campaign.linked_exams && !Array.isArray(campaign.linked_exams)) {
				return { valid: false, error: `linked_exams must be an array in campaign: ${campaign.name}` };
			}
			if (campaign.linked_docs && !Array.isArray(campaign.linked_docs)) {
				return { valid: false, error: `linked_docs must be an array in campaign: ${campaign.name}` };
			}
		}
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
