import { useState, useMemo } from 'react';
import { useData } from '../contexts/DataContext';
import { useToast } from '../contexts/ToastContext';
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
	Edit2,
	X,
	Music,
	Book,
	Gamepad2,
	Heart,
	Target,
	Zap,
	Coffee,
	Pencil,
	ChevronLeft,
	ChevronRight,
	Loader2
} from 'lucide-react';
import { format, subDays, eachDayOfInterval, addDays, isFuture } from 'date-fns';
import { type SkillDefinition, type HabitDefinition } from '../lib/seedData';
import { QuickDateSelector } from './QuickDateSelector';
import { ConfirmModal } from './ConfirmModal';

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
		updateSkillDefinition,
		deleteSkillDefinition,
		addHabitDefinition,
		updateHabitDefinition,
		deleteHabitDefinition
	} = useData();
	const { showToast } = useToast();

	const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
	const [showAddSkill, setShowAddSkill] = useState(false);
	const [showAddHabit, setShowAddHabit] = useState(false);
	const [isSaving, setIsSaving] = useState(false);

	// Delete confirmation state
	const [confirmOpen, setConfirmOpen] = useState(false);
	const [deleteId, setDeleteId] = useState<string | null>(null);
	const [deleteType, setDeleteType] = useState<'habit' | 'skill' | null>(null);

	const [editingSkill, setEditingSkill] = useState<SkillDefinition | null>(null);
	const [editingHabit, setEditingHabit] = useState<HabitDefinition | null>(null);

	const [skillForm, setSkillForm] = useState({ name: '', icon: 'code', color: 'neon-yellow', targetPerDay: '30 mins' });
	const [habitForm, setHabitForm] = useState<{ name: string; icon: string; color: string; trackingType: 'boolean' | 'hours' | 'count'; target: number; maxValue: number }>({ name: '', icon: 'dumbbell', color: 'neon-green', trackingType: 'boolean', target: 1, maxValue: 1 });

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
		try {
			await updateHabit(selectedDate, { habits: { [habitId]: value } });
		} catch {
			showToast('Failed to save', 'error');
		}
	};

	const handleSkillChange = async (skillId: string, value: string) => {
		try {
			await updateHabit(selectedDate, { skills: { [skillId]: value } });
		} catch {
			showToast('Failed to save', 'error');
		}
	};

	// --- Habit Form Handlers ---

	const openAddHabit = () => {
		setEditingHabit(null);
		setHabitForm({ name: '', icon: 'dumbbell', color: 'neon-green', trackingType: 'boolean', target: 1, maxValue: 1 });
		setShowAddHabit(true);
	};

	const openEditHabit = (def: HabitDefinition) => {
		setEditingHabit(def);
		setHabitForm({
			name: def.name,
			icon: def.icon,
			color: def.color,
			trackingType: def.trackingType,
			target: def.target || 1,
			maxValue: def.maxValue || 1
		});
		setShowAddHabit(true);
	};

	const handleSaveHabit = async () => {
		if (!habitForm.name.trim()) return;

		setIsSaving(true);
		try {
			const data = {
				name: habitForm.name,
				icon: habitForm.icon,
				color: habitForm.color,
				trackingType: habitForm.trackingType,
				target: habitForm.trackingType !== 'boolean' ? habitForm.target : undefined,
				maxValue: habitForm.trackingType !== 'boolean' ? habitForm.maxValue : undefined
			};

			if (editingHabit) {
				await updateHabitDefinition(editingHabit.id, data);
				showToast('Habit updated', 'success');
			} else {
				await addHabitDefinition(data);
				showToast('Habit added', 'success');
			}

			setShowAddHabit(false);
		} catch {
			showToast('Failed to save habit', 'error');
		} finally {
			setIsSaving(false);
		}
	};

	// --- Skill Form Handlers ---

	const openAddSkill = () => {
		setEditingSkill(null);
		setSkillForm({ name: '', icon: 'code', color: 'neon-yellow', targetPerDay: '30 mins' });
		setShowAddSkill(true);
	};

	const openEditSkill = (def: SkillDefinition) => {
		setEditingSkill(def);
		setSkillForm({
			name: def.name,
			icon: def.icon,
			color: def.color,
			targetPerDay: def.targetPerDay
		});
		setShowAddSkill(true);
	};

	const handleSaveSkill = async () => {
		if (!skillForm.name.trim()) return;

		setIsSaving(true);
		try {
			const data = {
				name: skillForm.name,
				icon: skillForm.icon,
				color: skillForm.color,
				targetPerDay: skillForm.targetPerDay,
				trackingOptions: ['0 mins', '15 mins', '30 mins', '1 hour', '2 hours']
			};

			if (editingSkill) {
				await updateSkillDefinition(editingSkill.id, data);
				showToast('Skill updated', 'success');
			} else {
				await addSkillDefinition(data);
				showToast('Skill added', 'success');
			}

			setShowAddSkill(false);
		} catch {
			showToast('Failed to save skill', 'error');
		} finally {
			setIsSaving(false);
		}
	};

	// Delete confirmation handlers
	const handleDeleteRequest = (id: string, type: 'habit' | 'skill') => {
		setDeleteId(id);
		setDeleteType(type);
		setConfirmOpen(true);
	};

	const confirmDelete = async () => {
		if (deleteId && deleteType) {
			try {
				if (deleteType === 'habit') {
					await deleteHabitDefinition(deleteId);
					showToast('Habit deleted', 'success');
				} else {
					await deleteSkillDefinition(deleteId);
					showToast('Skill deleted', 'success');
				}
				setConfirmOpen(false);
				setDeleteId(null);
				setDeleteType(null);
			} catch {
				showToast(`Failed to delete ${deleteType}`, 'error');
				setConfirmOpen(false);
			}
		}
	};

	const IconComponent = ({ name, className }: { name: string; className?: string }) => {
		const Icon = iconMap[name] || Activity;
		return <Icon className={className} />;
	};

	const changeDate = (days: number) => {
		const newDate = addDays(new Date(selectedDate), days);
		setSelectedDate(format(newDate, 'yyyy-MM-dd'));
	};

	// Heatmap Helper
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

	return (
		<div className="p-6 max-w-7xl mx-auto space-y-6">
			{/* Header with Date Navigation */}
			<div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
				<div>
					<h1 className="text-3xl font-bold text-white flex items-center gap-3">
						<Activity className="w-8 h-8 text-neon-purple" />Protocol
					</h1>
					<p className="text-gray-500 mt-1">Daily Habit & Skill Tracking</p>
				</div>

				<div className="flex flex-col items-end gap-2">
					<div className="flex items-center gap-2 bg-dark-700 p-1 rounded-lg border border-dark-600">
						<button onClick={() => changeDate(-1)} className="p-1 hover:text-white text-gray-400"><ChevronLeft className="w-5 h-5" /></button>
						<input
							type="date"
							value={selectedDate}
							onChange={(e) => setSelectedDate(e.target.value)}
							className="bg-transparent text-white text-center font-mono border-none focus:ring-0 w-32"
						/>
						<button
							onClick={() => changeDate(1)}
							disabled={isFuture(addDays(new Date(selectedDate), 1))}
							className="p-1 hover:text-white text-gray-400 disabled:opacity-30"
						>
							<ChevronRight className="w-5 h-5" />
						</button>
					</div>
					<QuickDateSelector onSelect={setSelectedDate} currentDate={selectedDate} />
				</div>
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

			{/* Habits Section */}
			<div className="card-cyber p-6">
				<div className="flex items-center justify-between mb-6">
					<h2 className="text-lg font-semibold text-white flex items-center gap-2">
						<Calendar className="w-5 h-5" />
						{selectedDate === format(new Date(), 'yyyy-MM-dd') ? "Today's Habits" : `Habits for ${format(new Date(selectedDate), 'MMM d')}`}
					</h2>
					<button
						onClick={openAddHabit}
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
								<div key={def.id} className={`p-4 rounded-lg bg-dark-700 border border-dark-600 group relative hover:border-dark-500`}>
									<div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
										<button
											onClick={() => openEditHabit(def)}
											className="p-1.5 rounded bg-dark-600 hover:bg-neon-cyan/20 text-gray-500 hover:text-neon-cyan"
										>
											<Edit2 className="w-4 h-4" />
										</button>
										<button
											onClick={() => handleDeleteRequest(def.id, 'habit')}
											className="p-1.5 rounded bg-dark-600 hover:bg-neon-red/20 text-gray-500 hover:text-neon-red"
										>
											<Trash2 className="w-4 h-4" />
										</button>
									</div>

									<div className="flex items-center justify-between mb-3 pr-16">
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
										<div className="value-selector">
											{Array.from({ length: (def.maxValue || 8) + 1 }, (_, i) => i).map(v => (
												<button
													key={v}
													onClick={() => handleHabitToggle(def.id, v)}
													className={`rounded text-xs transition-all ${value === v ? `${colors.bg} ${colors.text} ${colors.border} border` : 'bg-dark-600 text-gray-400 hover:bg-dark-500'}`}
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

			{/* Skills Section */}
			<div className="card-cyber p-6">
				<div className="flex items-center justify-between mb-6">
					<h2 className="text-lg font-semibold text-white flex items-center gap-2">
						<Target className="w-5 h-5" />Skills Practice
					</h2>
					<button
						onClick={openAddSkill}
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
								<div key={def.id} className="p-4 rounded-lg bg-dark-700 border border-dark-600 group relative hover:border-dark-500">
									<div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
										<button
											onClick={() => openEditSkill(def)}
											className="p-1.5 rounded bg-dark-600 hover:bg-neon-cyan/20 text-gray-500 hover:text-neon-cyan"
										>
											<Edit2 className="w-4 h-4" />
										</button>
										<button
											onClick={() => handleDeleteRequest(def.id, 'skill')}
											className="p-1.5 rounded bg-dark-600 hover:bg-neon-red/20 text-gray-500 hover:text-neon-red"
										>
											<Trash2 className="w-4 h-4" />
										</button>
									</div>

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

			{/* Heatmaps (30 days) */}
			<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
				{habitDefinitions.slice(0, 4).map(def => {
					const colors = colorMap[def.color] || colorMap['neon-green'];
					return (
						<div key={def.id} className="card-cyber p-6">
							<h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
								<IconComponent name={def.icon} className={`w-5 h-5 ${colors.text}`} />
								{def.name} (30 days)
							</h2>
							<div className="heatmap-grid">
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
										<button
											key={dateStr}
											onClick={() => setSelectedDate(dateStr)}
											className={`heatmap-cell ${colorClass} cursor-pointer hover:ring-2 hover:ring-white/30 transition-all`}
											title={`${format(day, 'MMM d')}: ${def.trackingType === 'boolean' ? (value ? 'Done' : 'Missed') : `${value || 0}${def.trackingType === 'hours' ? 'h' : ''}`} — Click to edit`}
										/>
									);
								})}
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
								<div className="heatmap-grid">
									{last30Days.map(day => {
										const dateStr = format(day, 'yyyy-MM-dd');
										const skillValue = habits.find(h => h.date === dateStr)?.skills[def.id] || '0 mins';
										return (
											<button
												key={dateStr}
												onClick={() => setSelectedDate(dateStr)}
												className={`heatmap-cell ${getSkillHeatmapColor(dateStr, def)} cursor-pointer hover:ring-2 hover:ring-white/30 transition-all`}
												title={`${format(day, 'MMM d')}: ${skillValue} — Click to edit`}
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


			{/* Add/Edit Skill Modal */}
			{showAddSkill && (
				<div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-2 sm:p-4">
					<div className="card-cyber p-4 sm:p-6 w-full max-w-[calc(100vw-1rem)] sm:max-w-md max-h-[calc(100vh-1rem)] overflow-y-auto">
						<div className="flex items-center justify-between mb-6">
							<h3 className="text-xl font-bold text-white">{editingSkill ? 'Edit Skill' : 'Add New Skill'}</h3>
							<button onClick={() => setShowAddSkill(false)} className="text-gray-500 hover:text-white">
								<X className="w-6 h-6" />
							</button>
						</div>

						<div className="space-y-4">
							<div>
								<label className="block text-sm text-gray-400 mb-2">Skill Name</label>
								<input
									type="text"
									value={skillForm.name}
									onChange={e => setSkillForm({ ...skillForm, name: e.target.value })}
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
												onClick={() => setSkillForm({ ...skillForm, icon })}
												className={`p-2 rounded-lg transition-all ${skillForm.icon === icon ? 'bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/30' : 'bg-dark-700 text-gray-400 hover:bg-dark-600'}`}
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
												onClick={() => setSkillForm({ ...skillForm, color })}
												className={`w-10 h-10 rounded-lg transition-all ${colors.bg} ${skillForm.color === color ? `ring-2 ring-offset-2 ring-offset-dark-800 ${colors.border.replace('border-', 'ring-')}` : ''}`}
											/>
										);
									})}
								</div>
							</div>

							<div>
								<label className="block text-sm text-gray-400 mb-2">Daily Target</label>
								<select
									value={skillForm.targetPerDay}
									onChange={e => setSkillForm({ ...skillForm, targetPerDay: e.target.value })}
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
							<button onClick={handleSaveSkill} disabled={isSaving} className="flex-1 btn-cyber py-2 flex items-center justify-center gap-2 disabled:opacity-50">
								{isSaving ? (
									<><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
								) : (
									editingSkill ? 'Save Changes' : 'Add Skill'
								)}
							</button>
						</div>
					</div>
				</div>
			)}

			{/* Add/Edit Habit Modal */}
			{showAddHabit && (
				<div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-2 sm:p-4">
					<div className="card-cyber p-4 sm:p-6 w-full max-w-[calc(100vw-1rem)] sm:max-w-md max-h-[calc(100vh-1rem)] overflow-y-auto">
						<div className="flex items-center justify-between mb-6">
							<h3 className="text-xl font-bold text-white">{editingHabit ? 'Edit Habit' : 'Add New Habit'}</h3>
							<button onClick={() => setShowAddHabit(false)} className="text-gray-500 hover:text-white">
								<X className="w-6 h-6" />
							</button>
						</div>

						<div className="space-y-4">
							<div>
								<label className="block text-sm text-gray-400 mb-2">Habit Name</label>
								<input
									type="text"
									value={habitForm.name}
									onChange={e => setHabitForm({ ...habitForm, name: e.target.value })}
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
											onClick={() => setHabitForm({ ...habitForm, trackingType: type })}
											className={`flex-1 py-2 rounded-lg transition-all ${habitForm.trackingType === type ? 'bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/30' : 'bg-dark-700 text-gray-400 hover:bg-dark-600'}`}
										>
											{type === 'boolean' ? 'Yes/No' : type === 'hours' ? 'Hours' : 'Count'}
										</button>
									))}
								</div>
							</div>

							{habitForm.trackingType !== 'boolean' && (
								<>
									<div>
										<label className="block text-sm text-gray-400 mb-2">Daily Target</label>
										<input
											type="number"
											min="1"
											max="24"
											value={habitForm.target}
											onChange={e => setHabitForm({ ...habitForm, target: parseInt(e.target.value) || 1 })}
											className="w-full px-4 py-2 rounded-lg bg-dark-700 border border-dark-600 text-white focus:border-neon-cyan focus:outline-none"
										/>
									</div>
									<div>
										<label className="block text-sm text-gray-400 mb-2">Max Value</label>
										<input
											type="number"
											min="1"
											max="24"
											value={habitForm.maxValue}
											onChange={e => setHabitForm({ ...habitForm, maxValue: parseInt(e.target.value) || 1 })}
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
												onClick={() => setHabitForm({ ...habitForm, icon })}
												className={`p-2 rounded-lg transition-all ${habitForm.icon === icon ? 'bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/30' : 'bg-dark-700 text-gray-400 hover:bg-dark-600'}`}
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
												onClick={() => setHabitForm({ ...habitForm, color })}
												className={`w-10 h-10 rounded-lg transition-all ${colors.bg} ${habitForm.color === color ? `ring-2 ring-offset-2 ring-offset-dark-800 ${colors.border.replace('border-', 'ring-')}` : ''}`}
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
							<button onClick={handleSaveHabit} disabled={isSaving} className="flex-1 btn-cyber py-2 flex items-center justify-center gap-2 disabled:opacity-50">
								{isSaving ? (
									<><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
								) : (
									editingHabit ? 'Save Changes' : 'Add Habit'
								)}
							</button>
						</div>
					</div>
				</div>
			)}

			<ConfirmModal
				isOpen={confirmOpen}
				title={deleteType === 'habit' ? 'Delete Habit' : 'Delete Skill'}
				message={`Delete this ${deleteType}? History will be preserved but the tracker will be removed.`}
				confirmText="Delete"
				isDangerous={true}
				onConfirm={confirmDelete}
				onCancel={() => setConfirmOpen(false)}
			/>
		</div>
	);
}
