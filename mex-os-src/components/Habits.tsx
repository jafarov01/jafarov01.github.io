import { useState, useMemo } from 'react';
import { useData } from '../contexts/DataContext';
import {
	Activity,
	CheckCircle2,
	XCircle,
	Flame,
	Calendar,
	Dumbbell,
	Brain,
	Code,
	Languages,
	Moon,
	Plus,
	Trash2,

	X,
	Music,
	Book,
	Gamepad2,
	Heart,
	Target,
	Zap,
	Coffee,
	Pencil
} from 'lucide-react';
import { format, subDays, eachDayOfInterval } from 'date-fns';
import { type SkillDefinition, type HabitDefinition } from '../lib/seedData';

// Icon mapping for dynamic rendering
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
	dumbbell: Dumbbell, brain: Brain, code: Code, languages: Languages, moon: Moon,
	music: Music, book: Book, gamepad2: Gamepad2, heart: Heart, target: Target,
	zap: Zap, coffee: Coffee, pencil: Pencil, activity: Activity, flame: Flame
};

const colorMap: Record<string, { bg: string; text: string; border: string }> = {
	'neon-green': { bg: 'bg-neon-green/20', text: 'text-neon-green', border: 'border-neon-green/30' },
	'neon-yellow': { bg: 'bg-neon-yellow/20', text: 'text-neon-yellow', border: 'border-neon-yellow/30' },
	'neon-cyan': { bg: 'bg-neon-cyan/20', text: 'text-neon-cyan', border: 'border-neon-cyan/30' },
	'neon-purple': { bg: 'bg-neon-purple/20', text: 'text-neon-purple', border: 'border-neon-purple/30' },
	'neon-red': { bg: 'bg-neon-red/20', text: 'text-neon-red', border: 'border-neon-red/30' }
};

const availableIcons = ['code', 'languages', 'music', 'book', 'brain', 'dumbbell', 'heart', 'target', 'zap', 'coffee', 'pencil', 'gamepad2'];
const availableColors = ['neon-green', 'neon-yellow', 'neon-cyan', 'neon-purple', 'neon-red'];

