import { type SkillDefinition, type HabitEntry } from './seedData';
import { differenceInDays, subDays, format, parseISO } from 'date-fns';

// ============================================================================
// SKILL MASTERY ALGORITHM
// ============================================================================
// This algorithm calculates a skill's proficiency level based on:
// 1. Total practice time (volume)
// 2. Consistency (regularity of practice)
// 3. Streak power (current momentum)
// 4. Recency (recent practice weighted higher)
// 5. Prior experience (years before tracking)
// ============================================================================

export interface SkillAnalytics {
	skillId: string;
	skillName: string;
	
	// Raw metrics
	totalMinutes: number;
	totalHours: number;
	daysPracticed: number;
	daysSinceFirstPractice: number;
	currentStreak: number;
	longestStreak: number;
	lastPracticeDate: string | null;
	
	// Calculated scores
	consistencyPercent: number;    // 0-100
	consistencyMultiplier: number; // 1.0, 1.2, or 1.5
	recencyMultiplier: number;     // 0.9, 1.0, 1.5, or 2.0
	
	// Final scores
	basePoints: number;
	streakBonus: number;
	experienceBonus: number;
	totalPoints: number;
	
	// Level
	level: 1 | 2 | 3 | 4 | 5;
	levelName: string;
	pointsToNextLevel: number;
	progressPercent: number;
	
	// Heatmap data (last 90 days)
	heatmapData: { date: string; minutes: number; intensity: 0 | 1 | 2 | 3 }[];
}

// Level thresholds
const LEVEL_THRESHOLDS = [
	{ level: 1 as const, name: 'Novice', minPoints: 0, maxPoints: 99 },
	{ level: 2 as const, name: 'Beginner', minPoints: 100, maxPoints: 299 },
	{ level: 3 as const, name: 'Intermediate', minPoints: 300, maxPoints: 599 },
	{ level: 4 as const, name: 'Advanced', minPoints: 600, maxPoints: 999 },
	{ level: 5 as const, name: 'Expert', minPoints: 1000, maxPoints: Infinity },
];

// Parse time string to minutes
function parseTimeToMinutes(timeStr: string): number {
	if (!timeStr || timeStr === '0 mins') return 0;
	
	const hourMatch = timeStr.match(/(\d+)\s*h(our)?s?/i);
	const minMatch = timeStr.match(/(\d+)\s*min(ute)?s?/i);
	
	let minutes = 0;
	if (hourMatch) minutes += parseInt(hourMatch[1]) * 60;
	if (minMatch) minutes += parseInt(minMatch[1]);
	
	// If just a number, assume minutes
	if (!hourMatch && !minMatch) {
		const numMatch = timeStr.match(/(\d+)/);
		if (numMatch) minutes = parseInt(numMatch[1]);
	}
	
	return minutes;
}

