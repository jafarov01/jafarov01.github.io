import { useState, useMemo } from 'react';
import { useData } from '../contexts/DataContext';
import { useToast } from '../contexts/ToastContext';
import {
	Target,
	Plus,
	Trash2,
	Edit2,
	X,
	Save,
	Flame,
	Clock,
	Calendar,
	TrendingUp,
	Award,
	Code,
	Languages,
	Brain,
	Music,
	Book,
	Gamepad2,
	Heart,
	Zap,
	Coffee,
	Pencil,
	Activity,
	Dumbbell,
	ChevronDown,
	ChevronUp,
	Eye,
	Loader2,
	Info
} from 'lucide-react';
import { type SkillDefinition, type CVProfile } from '../lib/seedData';
import { type SkillAnalytics, LEVEL_THRESHOLDS } from '../lib/skillAlgorithm';
import { ConfirmModal } from './ConfirmModal';

// Icon mapping
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
	code: Code, languages: Languages, brain: Brain, music: Music, book: Book,
	gamepad2: Gamepad2, heart: Heart, target: Target, zap: Zap, coffee: Coffee,
	pencil: Pencil, activity: Activity, dumbbell: Dumbbell, flame: Flame
};

const colorMap: Record<string, { bg: string; text: string; border: string; solid: string }> = {
	'neon-green': { bg: 'bg-neon-green/20', text: 'text-neon-green', border: 'border-neon-green/30', solid: 'bg-neon-green' },
	'neon-yellow': { bg: 'bg-neon-yellow/20', text: 'text-neon-yellow', border: 'border-neon-yellow/30', solid: 'bg-neon-yellow' },
	'neon-cyan': { bg: 'bg-neon-cyan/20', text: 'text-neon-cyan', border: 'border-neon-cyan/30', solid: 'bg-neon-cyan' },
	'neon-purple': { bg: 'bg-neon-purple/20', text: 'text-neon-purple', border: 'border-neon-purple/30', solid: 'bg-neon-purple' },
	'neon-red': { bg: 'bg-neon-red/20', text: 'text-neon-red', border: 'border-neon-red/30', solid: 'bg-neon-red' }
};

const availableIcons = ['code', 'languages', 'music', 'book', 'brain', 'dumbbell', 'heart', 'target', 'zap', 'coffee', 'pencil', 'gamepad2'];
const availableColors = ['neon-green', 'neon-yellow', 'neon-cyan', 'neon-purple', 'neon-red'];
const categories: SkillDefinition['category'][] = ['frontend', 'backend', 'devops', 'database', 'tools', 'language', 'soft-skill', 'other'];