export function Habits() {
	const {
		habits,
		updateHabit,
		skillDefinitions,
		habitDefinitions,
		addSkillDefinition,
		deleteSkillDefinition,
		addHabitDefinition,
		deleteHabitDefinition
	} = useData();

	const [selectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
	const [showAddSkill, setShowAddSkill] = useState(false);
	const [showAddHabit, setShowAddHabit] = useState(false);
	const [newSkill, setNewSkill] = useState({ name: '', icon: 'code', color: 'neon-yellow', targetPerDay: '30 mins' });
	const [newHabit, setNewHabit] = useState<{ name: string; icon: string; color: string; trackingType: 'boolean' | 'hours' | 'count'; target: number; maxValue: number }>({ name: '', icon: 'dumbbell', color: 'neon-green', trackingType: 'boolean', target: 1, maxValue: 1 });

	const todayHabit = useMemo(() => {
		const existing = habits.find(h => h.date === selectedDate);
		if (existing) return existing;

		// Create default structure from definitions
		const defaultHabits: Record<string, number | boolean> = {};
		const defaultSkills: Record<string, string> = {};

		habitDefinitions.forEach(def => {
			defaultHabits[def.id] = def.trackingType === 'boolean' ? false : 0;
		});
		skillDefinitions.forEach(def => {
			defaultSkills[def.id] = def.trackingOptions?.[0] || '0 mins';
		});

		return { date: selectedDate, habits: defaultHabits, skills: defaultSkills };
	}, [habits, selectedDate, habitDefinitions, skillDefinitions]);

	const last30Days = eachDayOfInterval({ start: subDays(new Date(), 29), end: new Date() });

	const handleHabitToggle = async (habitId: string, value: boolean | number) => {
		await updateHabit(selectedDate, { habits: { [habitId]: value } });
	};

	const handleSkillChange = async (skillId: string, value: string) => {
		await updateHabit(selectedDate, { skills: { [skillId]: value } });
	};



	const getSkillHeatmapColor = (date: string, skillDef: SkillDefinition) => {
		const habit = habits.find(h => h.date === date);
		if (!habit) return 'bg-dark-700';

		const value = habit.skills[skillDef.id] || '0 mins';
		const options = skillDef.trackingOptions || [];
		const valueIndex = options.indexOf(value);

		if (valueIndex <= 0) return 'bg-dark-700';
		if (valueIndex >= options.length - 1) return `bg-${skillDef.color}`;
		if (valueIndex >= options.length / 2) return `bg-${skillDef.color}/70`;
		return `bg-${skillDef.color}/40`;
	};

	const getStreak = (habitDef: HabitDefinition) => {
		let streak = 0;
		const today = format(new Date(), 'yyyy-MM-dd');

		for (let i = 0; i < 30; i++) {
			const date = format(subDays(new Date(), i), 'yyyy-MM-dd');
			const habit = habits.find(h => h.date === date);

			if (!habit && date === today) continue;
			if (!habit) break;

			const value = habit.habits[habitDef.id];
			if (habitDef.trackingType === 'boolean') {
				if (!value) break;
			} else {
				const numValue = typeof value === 'number' ? value : 0;
				if (numValue < (habitDef.target || 1)) break;
			}
			streak++;
		}
		return streak;
	};

	const handleAddSkill = async () => {
		if (!newSkill.name.trim()) return;

		await addSkillDefinition({
			name: newSkill.name,
			icon: newSkill.icon,
			color: newSkill.color,
			targetPerDay: newSkill.targetPerDay,
			trackingOptions: ['0 mins', '15 mins', '30 mins', '1 hour', '2 hours']
		});

		setNewSkill({ name: '', icon: 'code', color: 'neon-yellow', targetPerDay: '30 mins' });
		setShowAddSkill(false);
	};

	const handleAddHabit = async () => {
		if (!newHabit.name.trim()) return;

		await addHabitDefinition({
			name: newHabit.name,
			icon: newHabit.icon,
			color: newHabit.color,
			trackingType: newHabit.trackingType,
			target: newHabit.trackingType !== 'boolean' ? newHabit.target : undefined,
			maxValue: newHabit.trackingType !== 'boolean' ? newHabit.maxValue : undefined
		});

		setNewHabit({ name: '', icon: 'dumbbell', color: 'neon-green', trackingType: 'boolean', target: 1, maxValue: 1 });
		setShowAddHabit(false);
	};

	const IconComponent = ({ name, className }: { name: string; className?: string }) => {
		const Icon = iconMap[name] || Activity;
		return <Icon className={className} />;
	};

	return (
		<div className="p-6 max-w-7xl mx-auto space-y-6">
			<div>
				<h1 className="text-3xl font-bold text-white flex items-center gap-3">
					<Activity className="w-8 h-8 text-neon-purple" />Protocol
				</h1>
				<p className="text-gray-500 mt-1">Daily Habit & Skill Tracking • {format(new Date(), 'EEEE, MMM d')}</p>
			</div>

			{/* Streak Cards */}
			<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
				{habitDefinitions.slice(0, 3).map(def => (
					<div key={def.id} className="card-cyber p-4">
						<div className={`flex items-center gap-2 text-gray-400 text-sm mb-2`}>
							<Flame className={`w-4 h-4 ${colorMap[def.color]?.text || 'text-neon-green'}`} />
							{def.name.toUpperCase()} STREAK
						</div>
						<div className={`text-4xl font-bold ${colorMap[def.color]?.text || 'text-neon-green'}`}>
							{getStreak(def)}
						</div>
						<div className="text-xs text-gray-500">
							{def.trackingType === 'boolean' ? 'consecutive days' : `days with ${def.target}${def.trackingType === 'hours' ? 'h+' : '+'}`}
						</div>
					</div>
				))}
			</div>

			{/* Today's Habits */}
			<div className="card-cyber p-6">
				<div className="flex items-center justify-between mb-6">
					<h2 className="text-lg font-semibold text-white flex items-center gap-2">
						<Calendar className="w-5 h-5" />Today's Habits
					</h2>
					<button
						onClick={() => setShowAddHabit(true)}
						className="btn-cyber px-3 py-1.5 text-sm flex items-center gap-2"
					>
						<Plus className="w-4 h-4" />Add Habit
					</button>
				</div>

				{habitDefinitions.length === 0 ? (
					<p className="text-gray-500 text-center py-8">No habits defined. Click "Add Habit" to create your first habit!</p>
				) : (
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						{habitDefinitions.map(def => {
							const colors = colorMap[def.color] || colorMap['neon-green'];
							const value = todayHabit.habits[def.id];

							return (
								<div key={def.id} className={`p-4 rounded-lg bg-dark-700 border border-dark-600 group relative`}>
									<button
										onClick={() => deleteHabitDefinition(def.id)}
										className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1.5 rounded bg-dark-600 hover:bg-neon-red/20 text-gray-500 hover:text-neon-red transition-all"
									>
										<Trash2 className="w-4 h-4" />
									</button>

									<div className="flex items-center justify-between mb-3">
										<div className="flex items-center gap-3">
											<IconComponent name={def.icon} className={`w-5 h-5 ${colors.text}`} />
											<span className="text-white font-medium">{def.name}</span>
										</div>

										{def.trackingType === 'boolean' ? (
											<button
												onClick={() => handleHabitToggle(def.id, !value)}
												className={`p-2 rounded-lg transition-all ${value ? `${colors.bg} ${colors.text}` : 'bg-dark-600 text-gray-500'}`}
											>
												{value ? <CheckCircle2 className="w-6 h-6" /> : <XCircle className="w-6 h-6" />}
											</button>
										) : (
											<span className={`text-lg font-bold ${typeof value === 'number' && value >= (def.target || 1) ? colors.text : 'text-gray-400'}`}>
												{typeof value === 'number' ? value : 0}{def.trackingType === 'hours' ? 'h' : ''}
											</span>
										)}
									</div>

									{def.trackingType !== 'boolean' && (
										<div className="flex gap-1">
											{Array.from({ length: (def.maxValue || 8) + 1 }, (_, i) => i).map(v => (
												<button
													key={v}
													onClick={() => handleHabitToggle(def.id, v)}
													className={`flex-1 py-1.5 rounded text-xs transition-all ${value === v ? `${colors.bg} ${colors.text} ${colors.border} border` : 'bg-dark-600 text-gray-400 hover:bg-dark-500'}`}
												>
													{v}
												</button>
											))}
										</div>
									)}
								</div>
							);
						})}
					</div>
				)}
			</div>

			{/* Today's Skills */}
			<div className="card-cyber p-6">
				<div className="flex items-center justify-between mb-6">
					<h2 className="text-lg font-semibold text-white flex items-center gap-2">
						<Target className="w-5 h-5" />Skills Practice
					</h2>
					<button
						onClick={() => setShowAddSkill(true)}
						className="btn-cyber px-3 py-1.5 text-sm flex items-center gap-2"
					>
						<Plus className="w-4 h-4" />Add Skill
					</button>
				</div>

				{skillDefinitions.length === 0 ? (
					<p className="text-gray-500 text-center py-8">No skills defined. Click "Add Skill" to start tracking!</p>
				) : (
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						{skillDefinitions.map(def => {
							const colors = colorMap[def.color] || colorMap['neon-yellow'];
							const value = todayHabit.skills[def.id] || def.trackingOptions?.[0] || '0 mins';

							return (
								<div key={def.id} className="p-4 rounded-lg bg-dark-700 border border-dark-600 group relative">
									<button
										onClick={() => deleteSkillDefinition(def.id)}
										className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1.5 rounded bg-dark-600 hover:bg-neon-red/20 text-gray-500 hover:text-neon-red transition-all"
									>
										<Trash2 className="w-4 h-4" />
									</button>

									<div className="flex items-center justify-between mb-3">
										<div className="flex items-center gap-3">
											<IconComponent name={def.icon} className={`w-5 h-5 ${colors.text}`} />
											<span className="text-white font-medium">{def.name}</span>
										</div>
										<span className="text-xs text-gray-500">Target: {def.targetPerDay}</span>
									</div>

									<div className="flex gap-1 flex-wrap">
										{(def.trackingOptions || ['0 mins', '15 mins', '30 mins', '1 hour', '2 hours']).map(opt => (
											<button
												key={opt}
												onClick={() => handleSkillChange(def.id, opt)}
												className={`px-2 py-1.5 rounded text-xs transition-all ${value === opt ? `${colors.bg} ${colors.text} ${colors.border} border` : 'bg-dark-600 text-gray-400 hover:bg-dark-500'}`}
											>
												{opt}
											</button>
										))}
									</div>
								</div>
							);
						})}
					</div>
				)}
			</div>

			{/* Heatmaps */}
			<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
				{habitDefinitions.slice(0, 4).map(def => {
					const colors = colorMap[def.color] || colorMap['neon-green'];
					return (
						<div key={def.id} className="card-cyber p-6">
							<h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
								<IconComponent name={def.icon} className={`w-5 h-5 ${colors.text}`} />
								{def.name} (30 days)
							</h2>
							<div className="grid grid-cols-10 gap-1">
								{last30Days.map(day => {
									const dateStr = format(day, 'yyyy-MM-dd');
									const habit = habits.find(h => h.date === dateStr);
									const value = habit?.habits[def.id];
									let colorClass = 'bg-dark-700';

									if (habit) {
										if (def.trackingType === 'boolean') {
											colorClass = value ? 'bg-neon-green' : 'bg-dark-700';
										} else {
											const numValue = typeof value === 'number' ? value : 0;
											const target = def.target || 4;
											if (numValue >= target) colorClass = 'bg-neon-green';
											else if (numValue >= target / 2) colorClass = 'bg-neon-yellow';
											else if (numValue > 0) colorClass = 'bg-neon-yellow/50';
										}
									}

									return (
										<div
											key={dateStr}
											className={`w-6 h-6 rounded ${colorClass}`}
											title={`${format(day, 'MMM d')}: ${def.trackingType === 'boolean' ? (value ? 'Done' : 'Missed') : `${value || 0}${def.trackingType === 'hours' ? 'h' : ''}`}`}
										/>
									);
								})}
							</div>
							<div className="flex items-center gap-4 mt-4 text-xs text-gray-500">
								<span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-dark-700" />Missed</span>
								{def.trackingType !== 'boolean' && (
									<>
										<span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-neon-yellow/50" />Low</span>
										<span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-neon-yellow" />Mid</span>
									</>
								)}
								<span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-neon-green" />Done</span>
							</div>
						</div>
					);
				})}
			</div>

			{/* Skill Heatmaps */}
			{skillDefinitions.length > 0 && (
				<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
					{skillDefinitions.map(def => {
						const colors = colorMap[def.color] || colorMap['neon-yellow'];
						return (
							<div key={def.id} className="card-cyber p-6">
								<h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
									<IconComponent name={def.icon} className={`w-5 h-5 ${colors.text}`} />
									{def.name} Practice (30 days)
								</h2>
								<div className="grid grid-cols-10 gap-1">
									{last30Days.map(day => {
										const dateStr = format(day, 'yyyy-MM-dd');
										return (
											<div
												key={dateStr}
												className={`w-6 h-6 rounded ${getSkillHeatmapColor(dateStr, def)}`}
												title={`${format(day, 'MMM d')}: ${habits.find(h => h.date === dateStr)?.skills[def.id] || '0 mins'}`}
											/>
										);
									})}
								</div>
								<div className="flex items-center gap-4 mt-4 text-xs text-gray-500">
									<span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-dark-700" />None</span>
									<span className="flex items-center gap-1"><span className={`w-3 h-3 rounded bg-${def.color}/40`} />Some</span>
									<span className="flex items-center gap-1"><span className={`w-3 h-3 rounded bg-${def.color}`} />Target</span>
								</div>
							</div>
						);
					})}
				</div>
			)}

			{/* Add Skill Modal */}
			{showAddSkill && (
				<div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
					<div className="card-cyber p-6 w-full max-w-md">
						<div className="flex items-center justify-between mb-6">
							<h3 className="text-xl font-bold text-white">Add New Skill</h3>
							<button onClick={() => setShowAddSkill(false)} className="text-gray-500 hover:text-white">
								<X className="w-6 h-6" />
							</button>
						</div>

						<div className="space-y-4">
							<div>
								<label className="block text-sm text-gray-400 mb-2">Skill Name</label>
								<input
									type="text"
									value={newSkill.name}
									onChange={e => setNewSkill({ ...newSkill, name: e.target.value })}
									placeholder="e.g., German, Piano, Drawing"
									className="w-full px-4 py-2 rounded-lg bg-dark-700 border border-dark-600 text-white placeholder-gray-500 focus:border-neon-cyan focus:outline-none"
								/>
							</div>

							<div>
								<label className="block text-sm text-gray-400 mb-2">Icon</label>
								<div className="flex gap-2 flex-wrap">
									{availableIcons.map(icon => {
										const Icon = iconMap[icon] || Activity;
										return (
											<button
												key={icon}
												onClick={() => setNewSkill({ ...newSkill, icon })}
												className={`p-2 rounded-lg transition-all ${newSkill.icon === icon ? 'bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/30' : 'bg-dark-700 text-gray-400 hover:bg-dark-600'}`}
											>
												<Icon className="w-5 h-5" />
											</button>
										);
									})}
								</div>
							</div>

							<div>
								<label className="block text-sm text-gray-400 mb-2">Color</label>
								<div className="flex gap-2">
									{availableColors.map(color => {
										const colors = colorMap[color];
										return (
											<button
												key={color}
												onClick={() => setNewSkill({ ...newSkill, color })}
												className={`w-10 h-10 rounded-lg transition-all ${colors.bg} ${newSkill.color === color ? `ring-2 ring-offset-2 ring-offset-dark-800 ${colors.border.replace('border-', 'ring-')}` : ''}`}
											/>
										);
									})}
								</div>
							</div>

							<div>
								<label className="block text-sm text-gray-400 mb-2">Daily Target</label>
								<select
									value={newSkill.targetPerDay}
									onChange={e => setNewSkill({ ...newSkill, targetPerDay: e.target.value })}
									className="w-full px-4 py-2 rounded-lg bg-dark-700 border border-dark-600 text-white focus:border-neon-cyan focus:outline-none"
								>
									<option value="15 mins">15 mins</option>
									<option value="30 mins">30 mins</option>
									<option value="1 hour">1 hour</option>
									<option value="2 hours">2 hours</option>
								</select>
							</div>
						</div>

						<div className="flex gap-3 mt-6">
							<button onClick={() => setShowAddSkill(false)} className="flex-1 px-4 py-2 rounded-lg bg-dark-700 text-gray-400 hover:bg-dark-600">
								Cancel
							</button>
							<button onClick={handleAddSkill} className="flex-1 btn-cyber py-2">
								Add Skill
							</button>
						</div>
					</div>
				</div>
			)}

			{/* Add Habit Modal */}
			{showAddHabit && (
				<div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
					<div className="card-cyber p-6 w-full max-w-md">
						<div className="flex items-center justify-between mb-6">
							<h3 className="text-xl font-bold text-white">Add New Habit</h3>
							<button onClick={() => setShowAddHabit(false)} className="text-gray-500 hover:text-white">
								<X className="w-6 h-6" />
							</button>
						</div>

						<div className="space-y-4">
							<div>
								<label className="block text-sm text-gray-400 mb-2">Habit Name</label>
								<input
									type="text"
									value={newHabit.name}
									onChange={e => setNewHabit({ ...newHabit, name: e.target.value })}
									placeholder="e.g., Meditation, Reading, Walk"
									className="w-full px-4 py-2 rounded-lg bg-dark-700 border border-dark-600 text-white placeholder-gray-500 focus:border-neon-cyan focus:outline-none"
								/>
							</div>

							<div>
								<label className="block text-sm text-gray-400 mb-2">Tracking Type</label>
								<div className="flex gap-2">
									{(['boolean', 'hours', 'count'] as const).map(type => (
										<button
											key={type}
											onClick={() => setNewHabit({ ...newHabit, trackingType: type })}
											className={`flex-1 py-2 rounded-lg transition-all ${newHabit.trackingType === type ? 'bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/30' : 'bg-dark-700 text-gray-400 hover:bg-dark-600'}`}
										>
											{type === 'boolean' ? 'Yes/No' : type === 'hours' ? 'Hours' : 'Count'}
										</button>
									))}
								</div>
							</div>

							{newHabit.trackingType !== 'boolean' && (
								<>
									<div>
										<label className="block text-sm text-gray-400 mb-2">Daily Target</label>
										<input
											type="number"
											min="1"
											max="24"
											value={newHabit.target}
											onChange={e => setNewHabit({ ...newHabit, target: parseInt(e.target.value) || 1 })}
											className="w-full px-4 py-2 rounded-lg bg-dark-700 border border-dark-600 text-white focus:border-neon-cyan focus:outline-none"
										/>
									</div>
									<div>
										<label className="block text-sm text-gray-400 mb-2">Max Value</label>
										<input
											type="number"
											min="1"
											max="24"
											value={newHabit.maxValue}
											onChange={e => setNewHabit({ ...newHabit, maxValue: parseInt(e.target.value) || 1 })}
											className="w-full px-4 py-2 rounded-lg bg-dark-700 border border-dark-600 text-white focus:border-neon-cyan focus:outline-none"
										/>
									</div>
								</>
							)}

							<div>
								<label className="block text-sm text-gray-400 mb-2">Icon</label>
								<div className="flex gap-2 flex-wrap">
									{availableIcons.map(icon => {
										const Icon = iconMap[icon] || Activity;
										return (
											<button
												key={icon}
												onClick={() => setNewHabit({ ...newHabit, icon })}
												className={`p-2 rounded-lg transition-all ${newHabit.icon === icon ? 'bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/30' : 'bg-dark-700 text-gray-400 hover:bg-dark-600'}`}
											>
												<Icon className="w-5 h-5" />
											</button>
										);
									})}
								</div>
							</div>

							<div>
								<label className="block text-sm text-gray-400 mb-2">Color</label>
								<div className="flex gap-2">
									{availableColors.map(color => {
										const colors = colorMap[color];
										return (
											<button
												key={color}
												onClick={() => setNewHabit({ ...newHabit, color })}
												className={`w-10 h-10 rounded-lg transition-all ${colors.bg} ${newHabit.color === color ? `ring-2 ring-offset-2 ring-offset-dark-800 ${colors.border.replace('border-', 'ring-')}` : ''}`}
											/>
										);
									})}
								</div>
							</div>
						</div>

						<div className="flex gap-3 mt-6">
							<button onClick={() => setShowAddHabit(false)} className="flex-1 px-4 py-2 rounded-lg bg-dark-700 text-gray-400 hover:bg-dark-600">
								Cancel
							</button>
							<button onClick={handleAddHabit} className="flex-1 btn-cyber py-2">
								Add Habit
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
