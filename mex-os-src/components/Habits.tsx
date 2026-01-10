import { useState } from 'react';
import { useData } from '../contexts/DataContext';
import { Activity, CheckCircle2, XCircle, Flame, Calendar, Dumbbell, Brain, Code, Languages } from 'lucide-react';
import { format, subDays, eachDayOfInterval } from 'date-fns';
import { type HabitEntry } from '../lib/seedData';

export function Habits() {
	const { habits, updateHabit } = useData();
	const [selectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));

	const todayHabit = habits.find(h => h.date === selectedDate) || {
		date: selectedDate,
		habits: { deep_work_hours: 0, sleep_hours: 0, gym_session: false, calories: 0 },
		skills: { python_practice: '0 mins', italian_practice: '0 mins' }
	};

	const last30Days = eachDayOfInterval({ start: subDays(new Date(), 29), end: new Date() });

	const handleToggle = async (field: string, value: boolean | number | string) => {
		const update: Partial<HabitEntry> = {};
		if (field.startsWith('habits.')) {
			const key = field.replace('habits.', '') as keyof HabitEntry['habits'];
			update.habits = { ...todayHabit.habits, [key]: value };
		} else if (field.startsWith('skills.')) {
			const key = field.replace('skills.', '') as keyof HabitEntry['skills'];
			update.skills = { ...todayHabit.skills, [key]: value };
		}
		await updateHabit(selectedDate, update);
	};

	const getHeatmapColor = (date: string, field: 'gym_session' | 'deep_work_hours') => {
		const habit = habits.find(h => h.date === date);
		if (!habit) return 'bg-dark-700';
		if (field === 'gym_session') return habit.habits.gym_session ? 'bg-neon-green' : 'bg-dark-700';
		if (field === 'deep_work_hours') {
			const hours = habit.habits.deep_work_hours;
			if (hours >= 4) return 'bg-neon-green';
			if (hours >= 2) return 'bg-neon-yellow';
			if (hours >= 1) return 'bg-neon-yellow/50';
			return 'bg-dark-700';
		}
		return 'bg-dark-700';
	};

	const getStreak = (field: 'gym_session' | 'deep_work_hours') => {
		let streak = 0;
		for (let i = 0; i < 30; i++) {
			const date = format(subDays(new Date(), i), 'yyyy-MM-dd');
			const habit = habits.find(h => h.date === date);
			if (!habit) break;
			if (field === 'gym_session' && !habit.habits.gym_session) break;
			if (field === 'deep_work_hours' && habit.habits.deep_work_hours < 4) break;
			streak++;
		}
		return streak;
	};

	return (
		<div className="p-6 max-w-7xl mx-auto space-y-6">
			<div>
				<h1 className="text-3xl font-bold text-white flex items-center gap-3">
					<Activity className="w-8 h-8 text-neon-purple" />Protocol
				</h1>
				<p className="text-gray-500 mt-1">Daily Habit Tracking • {format(new Date(), 'EEEE, MMM d')}</p>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
				<div className="card-cyber p-4">
					<div className="flex items-center gap-2 text-gray-400 text-sm mb-2"><Flame className="w-4 h-4 text-neon-green" />GYM STREAK</div>
					<div className="text-4xl font-bold text-neon-green neon-text-green">{getStreak('gym_session')}</div>
					<div className="text-xs text-gray-500">consecutive days</div>
				</div>
				<div className="card-cyber p-4">
					<div className="flex items-center gap-2 text-gray-400 text-sm mb-2"><Brain className="w-4 h-4 text-neon-cyan" />DEEP WORK STREAK</div>
					<div className="text-4xl font-bold text-neon-cyan">{getStreak('deep_work_hours')}</div>
					<div className="text-xs text-gray-500">days with 4h+</div>
				</div>
				<div className="card-cyber p-4">
					<div className="flex items-center gap-2 text-gray-400 text-sm mb-2"><Calendar className="w-4 h-4 text-neon-yellow" />LOGGED DAYS</div>
					<div className="text-4xl font-bold text-neon-yellow">{habits.length}</div>
					<div className="text-xs text-gray-500">total entries</div>
				</div>
			</div>

			<div className="card-cyber p-6">
				<h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2"><Calendar className="w-5 h-5" />Today's Log</h2>
				<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
					<div className="space-y-4">
						<h3 className="text-sm text-gray-400 uppercase">Habits</h3>
						<div className="flex items-center justify-between p-3 rounded-lg bg-dark-700 border border-dark-600">
							<div className="flex items-center gap-3"><Dumbbell className="w-5 h-5 text-neon-green" /><span className="text-white">Gym Session</span></div>
							<button onClick={() => handleToggle('habits.gym_session', !todayHabit.habits.gym_session)} className={`p-2 rounded-lg transition-all ${todayHabit.habits.gym_session ? 'bg-neon-green/20 text-neon-green' : 'bg-dark-600 text-gray-500'}`}>
								{todayHabit.habits.gym_session ? <CheckCircle2 className="w-6 h-6" /> : <XCircle className="w-6 h-6" />}
							</button>
						</div>
						<div className="p-3 rounded-lg bg-dark-700 border border-dark-600">
							<div className="flex items-center justify-between mb-2"><div className="flex items-center gap-3"><Brain className="w-5 h-5 text-neon-cyan" /><span className="text-white">Deep Work Hours</span></div><span className={`text-lg font-bold ${todayHabit.habits.deep_work_hours >= 4 ? 'text-neon-green' : 'text-gray-400'}`}>{todayHabit.habits.deep_work_hours}h</span></div>
							<div className="flex gap-2">
								{[0, 1, 2, 3, 4, 5, 6, 7, 8].map(h => (<button key={h} onClick={() => handleToggle('habits.deep_work_hours', h)} className={`flex-1 py-1 rounded text-xs ${todayHabit.habits.deep_work_hours === h ? 'bg-neon-cyan text-dark-900' : 'bg-dark-600 text-gray-400 hover:bg-dark-500'}`}>{h}</button>))}
							</div>
						</div>
					</div>
					<div className="space-y-4">
						<h3 className="text-sm text-gray-400 uppercase">Skills</h3>
						<div className="p-3 rounded-lg bg-dark-700 border border-dark-600">
							<div className="flex items-center justify-between mb-2"><div className="flex items-center gap-3"><Code className="w-5 h-5 text-neon-yellow" /><span className="text-white">Python Practice</span></div></div>
							<div className="flex gap-2">
								{['0 mins', '15 mins', '30 mins', '1 hour', '2 hours'].map(t => (<button key={t} onClick={() => handleToggle('skills.python_practice', t)} className={`flex-1 py-2 rounded text-xs ${todayHabit.skills.python_practice === t ? 'bg-neon-yellow text-dark-900' : 'bg-dark-600 text-gray-400 hover:bg-dark-500'}`}>{t}</button>))}
							</div>
						</div>
						<div className="p-3 rounded-lg bg-dark-700 border border-dark-600">
							<div className="flex items-center justify-between mb-2"><div className="flex items-center gap-3"><Languages className="w-5 h-5 text-neon-purple" /><span className="text-white">Italian Practice</span></div></div>
							<div className="flex gap-2">
								{['0 mins', '10 mins', '20 mins', '30 mins', '1 hour'].map(t => (<button key={t} onClick={() => handleToggle('skills.italian_practice', t)} className={`flex-1 py-2 rounded text-xs ${todayHabit.skills.italian_practice === t ? 'bg-neon-purple text-white' : 'bg-dark-600 text-gray-400 hover:bg-dark-500'}`}>{t}</button>))}
							</div>
						</div>
					</div>
				</div>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
				<div className="card-cyber p-6">
					<h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2"><Dumbbell className="w-5 h-5 text-neon-green" />Gym Heatmap (30 days)</h2>
					<div className="grid grid-cols-10 gap-1">
						{last30Days.map(day => {
							const dateStr = format(day, 'yyyy-MM-dd');
							return (<div key={dateStr} className={`w-6 h-6 rounded ${getHeatmapColor(dateStr, 'gym_session')}`} title={`${format(day, 'MMM d')}: ${habits.find(h => h.date === dateStr)?.habits.gym_session ? 'Done' : 'Missed'}`} />);
						})}
					</div>
					<div className="flex items-center gap-4 mt-4 text-xs text-gray-500">
						<span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-dark-700" />Missed</span>
						<span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-neon-green" />Done</span>
					</div>
				</div>
				<div className="card-cyber p-6">
					<h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2"><Brain className="w-5 h-5 text-neon-cyan" />Deep Work Heatmap (30 days)</h2>
					<div className="grid grid-cols-10 gap-1">
						{last30Days.map(day => {
							const dateStr = format(day, 'yyyy-MM-dd');
							return (<div key={dateStr} className={`w-6 h-6 rounded ${getHeatmapColor(dateStr, 'deep_work_hours')}`} title={`${format(day, 'MMM d')}: ${habits.find(h => h.date === dateStr)?.habits.deep_work_hours || 0}h`} />);
						})}
					</div>
					<div className="flex items-center gap-4 mt-4 text-xs text-gray-500">
						<span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-dark-700" />0h</span>
						<span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-neon-yellow/50" />1-2h</span>
						<span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-neon-yellow" />2-4h</span>
						<span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-neon-green" />4h+</span>
					</div>
				</div>
			</div>
		</div>
	);
}