export function SkillMastery() {
	const {
		skillDefinitions,
		addSkillDefinition,
		updateSkillDefinition,
		deleteSkillDefinition,
		getAllSkillAnalytics,
		jobs
	} = useData();
	const { showToast } = useToast();

	const [expandedSkillId, setExpandedSkillId] = useState<string | null>(null);
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [editingSkill, setEditingSkill] = useState<SkillDefinition | null>(null);
	const [isSaving, setIsSaving] = useState(false);

	// Delete confirmation
	const [confirmOpen, setConfirmOpen] = useState(false);
	const [deleteId, setDeleteId] = useState<string | null>(null);

	const [form, setForm] = useState({
		name: '',
		icon: 'code',
		color: 'neon-cyan',
		category: 'other' as SkillDefinition['category'],
		targetPerDay: '30 mins',
		// removed duplicate key
		years_experience: 0,
		is_tracked: true,
		show_on_cv: true,
		cv_profiles: [] as CVProfile[]
	});

	// Get all skill analytics
	const allAnalytics = useMemo(() => getAllSkillAnalytics(), [getAllSkillAnalytics]);

	// Map analytics by skill ID for quick lookup
	const analyticsMap = useMemo(() => {
		const map = new Map<string, SkillAnalytics>();
		allAnalytics.forEach(a => map.set(a.skillId, a));
		return map;
	}, [allAnalytics]);

	// Summary stats
	const totalSkills = skillDefinitions.length;
	const trackedSkills = skillDefinitions.filter(s => s.is_tracked !== false).length;
	const cvSkills = skillDefinitions.filter(s => s.show_on_cv).length;
	const totalHours = allAnalytics.reduce((sum, a) => sum + a.totalHours, 0);

	// Skills used in jobs (from tech_stack)
	const jobTechStack = useMemo(() => {
		const techSet = new Set<string>();
		jobs.forEach(job => {
			job.tech_stack.forEach(tech => techSet.add(tech));
		});
		return techSet;
	}, [jobs]);

	const resetForm = () => {
		setForm({
			name: '',
			icon: 'code',
			color: 'neon-cyan',
			category: 'other',
			targetPerDay: '30 mins',
			years_experience: 0,
			is_tracked: true,
			show_on_cv: true,
			cv_profiles: []
		});
		setEditingSkill(null);
	};

	const openAddModal = () => {
		resetForm();
		setIsModalOpen(true);
	};

	const openEditModal = (skill: SkillDefinition) => {
		setEditingSkill(skill);
		setForm({
			name: skill.name,
			icon: skill.icon,
			color: skill.color,
			category: skill.category || 'other',
			targetPerDay: skill.targetPerDay,
			years_experience: skill.years_experience || 0,
			is_tracked: skill.is_tracked !== false,
			show_on_cv: skill.show_on_cv || false,
			cv_profiles: skill.cv_profiles || []
		});
		setIsModalOpen(true);
	};

	const handleSave = async () => {
		if (!form.name.trim()) return;

		setIsSaving(true);
		try {
			const data = {
				name: form.name.trim(),
				icon: form.icon,
				color: form.color,
				category: form.category,
				targetPerDay: form.targetPerDay,
				trackingOptions: ['0 mins', '15 mins', '30 mins', '1 hour', '2 hours'],
				years_experience: form.years_experience,
				is_tracked: form.is_tracked,
				show_on_cv: form.show_on_cv,
				cv_profiles: form.cv_profiles.length > 0 ? form.cv_profiles : undefined
			};

			if (editingSkill) {
				await updateSkillDefinition(editingSkill.id, data);
				showToast('Skill updated', 'success');
			} else {
				await addSkillDefinition(data);
				showToast('Skill added to registry', 'success');
			}

			setIsModalOpen(false);
			resetForm();
		} catch {
			showToast('Failed to save skill', 'error');
		} finally {
			setIsSaving(false);
		}
	};

	const handleDeleteRequest = (id: string) => {
		setDeleteId(id);
		setConfirmOpen(true);
	};

	const confirmDelete = async () => {
		if (deleteId) {
			try {
				await deleteSkillDefinition(deleteId);
				showToast('Skill deleted', 'success');
				setConfirmOpen(false);
				setDeleteId(null);
			} catch {
				showToast('Failed to delete skill', 'error');
				setConfirmOpen(false);
			}
		}
	};

	const IconComponent = ({ name, className }: { name: string; className?: string }) => {
		const Icon = iconMap[name] || Code;
		return <Icon className={className} />;
	};

	const getLevelColor = (level: number) => {
		switch (level) {
			case 1: return 'text-gray-400';
			case 2: return 'text-neon-yellow';
			case 3: return 'text-neon-cyan';
			case 4: return 'text-neon-purple';
			case 5: return 'text-neon-green';
			default: return 'text-gray-400';
		}
	};

	const getCategoryColor = (category: string | undefined) => {
		switch (category) {
			case 'frontend': return 'bg-neon-purple/20 text-neon-purple';
			case 'backend': return 'bg-neon-green/20 text-neon-green';
			case 'devops': return 'bg-neon-yellow/20 text-neon-yellow';
			case 'database': return 'bg-neon-cyan/20 text-neon-cyan';
			case 'tools': return 'bg-neon-red/20 text-neon-red';
			case 'language': return 'bg-blue-500/20 text-blue-400';
			case 'soft-skill': return 'bg-pink-500/20 text-pink-400';
			default: return 'bg-dark-600 text-gray-400';
		}
	};

	return (
		<div className="p-6 max-w-7xl mx-auto space-y-6">
			{/* Header */}
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
				<div>
					<h1 className="text-3xl font-bold text-white flex items-center gap-3">
						<Target className="w-8 h-8 text-neon-cyan" />
						Skill Mastery
					</h1>
					<p className="text-gray-500 mt-1">
						Unified skill registry — track progress, see proficiency, use everywhere
					</p>
				</div>
				<button
					onClick={openAddModal}
					className="btn-cyber flex items-center gap-2"
				>
					<Plus className="w-4 h-4" />
					Add Skill
				</button>
			</div>

			{/* Summary Cards */}
			<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
				<div className="card-cyber p-4">
					<div className="text-2xl font-bold text-white">{totalSkills}</div>
					<div className="text-sm text-gray-500">Total Skills</div>
				</div>
				<div className="card-cyber p-4">
					<div className="text-2xl font-bold text-neon-cyan">{trackedSkills}</div>
					<div className="text-sm text-gray-500">Being Tracked</div>
				</div>
				<div className="card-cyber p-4">
					<div className="text-2xl font-bold text-neon-purple">{cvSkills}</div>
					<div className="text-sm text-gray-500">On CV</div>
				</div>
				<div className="card-cyber p-4">
					<div className="text-2xl font-bold text-neon-green">{totalHours.toFixed(1)}h</div>
					<div className="text-sm text-gray-500">Total Practice</div>
				</div>
			</div>

			{/* Info Banner */}
			<div className="card-cyber p-4 border-neon-cyan/30 bg-neon-cyan/5">
				<div className="flex items-start gap-3">
					<Info className="w-5 h-5 text-neon-cyan flex-shrink-0 mt-0.5" />
					<div className="text-sm text-gray-300">
						<strong className="text-white">How it works:</strong> Add skills here once, use them everywhere.
						Toggle <span className="text-neon-cyan">"Track Daily"</span> to practice in Protocol.
						Toggle <span className="text-neon-purple">"Show on CV"</span> to display in Career.
						Your proficiency level is <span className="text-neon-green">calculated automatically</span> from your practice history!
					</div>
				</div>
			</div>

			{/* Skills List */}
			{skillDefinitions.length === 0 ? (
				<div className="card-cyber p-12 text-center">
					<Target className="w-12 h-12 text-gray-600 mx-auto mb-4" />
					<h3 className="text-lg font-medium text-white mb-2">No skills yet</h3>
					<p className="text-gray-500 mb-4">Add your first skill to start tracking your mastery journey</p>
					<button onClick={openAddModal} className="btn-cyber">
						<Plus className="w-4 h-4 mr-2" />
						Add Your First Skill
					</button>
				</div>
			) : (
				<div className="space-y-4">
					{skillDefinitions.map(skill => {
						const analytics = analyticsMap.get(skill.id);
						const isExpanded = expandedSkillId === skill.id;
						const colors = colorMap[skill.color] || colorMap['neon-cyan'];
						const isUsedInJobs = jobTechStack.has(skill.name);

						return (
							<div
								key={skill.id}
								className={`card-cyber overflow-hidden transition-all ${isExpanded ? 'ring-1 ring-neon-cyan/50' : ''}`}
							>
								{/* Skill Header */}
								<div
									className="p-4 cursor-pointer hover:bg-dark-700/50 transition-colors"
									onClick={() => setExpandedSkillId(isExpanded ? null : skill.id)}
								>
									<div className="flex items-center justify-between">
										<div className="flex items-center gap-4">
											{/* Icon */}
											<div className={`w-12 h-12 rounded-xl ${colors.bg} ${colors.border} border flex items-center justify-center`}>
												<IconComponent name={skill.icon} className={`w-6 h-6 ${colors.text}`} />
											</div>

											{/* Name & Category */}
											<div>
												<div className="flex items-center gap-2">
													<h3 className="text-lg font-semibold text-white">{skill.name}</h3>
													<span className={`text-xs px-2 py-0.5 rounded ${getCategoryColor(skill.category)}`}>
														{skill.category || 'other'}
													</span>
													{isUsedInJobs && (
														<span className="text-xs px-2 py-0.5 rounded bg-neon-green/20 text-neon-green">
															Used in Jobs
														</span>
													)}
												</div>
												<div className="flex items-center gap-3 mt-1 text-sm">
													{skill.is_tracked !== false && (
														<span className="text-neon-cyan flex items-center gap-1">
															<Eye className="w-3 h-3" /> Tracking
														</span>
													)}
													{skill.show_on_cv && (
														<span className="text-neon-purple flex items-center gap-1">
															<Award className="w-3 h-3" /> On CV
														</span>
													)}
													{skill.years_experience ? (
														<span className="text-gray-500">
															{skill.years_experience}y prior exp.
														</span>
													) : null}
												</div>
											</div>
										</div>

										{/* Level & Progress */}
										<div className="flex items-center gap-6">
											{analytics && (
												<>
													<div className="text-right hidden sm:block">
														<div className={`text-2xl font-bold ${getLevelColor(analytics.level)}`}>
															Lv.{analytics.level}
														</div>
														<div className="text-xs text-gray-500">{analytics.levelName}</div>
													</div>

													<div className="hidden md:block w-32">
														<div className="flex justify-between text-xs mb-1">
															<span className="text-gray-500">{analytics.totalPoints} pts</span>
															{analytics.level < 5 && (
																<span className="text-gray-500">{analytics.pointsToNextLevel} to next</span>
															)}
														</div>
														<div className="h-2 bg-dark-600 rounded-full overflow-hidden">
															<div
																className={`h-full ${colors.solid} transition-all duration-500`}
																style={{ width: `${analytics.progressPercent}%` }}
															/>
														</div>
													</div>

													<div className="flex items-center gap-2 text-sm">
														{analytics.currentStreak > 0 && (
															<span className="flex items-center gap-1 text-neon-yellow">
																<Flame className="w-4 h-4" />
																{analytics.currentStreak}
															</span>
														)}
													</div>
												</>
											)}

											<div className="flex items-center gap-2">
												<button
													onClick={(e) => { e.stopPropagation(); openEditModal(skill); }}
													className="p-2 text-gray-400 hover:text-neon-cyan transition-colors"
												>
													<Edit2 className="w-4 h-4" />
												</button>
												<button
													onClick={(e) => { e.stopPropagation(); handleDeleteRequest(skill.id); }}
													className="p-2 text-gray-400 hover:text-neon-red transition-colors"
												>
													<Trash2 className="w-4 h-4" />
												</button>
												{isExpanded ? (
													<ChevronUp className="w-5 h-5 text-gray-400" />
												) : (
													<ChevronDown className="w-5 h-5 text-gray-400" />
												)}
											</div>
										</div>
									</div>
								</div>

								{/* Expanded Details */}
								{isExpanded && analytics && (
									<div className="border-t border-dark-600 p-4 bg-dark-800/50">
										<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
											{/* Stats Cards */}
											<div className="space-y-4">
												<h4 className="text-sm font-medium text-gray-400 uppercase tracking-wider">Statistics</h4>
												<div className="grid grid-cols-2 gap-3">
													<div className="bg-dark-700 rounded-lg p-3">
														<Clock className="w-4 h-4 text-neon-cyan mb-1" />
														<div className="text-xl font-bold text-white">{analytics.totalHours}h</div>
														<div className="text-xs text-gray-500">Total Time</div>
													</div>
													<div className="bg-dark-700 rounded-lg p-3">
														<Calendar className="w-4 h-4 text-neon-purple mb-1" />
														<div className="text-xl font-bold text-white">{analytics.daysPracticed}</div>
														<div className="text-xs text-gray-500">Days Practiced</div>
													</div>
													<div className="bg-dark-700 rounded-lg p-3">
														<TrendingUp className="w-4 h-4 text-neon-green mb-1" />
														<div className="text-xl font-bold text-white">{analytics.consistencyPercent}%</div>
														<div className="text-xs text-gray-500">Consistency</div>
													</div>
													<div className="bg-dark-700 rounded-lg p-3">
														<Flame className="w-4 h-4 text-neon-yellow mb-1" />
														<div className="text-xl font-bold text-white">{analytics.longestStreak}</div>
														<div className="text-xs text-gray-500">Best Streak</div>
													</div>
												</div>
											</div>

											{/* Score Breakdown */}
											<div className="space-y-4">
												<h4 className="text-sm font-medium text-gray-400 uppercase tracking-wider">Score Breakdown</h4>
												<div className="bg-dark-700 rounded-lg p-4 space-y-3">
													<div className="flex justify-between text-sm">
														<span className="text-gray-400">Base ({analytics.totalHours}h × 10)</span>
														<span className="text-white">{analytics.basePoints} pts</span>
													</div>
													<div className="flex justify-between text-sm">
														<span className="text-gray-400">
															Consistency ({analytics.consistencyPercent}% → {analytics.consistencyMultiplier}x)
														</span>
														<span className="text-neon-cyan">×{analytics.consistencyMultiplier}</span>
													</div>
													<div className="flex justify-between text-sm">
														<span className="text-gray-400">
															Recency ({analytics.lastPracticeDate ? 'Active' : 'Inactive'})
														</span>
														<span className="text-neon-purple">×{analytics.recencyMultiplier}</span>
													</div>
													<div className="flex justify-between text-sm">
														<span className="text-gray-400">Streak Bonus</span>
														<span className="text-neon-yellow">+{analytics.streakBonus} pts</span>
													</div>
													{analytics.experienceBonus > 0 && (
														<div className="flex justify-between text-sm">
															<span className="text-gray-400">Prior Experience</span>
															<span className="text-neon-green">+{analytics.experienceBonus} pts</span>
														</div>
													)}
													<div className="border-t border-dark-600 pt-2 flex justify-between font-bold">
														<span className="text-white">Total</span>
														<span className="text-neon-green">{analytics.totalPoints} pts</span>
													</div>
												</div>
											</div>

											{/* Heatmap */}
											<div className="space-y-4">
												<h4 className="text-sm font-medium text-gray-400 uppercase tracking-wider">Last 90 Days</h4>
												<div className="bg-dark-700 rounded-lg p-4">
													<div className="grid grid-cols-15 gap-1">
														{analytics.heatmapData.map((day, i) => (
															<div
																key={i}
																className={`w-3 h-3 rounded-sm ${day.intensity === 0 ? 'bg-dark-600' :
																	day.intensity === 1 ? `${colors.bg}` :
																		day.intensity === 2 ? `${colors.bg} opacity-70` :
																			colors.solid
																	}`}
																title={`${day.date}: ${day.minutes} mins`}
															/>
														))}
													</div>
													<div className="flex items-center justify-between mt-3 text-xs text-gray-500">
														<span>Less</span>
														<div className="flex gap-1">
															<div className="w-3 h-3 rounded-sm bg-dark-600" />
															<div className={`w-3 h-3 rounded-sm ${colors.bg}`} />
															<div className={`w-3 h-3 rounded-sm ${colors.bg} opacity-70`} />
															<div className={`w-3 h-3 rounded-sm ${colors.solid}`} />
														</div>
														<span>More</span>
													</div>
												</div>

												{/* Level Progress */}
												<div className="bg-dark-700 rounded-lg p-4">
													<div className="flex items-center justify-between mb-2">
														<span className={`font-bold ${getLevelColor(analytics.level)}`}>
															Level {analytics.level}: {analytics.levelName}
														</span>
														{analytics.level < 5 && (
															<span className="text-sm text-gray-400">
																{analytics.pointsToNextLevel} pts to Lv.{analytics.level + 1}
															</span>
														)}
													</div>
													<div className="flex gap-1">
														{LEVEL_THRESHOLDS.map((threshold) => (
															<div
																key={threshold.level}
																className={`flex-1 h-3 rounded ${analytics.level >= threshold.level
																	? colors.solid
																	: 'bg-dark-600'
																	}`}
															/>
														))}
													</div>
													<div className="flex justify-between mt-1 text-xs text-gray-500">
														{LEVEL_THRESHOLDS.map(t => (
															<span key={t.level}>{t.name}</span>
														))}
													</div>
												</div>
											</div>
										</div>
									</div>
								)}
							</div>
						);
					})}
				</div>
			)}

			{/* Add/Edit Modal */}
			{isModalOpen && (
				<div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
					<div className="card-cyber p-0 w-full max-w-lg max-h-[85vh] overflow-hidden flex flex-col">
						{/* Header */}
						<div className="flex items-center justify-between p-6 pb-4 border-b border-dark-600">
							<h2 className="text-xl font-bold text-white flex items-center gap-2">
								<Target className="w-5 h-5 text-neon-cyan" />
								{editingSkill ? 'Edit Skill' : 'Add New Skill'}
							</h2>
							<button
								onClick={() => { setIsModalOpen(false); resetForm(); }}
								className="p-2 text-gray-400 hover:text-white"
							>
								<X className="w-5 h-5" />
							</button>
						</div>

						{/* Scrollable Content */}
						<div className="flex-1 overflow-y-auto p-6 pt-4">
							<div className="space-y-4">
								{/* Name */}
								<div>
									<label className="block text-sm text-gray-400 mb-1">Skill Name *</label>
									<input
										type="text"
										value={form.name}
										onChange={(e) => setForm({ ...form, name: e.target.value })}
										className="input-cyber w-full"
										placeholder="e.g., Python, TypeScript, Italian"
									/>
								</div>

								{/* Category */}
								<div>
									<label className="block text-sm text-gray-400 mb-1">Category</label>
									<select
										value={form.category}
										onChange={(e) => setForm({ ...form, category: e.target.value as SkillDefinition['category'] })}
										className="input-cyber w-full"
									>
										{categories.map(cat => (
											<option key={cat} value={cat}>
												{cat === 'soft-skill' ? 'Soft Skill' : (cat ? cat.charAt(0).toUpperCase() + cat.slice(1) : 'Other')}
											</option>
										))}
									</select>
								</div>

								{/* Icon & Color */}
								<div className="grid grid-cols-2 gap-4">
									<div>
										<label className="block text-sm text-gray-400 mb-1">Icon</label>
										<div className="flex flex-wrap gap-2">
											{availableIcons.map(icon => (
												<button
													key={icon}
													type="button"
													onClick={() => setForm({ ...form, icon })}
													className={`p-2 rounded-lg border ${form.icon === icon
														? 'border-neon-cyan bg-neon-cyan/20'
														: 'border-dark-600 hover:border-dark-500'
														}`}
												>
													<IconComponent name={icon} className="w-4 h-4 text-gray-300" />
												</button>
											))}
										</div>
									</div>
									<div>
										<label className="block text-sm text-gray-400 mb-1">Color</label>
										<div className="flex flex-wrap gap-2">
											{availableColors.map(color => (
												<button
													key={color}
													type="button"
													onClick={() => setForm({ ...form, color })}
													className={`w-8 h-8 rounded-lg ${colorMap[color].solid} ${form.color === color ? 'ring-2 ring-white ring-offset-2 ring-offset-dark-800' : ''
														}`}
												/>
											))}
										</div>
									</div>
								</div>

								{/* Target Per Day */}
								<div>
									<label className="block text-sm text-gray-400 mb-1">Daily Target</label>
									<select
										value={form.targetPerDay}
										onChange={(e) => setForm({ ...form, targetPerDay: e.target.value })}
										className="input-cyber w-full"
									>
										<option value="15 mins">15 mins</option>
										<option value="30 mins">30 mins</option>
										<option value="1 hour">1 hour</option>
										<option value="2 hours">2 hours</option>
									</select>
								</div>

								{/* Prior Experience */}
								<div>
									<label className="block text-sm text-gray-400 mb-1">
										Years of Prior Experience
										<span className="text-gray-600 ml-1">(before tracking)</span>
									</label>
									<input
										type="number"
										min="0"
										max="30"
										value={form.years_experience}
										onChange={(e) => setForm({ ...form, years_experience: parseInt(e.target.value) || 0 })}
										className="input-cyber w-full"
									/>
									<p className="text-xs text-gray-500 mt-1">
										Each year adds 50 bonus points to your score
									</p>
								</div>

								{/* Toggles */}
								<div className="space-y-3 pt-2">
									<label className="flex items-center justify-between p-3 bg-dark-700 rounded-lg cursor-pointer">
										<div className="flex items-center gap-3">
											<Eye className="w-5 h-5 text-neon-cyan" />
											<div>
												<div className="text-white font-medium">Track Daily</div>
												<div className="text-xs text-gray-500">Show in Protocol for daily practice logging</div>
											</div>
										</div>
										<input
											type="checkbox"
											checked={form.is_tracked}
											onChange={(e) => setForm({ ...form, is_tracked: e.target.checked })}
											className="w-5 h-5 rounded border-dark-600 bg-dark-800 text-neon-cyan focus:ring-neon-cyan"
										/>
									</label>

									<label className="flex items-center justify-between p-3 bg-dark-700 rounded-lg cursor-pointer">
										<div className="flex items-center gap-3">
											<Award className="w-5 h-5 text-neon-purple" />
											<div>
												<div className="text-white font-medium">Show on CV</div>
												<div className="text-xs text-gray-500">Display in Career page for professional profile</div>
											</div>
										</div>
										<input
											type="checkbox"
											checked={form.show_on_cv}
											onChange={(e) => setForm({ ...form, show_on_cv: e.target.checked })}
											className="w-5 h-5 rounded border-dark-600 bg-dark-800 text-neon-purple focus:ring-neon-purple"
										/>
									</label>

									{/* CV Profiles Selection */}
									{form.show_on_cv && (
										<div className="pt-2">
											<label className="block text-sm text-gray-400 mb-2">CV Profiles</label>
											<div className="flex flex-wrap gap-4 p-3 bg-dark-700/50 rounded-lg border border-dark-600">
												<label className="flex items-center gap-2 cursor-pointer">
													<input
														type="checkbox"
														checked={form.cv_profiles.includes('se')}
														onChange={e => {
															const newProfiles = e.target.checked
																? [...form.cv_profiles, 'se']
																: form.cv_profiles.filter(p => p !== 'se');
															setForm({ ...form, cv_profiles: newProfiles as CVProfile[] });
														}}
														className="w-4 h-4 accent-neon-green"
													/>
													<span className="text-white text-sm">Software Engineering</span>
												</label>
												<label className="flex items-center gap-2 cursor-pointer">
													<input
														type="checkbox"
														checked={form.cv_profiles.includes('cs')}
														onChange={e => {
															const newProfiles = e.target.checked
																? [...form.cv_profiles, 'cs']
																: form.cv_profiles.filter(p => p !== 'cs');
															setForm({ ...form, cv_profiles: newProfiles as CVProfile[] });
														}}
														className="w-4 h-4 accent-neon-green"
													/>
													<span className="text-white text-sm">Customer Support</span>
												</label>
												<label className="flex items-center gap-2 cursor-pointer">
													<input
														type="checkbox"
														checked={form.cv_profiles.includes('all')}
														onChange={e => {
															const newProfiles = e.target.checked
																? [...form.cv_profiles, 'all']
																: form.cv_profiles.filter(p => p !== 'all');
															setForm({ ...form, cv_profiles: newProfiles as CVProfile[] });
														}}
														className="w-4 h-4 accent-neon-green"
													/>
													<span className="text-white text-sm">All Profiles</span>
												</label>
											</div>
											<p className="text-xs text-gray-500 mt-1">Select which CV types this skill should appear on.</p>
										</div>
									)}
								</div>
							</div>
						</div>

						{/* Fixed Footer */}
						<div className="flex gap-3 p-6 pt-4 border-t border-dark-600 bg-dark-800">
							<button
								onClick={() => { setIsModalOpen(false); resetForm(); }}
								className="flex-1 px-4 py-2 border border-dark-600 rounded-lg text-gray-400 hover:text-white hover:border-dark-500 transition-colors"
							>
								Cancel
							</button>
							<button
								onClick={handleSave}
								disabled={!form.name.trim() || isSaving}
								className="flex-1 btn-cyber flex items-center justify-center gap-2"
							>
								{isSaving ? (
									<Loader2 className="w-4 h-4 animate-spin" />
								) : (
									<Save className="w-4 h-4" />
								)}
								{editingSkill ? 'Update' : 'Add Skill'}
							</button>
						</div>
					</div>
				</div>
			)}

			{/* Delete Confirmation */}
			<ConfirmModal
				isOpen={confirmOpen}
				title="Delete Skill"
				message="Are you sure? This will remove the skill from your registry. Practice history will be preserved."
				onConfirm={confirmDelete}
				onCancel={() => { setConfirmOpen(false); setDeleteId(null); }}
			/>
		</div>
	);
}
