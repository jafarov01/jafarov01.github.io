import { useState, useMemo } from 'react';
import { useData } from '../contexts/DataContext';
import { ROADMAP_DATA } from '../lib/roadmapData';
import {
	ChevronDown, ChevronUp, Github, CheckCircle2,
	Circle, Clock, ExternalLink, Info, Filter,
	Search, BarChart3, Target, Trophy
} from 'lucide-react';

export function Roadmap() {
	const { roadmapProgress, updateRoadmapTask } = useData();
	const [expandedPhases, setExpandedPhases] = useState<number[]>([1]);
	const [expandedTasks, setExpandedTasks] = useState<string[]>([]);
	const [searchQuery, setSearchQuery] = useState('');
	const [statusFilter, setStatusFilter] = useState<'all' | 'todo' | 'in-progress' | 'completed'>('all');

	// Statistics
	const stats = useMemo(() => {
		const totalTasks = ROADMAP_DATA.reduce((acc, phase) => acc + phase.tasks.length, 0);
		const progressEntries = Object.values(roadmapProgress);
		const completed = progressEntries.filter(p => p.status === 'completed').length;
		const inProgress = progressEntries.filter(p => p.status === 'in-progress').length;
		const percentage = totalTasks > 0 ? Math.round((completed / totalTasks) * 100) : 0;

		return { totalTasks, completed, inProgress, percentage };
	}, [roadmapProgress]);

	const togglePhase = (phaseNum: number) => {
		setExpandedPhases(prev =>
			prev.includes(phaseNum)
				? prev.filter(p => p !== phaseNum)
				: [...prev, phaseNum]
		);
	};

	const toggleTask = (taskId: string) => {
		setExpandedTasks(prev =>
			prev.includes(taskId)
				? prev.filter(id => id !== taskId)
				: [...prev, taskId]
		);
	};

	const filteredRoadmap = useMemo(() => {
		return ROADMAP_DATA.map(phase => ({
			...phase,
			tasks: phase.tasks.filter(task => {
				const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
					task.id.toLowerCase().includes(searchQuery.toLowerCase());
				const progress = roadmapProgress[task.id];
				const status = progress?.status || 'todo';
				const matchesStatus = statusFilter === 'all' || status === statusFilter;
				return matchesSearch && matchesStatus;
			})
		})).filter(phase => phase.tasks.length > 0);
	}, [searchQuery, statusFilter, roadmapProgress]);

	return (
		<div className="space-y-6">
			{/* Header & Stats */}
			<div className="flex flex-col md:flex-row gap-6">
				<div className="flex-1 card-cyber p-6 relative overflow-hidden">
					<div className="absolute top-0 right-0 p-4 opacity-10">
						<Trophy size={80} className="text-neon-yellow" />
					</div>
					<h1 className="text-3xl font-bold neon-text-cyan mb-2">Automotive Systems Roadmap</h1>
					<p className="text-gray-400 mb-6">30-Day Intensive Portfolio Builder for Tier-1/OEM Roles</p>

					<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
						<div className="space-y-1">
							<span className="text-xs text-gray-500 uppercase tracking-wider">Overall Progress</span>
							<div className="flex items-center gap-2">
								<span className="text-2xl font-bold text-neon-green">{stats.percentage}%</span>
								<div className="flex-1 h-2 bg-dark-700 rounded-full overflow-hidden">
									<div
										className="h-full progress-bar-cyber"
										style={{ width: `${stats.percentage}%` }}
									/>
								</div>
							</div>
						</div>
						<div className="space-y-1">
							<span className="text-xs text-gray-500 uppercase tracking-wider">Completed</span>
							<div className="flex items-center gap-2">
								<CheckCircle2 size={16} className="text-neon-green" />
								<span className="text-2xl font-bold text-white">{stats.completed}</span>
								<span className="text-gray-500">/ {stats.totalTasks}</span>
							</div>
						</div>
						<div className="space-y-1">
							<span className="text-xs text-gray-500 uppercase tracking-wider">In Progress</span>
							<div className="flex items-center gap-2">
								<Clock size={16} className="text-neon-yellow" />
								<span className="text-2xl font-bold text-white">{stats.inProgress}</span>
							</div>
						</div>
						<div className="space-y-1">
							<span className="text-xs text-gray-500 uppercase tracking-wider">Total Est. Time</span>
							<div className="flex items-center gap-2">
								<BarChart3 size={16} className="text-neon-purple" />
								<span className="text-2xl font-bold text-white">200+ hrs</span>
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* Filters */}
			<div className="flex flex-col md:flex-row gap-4 items-center justify-between">
				<div className="relative w-full md:w-96">
					<Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
					<input
						type="text"
						placeholder="Search tasks (e.g. 'CAN', 'LLVM')..."
						className="w-full pl-10 pr-4 py-2 bg-dark-800 border border-dark-600 rounded-lg text-sm focus:border-neon-cyan outline-none transition-all"
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
					/>
				</div>
				<div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
					{(['all', 'todo', 'in-progress', 'completed'] as const).map(f => (
						<button
							key={f}
							onClick={() => setStatusFilter(f)}
							className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap ${statusFilter === f
									? 'bg-neon-cyan text-dark-900 shadow-[0_0_10px_#00ffff44]'
									: 'bg-dark-800 text-gray-400 border border-dark-600 hover:border-gray-500'
								}`}
						>
							{f.replace('-', ' ')}
						</button>
					))}
				</div>
			</div>

			{/* Roadmap Phases */}
			<div className="space-y-4">
				{filteredRoadmap.map(phase => (
					<div key={phase.phase} className="space-y-2">
						<button
							onClick={() => togglePhase(phase.phase)}
							className={`w-full flex items-center justify-between p-4 rounded-lg bg-dark-800 border transition-all ${expandedPhases.includes(phase.phase) ? 'border-neon-purple/50' : 'border-dark-600 hover:border-gray-600'
								}`}
						>
							<div className="flex items-center gap-4">
								<div className={`w-10 h-10 rounded flex items-center justify-center font-bold text-lg ${expandedPhases.includes(phase.phase) ? 'bg-neon-purple text-white shadow-[0_0_10px_#9d00ff44]' : 'bg-dark-700 text-gray-400'
									}`}>
									{phase.phase}
								</div>
								<div className="text-left">
									<h3 className="font-bold text-white uppercase tracking-wider">PHASE {phase.phase}: {phase.title}</h3>
									<p className="text-xs text-gray-500">{phase.tasks.length} Tasks • {phase.description}</p>
								</div>
							</div>
							{expandedPhases.includes(phase.phase) ? <ChevronUp className="text-gray-500" /> : <ChevronDown className="text-gray-500" />}
						</button>

						{expandedPhases.includes(phase.phase) && (
							<div className="grid grid-cols-1 gap-3 pl-4 border-l-2 border-dark-700 ml-5">
								{phase.tasks.map(task => {
									const isExpanded = expandedTasks.includes(task.id);
									const progress = roadmapProgress[task.id] || { status: 'todo', notes: '', github_link: '' };

									return (
										<div
											key={task.id}
											className={`card-cyber transition-all ${isExpanded ? 'border-dark-500 ring-1 ring-dark-500/30' : 'hover:border-dark-500'
												}`}
										>
											{/* Task Header */}
											<div
												className="p-4 flex items-center justify-between cursor-pointer"
												onClick={() => toggleTask(task.id)}
											>
												<div className="flex items-center gap-4 flex-1">
													<button
														onClick={(e) => {
															e.stopPropagation();
															const nextStatusMap: Record<string, 'todo' | 'in-progress' | 'completed'> = {
																'todo': 'in-progress',
																'in-progress': 'completed',
																'completed': 'todo'
															};
															updateRoadmapTask(task.id, { status: nextStatusMap[progress.status] });
														}}
														className="focus:outline-none transition-transform hover:scale-110"
													>
														{progress.status === 'completed' ? (
															<CheckCircle2 className="text-neon-green" />
														) : progress.status === 'in-progress' ? (
															<Clock className="text-neon-yellow" />
														) : (
															<Circle className="text-gray-600" />
														)}
													</button>
													<div>
														<div className="flex items-center gap-2">
															<span className="text-xs font-mono text-neon-cyan">{task.id}</span>
															<span className="text-xs px-2 py-0.5 rounded bg-dark-700 text-gray-400 uppercase font-bold tracking-tighter">Day {task.day}</span>
															{task.priority === 'High' || task.priority === 'Very High' ? (
																<span className="text-[10px] px-1.5 py-0.5 rounded bg-neon-red/10 text-neon-red border border-neon-red/20 uppercase font-bold">Priority: {task.priority}</span>
															) : null}
														</div>
														<h4 className={`font-bold transition-colors ${progress.status === 'completed' ? 'text-gray-500 line-through' : 'text-white'}`}>
															{task.title}
														</h4>
													</div>
												</div>
												<div className="flex items-center gap-4">
													<div className="hidden md:flex flex-col items-end mr-4">
														<span className="text-[10px] text-gray-500 uppercase tracking-tighter">Estimate</span>
														<span className="text-xs font-mono text-gray-300">{task.estimatedTime}</span>
													</div>
													{isExpanded ? <ChevronUp size={20} className="text-gray-500" /> : <ChevronDown size={20} className="text-gray-500" />}
												</div>
											</div>

											{/* Task Body */}
											{isExpanded && (
												<div className="px-4 pb-4 border-t border-dark-700/50 pt-4 space-y-6">
													<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
														<div className="space-y-4">
															<div>
																<h5 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-2">
																	<Info size={14} className="text-neon-cyan" /> Description
																</h5>
																<p className="text-sm text-gray-300 leading-relaxed">{task.description}</p>
															</div>
															<div>
																<h5 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-2">
																	<Target size={14} className="text-neon-yellow" /> Requirements
																</h5>
																<ul className="space-y-1">
																	{task.requirements.map((req, i) => (
																		<li key={i} className="text-sm text-gray-400 flex items-start gap-2">
																			<span className="text-neon-yellow mt-1.5 w-1 h-1 rounded-full shrink-0" />
																			{req}
																		</li>
																	))}
																</ul>
															</div>
														</div>
														<div className="space-y-4">
															<div className="p-3 bg-dark-900/50 rounded-lg border border-dark-600">
																<h5 className="text-xs font-bold text-neon-cyan uppercase tracking-widest mb-2 flex items-center gap-2">
																	<Clock size={14} /> Technical Hints
																</h5>
																<ul className="space-y-1">
																	{task.technicalHints.map((hint, i) => (
																		<li key={i} className="text-[13px] text-gray-400 font-mono flex items-start gap-2">
																			<span className="text-neon-cyan mt-1.5 w-1 h-1 rounded-full shrink-0" />
																			{hint}
																		</li>
																	))}
																</ul>
															</div>
															<div>
																<h5 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-2">
																	<Info size={14} className="text-neon-purple" /> Domain Context
																</h5>
																<p className="text-xs text-neon-purple/70 italic">{task.domainConnection}</p>
															</div>
														</div>
													</div>

													<div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-dark-700/30">
														<div className="space-y-1.5">
															<label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Status</label>
															<select
																value={progress.status}
																onChange={(e) => updateRoadmapTask(task.id, { status: e.target.value as any })}
																className="w-full bg-dark-900 border border-dark-600 rounded px-3 py-1.5 text-xs text-white outline-none focus:border-neon-cyan transition-colors appearance-none cursor-pointer"
															>
																<option value="todo">Todo</option>
																<option value="in-progress">In Progress</option>
																<option value="completed">Completed</option>
															</select>
														</div>
														<div className="space-y-1.5">
															<label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">GitHub Link</label>
															<div className="relative">
																<Github size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500" />
																<input
																	type="text"
																	placeholder="https://github.com/..."
																	value={progress.github_link}
																	onChange={(e) => updateRoadmapTask(task.id, { github_link: e.target.value })}
																	className="w-full bg-dark-900 border border-dark-600 rounded pl-9 pr-3 py-1.5 text-xs text-white outline-none focus:border-neon-purple transition-colors"
																/>
															</div>
														</div>
														<div className="space-y-1.5 md:col-span-1">
															<label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Notes</label>
															<textarea
																placeholder="Tracking notes, implementation details..."
																value={progress.notes}
																rows={1}
																onChange={(e) => updateRoadmapTask(task.id, { notes: e.target.value })}
																className="w-full bg-dark-900 border border-dark-600 rounded px-3 py-1.5 text-xs text-white outline-none focus:border-neon-yellow transition-colors resize-none"
															/>
														</div>
													</div>

													{progress.github_link && (
														<div className="pt-2 flex justify-end">
															<a
																href={progress.github_link}
																target="_blank"
																rel="noopener noreferrer"
																className="flex items-center gap-1.5 text-[10px] font-bold text-neon-cyan hover:underline uppercase tracking-tighter"
															>
																View on GitHub <ExternalLink size={10} />
															</a>
														</div>
													)}
												</div>
											)}
										</div>
									);
								})}
							</div>
						)}
					</div>
				))}

				{filteredRoadmap.length === 0 && (
					<div className="py-20 text-center space-y-4">
						<Filter size={48} className="mx-auto text-dark-600" />
						<div>
							<h3 className="text-xl font-bold text-gray-400">No tasks found matching your filters</h3>
							<p className="text-gray-500 text-sm">Try adjusting your search or status filters</p>
						</div>
						<button
							onClick={() => { setSearchQuery(''); setStatusFilter('all'); }}
							className="text-neon-cyan text-sm font-bold uppercase hover:underline"
						>
							Clear all filters
						</button>
					</div>
				)}
			</div>
		</div>
	);
}