// Calculate current streak for a skill
function calculateStreak(
	habits: HabitEntry[],
	skillId: string,
	direction: 'current' | 'longest'
): number {
	const sortedHabits = [...habits].sort(
		(a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
	);
	
	if (direction === 'current') {
		let streak = 0;
		const today = format(new Date(), 'yyyy-MM-dd');
		
		for (let i = 0; i < 365; i++) {
			const checkDate = format(subDays(new Date(), i), 'yyyy-MM-dd');
			const habit = sortedHabits.find(h => h.date === checkDate);
			
			// Skip today if no entry yet
			if (i === 0 && !habit && checkDate === today) continue;
			
			if (!habit) break;
			
			const minutes = parseTimeToMinutes(habit.skills[skillId] || '0');
			if (minutes === 0) break;
			
			streak++;
		}
		return streak;
	} else {
		// Calculate longest streak
		let longestStreak = 0;
		let currentStreak = 0;
		let lastDate: Date | null = null;
		
		// Sort oldest first for longest streak calculation
		const chronological = [...habits].sort(
			(a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
		);
		
		for (const habit of chronological) {
			const minutes = parseTimeToMinutes(habit.skills[skillId] || '0');
			const habitDate = parseISO(habit.date);
			
			if (minutes > 0) {
				if (lastDate && differenceInDays(habitDate, lastDate) === 1) {
					currentStreak++;
				} else {
					currentStreak = 1;
				}
				lastDate = habitDate;
				longestStreak = Math.max(longestStreak, currentStreak);
			} else {
				currentStreak = 0;
				lastDate = null;
			}
		}
		
		return longestStreak;
	}
}

// Get consistency multiplier based on percentage
function getConsistencyMultiplier(percent: number): number {
	if (percent >= 80) return 1.5;
	if (percent >= 50) return 1.2;
	return 1.0;
}

// Get recency multiplier based on last practice
function getRecencyMultiplier(lastPracticeDate: string | null): number {
	if (!lastPracticeDate) return 0.9; // Decay if never practiced
	
	const daysSince = differenceInDays(new Date(), parseISO(lastPracticeDate));
	
	if (daysSince <= 7) return 2.0;   // Very recent
	if (daysSince <= 30) return 1.5;  // Recent
	if (daysSince <= 90) return 1.0;  // Normal
	return 0.9;                        // Decay
}

// Calculate level from points
function calculateLevel(points: number): { 
	level: 1 | 2 | 3 | 4 | 5; 
	name: string; 
	pointsToNext: number; 
	progressPercent: number;
} {
	for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
		const threshold = LEVEL_THRESHOLDS[i];
		if (points >= threshold.minPoints) {
			const range = threshold.maxPoints - threshold.minPoints;
			const progress = points - threshold.minPoints;
			const progressPercent = threshold.level === 5 
				? 100 
				: Math.min(100, Math.round((progress / range) * 100));
			const pointsToNext = threshold.level === 5 
				? 0 
				: threshold.maxPoints - points + 1;
			
			return {
				level: threshold.level,
				name: threshold.name,
				pointsToNext,
				progressPercent
			};
		}
	}
	
	return { level: 1, name: 'Novice', pointsToNext: 100 - points, progressPercent: points };
}

// Generate heatmap data for last 90 days
function generateHeatmapData(
	habits: HabitEntry[],
	skillId: string,
	targetMinutes: number
): { date: string; minutes: number; intensity: 0 | 1 | 2 | 3 }[] {
	const data: { date: string; minutes: number; intensity: 0 | 1 | 2 | 3 }[] = [];
	
	for (let i = 89; i >= 0; i--) {
		const date = format(subDays(new Date(), i), 'yyyy-MM-dd');
		const habit = habits.find(h => h.date === date);
		const minutes = habit ? parseTimeToMinutes(habit.skills[skillId] || '0') : 0;
		
		let intensity: 0 | 1 | 2 | 3 = 0;
		if (minutes > 0) {
			const ratio = minutes / targetMinutes;
			if (ratio >= 1) intensity = 3;
			else if (ratio >= 0.5) intensity = 2;
			else intensity = 1;
		}
		
		data.push({ date, minutes, intensity });
	}
	
	return data;
}

// Main calculation function
export function calculateSkillAnalytics(
	skill: SkillDefinition,
	habits: HabitEntry[]
): SkillAnalytics {
	// Filter habits that have this skill logged
	const relevantHabits = habits.filter(h => 
		h.skills && h.skills[skill.id] && parseTimeToMinutes(h.skills[skill.id]) > 0
	);
	
	// Basic metrics
	const totalMinutes = relevantHabits.reduce(
		(sum, h) => sum + parseTimeToMinutes(h.skills[skill.id] || '0'), 
		0
	);
	const totalHours = Math.round((totalMinutes / 60) * 10) / 10;
	const daysPracticed = relevantHabits.length;
	
	// Find first and last practice dates
	const sortedByDate = [...relevantHabits].sort(
		(a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
	);
	const firstPracticeDate = sortedByDate[0]?.date || null;
	const lastPracticeDate = sortedByDate[sortedByDate.length - 1]?.date || null;
	
	const daysSinceFirstPractice = firstPracticeDate 
		? differenceInDays(new Date(), parseISO(firstPracticeDate)) + 1
		: 0;
	
	// Streaks
	const currentStreak = calculateStreak(habits, skill.id, 'current');
	const longestStreak = calculateStreak(habits, skill.id, 'longest');
	
	// Consistency
	const consistencyPercent = daysSinceFirstPractice > 0
		? Math.round((daysPracticed / daysSinceFirstPractice) * 100)
		: 0;
	const consistencyMultiplier = getConsistencyMultiplier(consistencyPercent);
	
	// Recency
	const recencyMultiplier = getRecencyMultiplier(lastPracticeDate);
	
	// Points calculation
	const basePoints = Math.round(totalHours * 10); // 10 points per hour
	const streakBonus = (currentStreak * 2) + longestStreak; // Current streak worth more
	const experienceBonus = (skill.years_experience || 0) * 50; // 50 points per year
	
	// Apply multipliers to base points only (not bonuses)
	const adjustedBase = Math.round(basePoints * consistencyMultiplier * recencyMultiplier);
	const totalPoints = adjustedBase + streakBonus + experienceBonus;
	
	// Level calculation
	const levelInfo = calculateLevel(totalPoints);
	
	// Target minutes from skill definition (parse "30 mins" -> 30)
	const targetMinutes = parseTimeToMinutes(skill.targetPerDay);
	
	// Heatmap
	const heatmapData = generateHeatmapData(habits, skill.id, targetMinutes || 30);
	
	return {
		skillId: skill.id,
		skillName: skill.name,
		totalMinutes,
		totalHours,
		daysPracticed,
		daysSinceFirstPractice,
		currentStreak,
		longestStreak,
		lastPracticeDate,
		consistencyPercent,
		consistencyMultiplier,
		recencyMultiplier,
		basePoints,
		streakBonus,
		experienceBonus,
		totalPoints,
		level: levelInfo.level,
		levelName: levelInfo.name,
		pointsToNextLevel: levelInfo.pointsToNext,
		progressPercent: levelInfo.progressPercent,
		heatmapData
	};
}

// Calculate analytics for all tracked skills
export function calculateAllSkillAnalytics(
	skills: SkillDefinition[],
	habits: HabitEntry[]
): SkillAnalytics[] {
	return skills
		.filter(s => s.is_tracked !== false) // Include skills where is_tracked is true or undefined
		.map(skill => calculateSkillAnalytics(skill, habits))
		.sort((a, b) => b.totalPoints - a.totalPoints); // Sort by points descending
}

// Export level thresholds for use in UI
export { LEVEL_THRESHOLDS };
