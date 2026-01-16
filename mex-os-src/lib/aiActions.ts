export type ActionType = 'SUGGEST_CAMPAIGN' | 'SUGGEST_EXAM' | 'SUGGEST_SKILL' | 'SUGGEST_HABIT';

export interface SuggestCampaignData {
	name: string;
	focus_areas: string[];
	duration_weeks: number;
}

export interface SuggestExamData {
	name: string;
	cfu: number;
	difficulty: 'easy' | 'medium' | 'hard';
	semester: number;
}

export interface SuggestSkillData {
	name: string;
	category: string;
	target_level: number; // 1-100
}

export interface SuggestHabitData {
	name: string;
	category: string;
	frequency: 'daily' | 'weekly';
}

export interface AIAction {
	type: ActionType;
	reason: string;
	data: SuggestCampaignData | SuggestExamData | SuggestSkillData | SuggestHabitData;
}
