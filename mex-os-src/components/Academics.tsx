import { useState, useMemo } from 'react';
import { useData } from '../contexts/DataContext';
import { useToast } from '../contexts/ToastContext';
import {
	GraduationCap,
	Calendar,
	AlertTriangle,
	CheckCircle2,
	Clock,
	Target,
	BookOpen,
	Plus,
	Trash2,
	X,
	Edit2,
	Save,
	Loader2,
	Zap
} from 'lucide-react';
import { ConfirmModal } from './ConfirmModal';
import { differenceInDays, format } from 'date-fns';
import { type Exam } from '../lib/seedData';

const examStatuses: Exam['status'][] = ['study_plan', 'enrolled', 'planned', 'booked', 'passed', 'dropped'];
const examCategories = ['Mandatory Core', 'Elective', 'Free Choice', 'Seminar', 'Thesis', 'Other'];

export function Academics() {
	const { 
		exams, 
		updateExamStatus, 
		updateExam, 
		addExam, 
		deleteExam, 
		getPassedCFUs, 
		profile,
		// v7.0 Strategy Decision System
		getTriggeredRules,
		getExamsWithActiveRules
	} = useData();
	const { showToast } = useToast();
	const now = new Date();
	const passedCFUs = getPassedCFUs();
	const cfuProgress = (passedCFUs / 20) * 100;

	// v7.0: Get exams with strategic rules
	const triggeredRules = getTriggeredRules();
	const examsWithActiveRules = getExamsWithActiveRules();

	const [isModalOpen, setIsModalOpen] = useState(false);
	const [editingExam, setEditingExam] = useState<Exam | null>(null);
	const [isSaving, setIsSaving] = useState(false);

	// Delete confirmation state
	const [confirmOpen, setConfirmOpen] = useState(false);
	const [deleteId, setDeleteId] = useState<string | null>(null);

	const [formData, setFormData] = useState({
		name: '',
		cfu: 6,
		status: 'enrolled' as Exam['status'],
		exam_date: '',
		strategy_notes: '',
		is_scholarship_critical: true,
		category: 'Mandatory Core'
	});

	// Tab filter state
	const [activeTab, setActiveTab] = useState<'active' | 'passed' | 'all'>('active');

	// Filtered exams based on tab
	const { activeExams, passedExams, filteredExams } = useMemo(() => {
		const active = exams.filter(e => e.status !== 'passed' && e.status !== 'dropped');
		const passed = exams.filter(e => e.status === 'passed');
		
		let filtered: typeof exams;
		switch (activeTab) {
			case 'active':
				filtered = active;
				break;
			case 'passed':
				filtered = passed;
				break;
			default:
				filtered = exams;
		}
		
		return { activeExams: active, passedExams: passed, filteredExams: filtered };
	}, [exams, activeTab]);

	const handleStatusChange = async (examId: string, newStatus: Exam['status']) => {
		try {
			await updateExamStatus(examId, newStatus);
		} catch {
			showToast('Failed to update status', 'error');
		}
	};

	const resetForm = () => {
		setFormData({
			name: '',
			cfu: 6,
			status: 'enrolled',
			exam_date: '',
			strategy_notes: '',
			is_scholarship_critical: true,
			category: 'Mandatory Core'
		});
		setEditingExam(null);
	};

	const openAddModal = () => {
		resetForm();
		setIsModalOpen(true);
	};

	const openEditModal = (exam: Exam) => {
		setEditingExam(exam);
		setFormData({
			name: exam.name,
			cfu: exam.cfu,
			status: exam.status,
			exam_date: exam.exam_date || '',
			strategy_notes: exam.strategy_notes,
			is_scholarship_critical: exam.is_scholarship_critical,
			category: exam.category
		});
		setIsModalOpen(true);
	};

	const handleSave = async () => {
		if (!formData.name.trim()) return;

		setIsSaving(true);
		try {
			const examData = {
				name: formData.name,
				cfu: formData.cfu,
				status: formData.status,
				exam_date: formData.exam_date || null,
				strategy_notes: formData.strategy_notes,
				is_scholarship_critical: formData.is_scholarship_critical,
				category: formData.category
			};

			if (editingExam) {
				await updateExam(editingExam.id, examData);
				showToast('Exam updated', 'success');
			} else {
				await addExam(examData);
				showToast('Exam added', 'success');
			}

			setIsModalOpen(false);
			resetForm();
		} catch {
			showToast('Failed to save exam. Please try again.', 'error');
		} finally {
			setIsSaving(false);
		}
	};

	// Delete confirmation handlers
	const handleDeleteRequest = (id: string) => {
		setDeleteId(id);
		setConfirmOpen(true);
	};

	const confirmDelete = async () => {
		if (deleteId) {
			try {
				await deleteExam(deleteId);
				showToast('Exam deleted', 'success');
				setConfirmOpen(false);
				setDeleteId(null);
			} catch {
				showToast('Failed to delete exam', 'error');
				setConfirmOpen(false);
			}
		}
	};

	const getStatusColor = (status: Exam['status']) => {
		switch (status) {
			case 'passed': return 'bg-neon-green/20 text-neon-green border-neon-green/30';
			case 'booked': return 'bg-neon-cyan/10 text-neon-cyan border-neon-cyan/30';
			case 'planned': return 'bg-neon-yellow/10 text-neon-yellow border-neon-yellow/30';
			case 'enrolled': return 'bg-neon-purple/10 text-neon-purple border-neon-purple/30';
			case 'dropped': return 'bg-neon-red/10 text-neon-red border-neon-red/30';
			default: return 'bg-dark-600 text-gray-400 border-dark-500';
		}
	};

	const getStatusLabel = (status: Exam['status']) => {
		switch (status) {
			case 'study_plan': return 'Study Plan';
			case 'enrolled': return 'Enrolled';
			case 'planned': return 'Planned';
			case 'booked': return 'Booked';
			case 'passed': return 'Passed';
			case 'dropped': return 'Dropped';
			default: return status;
		}
	};

	// Calculate date range dynamically from actual exams
	const upcomingExams = exams.filter(e => e.exam_date && new Date(e.exam_date) > now && e.status !== 'passed');
	const dateRange = upcomingExams.length > 0
		? `${format(new Date(upcomingExams[0].exam_date!), 'MMM d')} - ${format(new Date(upcomingExams[upcomingExams.length - 1].exam_date!), 'MMM d')}`
		: null;

	return (
		<div className="p-6 max-w-7xl mx-auto space-y-6">
			{/* Header */}
			<div className="page-header">
				<div>
					<h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-2 sm:gap-3">
						<GraduationCap className="w-6 h-6 sm:w-8 sm:h-8 text-neon-cyan flex-shrink-0" />
						Academic Radar
					</h1>
					<p className="text-gray-500 mt-1 text-sm sm:text-base">
						{profile?.name || 'Student'} • Track your academic progress
					</p>
				</div>
				<button
					onClick={openAddModal}
					className="btn-cyber px-3 sm:px-4 py-2 flex items-center gap-2"
				>
					<Plus className="w-4 h-4" />
					<span className="hidden sm:inline">Add Exam</span>
					<span className="sm:hidden">Add</span>
				</button>
			</div>

			{/* CFU Progress Banner */}
			<div className="card-cyber p-6">
				<div className="flex items-center justify-between mb-4">
					<div className="flex items-center gap-3">
						<Target className="w-6 h-6 text-neon-green" />
						<div>
							<h2 className="text-lg font-semibold text-white">Scholarship Unlock Progress</h2>
							<p className="text-sm text-gray-500">20 CFUs required for merit installment</p>
						</div>
					</div>
					<div className="text-right">
						<span className="text-3xl font-bold text-white">{passedCFUs}</span>
						<span className="text-gray-500">/20 CFU</span>
					</div>
				</div>
				<div className="h-4 bg-dark-700 rounded-full overflow-hidden">
					<div
						className="h-full progress-bar-cyber rounded-full transition-all duration-700"
						style={{ width: `${Math.min(cfuProgress, 100)}%` }}
					/>
				</div>
				<div className="flex justify-between mt-2 text-sm">
					<span className="text-gray-500">Merit Installment LOCKED</span>
					<span className={passedCFUs >= 20 ? 'text-neon-green' : 'text-gray-500'}>
						{passedCFUs >= 20 ? '✓ UNLOCKED' : `${20 - passedCFUs} CFU remaining`}
					</span>
				</div>
			</div>

			{/* Exam List */}
			<div className="card-cyber p-6">
				<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
					<h2 className="text-lg font-semibold text-white flex items-center gap-2">
						<BookOpen className="w-5 h-5 text-neon-cyan" />
						{dateRange ? `Exams (${dateRange})` : 'All Exams'}
					</h2>
					
					{/* Tab Filter */}
					<div className="flex bg-dark-700 rounded-lg p-1 border border-dark-600">
						<button
							onClick={() => setActiveTab('active')}
							className={`px-3 py-1.5 rounded text-sm font-medium transition-all ${
								activeTab === 'active'
									? 'bg-neon-cyan/20 text-neon-cyan'
									: 'text-gray-500 hover:text-gray-300'
							}`}
						>
							Active ({activeExams.length})
						</button>
						<button
							onClick={() => setActiveTab('passed')}
							className={`px-3 py-1.5 rounded text-sm font-medium transition-all ${
								activeTab === 'passed'
									? 'bg-neon-green/20 text-neon-green'
									: 'text-gray-500 hover:text-gray-300'
							}`}
						>
							Passed ({passedExams.length})
						</button>
						<button
							onClick={() => setActiveTab('all')}
							className={`px-3 py-1.5 rounded text-sm font-medium transition-all ${
								activeTab === 'all'
									? 'bg-dark-600 text-white'
									: 'text-gray-500 hover:text-gray-300'
							}`}
						>
							All ({exams.length})
						</button>
					</div>
				</div>

				{filteredExams.length === 0 ? (
					<div className="text-center py-12">
						<BookOpen className="w-12 h-12 text-gray-600 mx-auto mb-4" />
						<p className="text-gray-500">
							{activeTab === 'active' ? 'No active exams.' : 
							 activeTab === 'passed' ? 'No passed exams yet.' : 
							 'No exams tracked yet.'}
						</p>
						{exams.length === 0 && (
							<button
								onClick={openAddModal}
								className="mt-4 btn-cyber px-4 py-2"
							>
								Add Your First Exam
							</button>
						)}
					</div>
				) : (
					<div className="space-y-4">
						{filteredExams.map(exam => {
							const examDate = exam.exam_date ? new Date(exam.exam_date) : null;
							const daysLeft = examDate ? differenceInDays(examDate, now) : null;
							const isPassed = exam.status === 'passed';
							// v7.0: Use rule-based detection instead of text matching
							const hasActiveRule = examsWithActiveRules.some(e => e.id === exam.id);
							const isOverdue = triggeredRules.some(tr => tr.linkedExams.some(e => e.id === exam.id));
							const isPast = examDate && examDate < now && !isPassed;

							return (
								<div
									key={exam.id}
									className={`p-4 rounded-lg border transition-all group relative ${isPassed
										? 'bg-neon-green/5 border-neon-green/30'
										: isOverdue
											? 'bg-neon-red/5 border-neon-red/30'
											: hasActiveRule
												? 'bg-neon-yellow/5 border-neon-yellow/30'
												: isPast
													? 'bg-dark-700/50 border-dark-600 opacity-50'
													: 'bg-dark-700 border-dark-600 hover:border-neon-cyan/30'
										}`}
								>
									{/* Action buttons */}
									<div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
										<button
											onClick={() => openEditModal(exam)}
											className="p-1.5 rounded bg-dark-600 hover:bg-neon-cyan/20 text-gray-500 hover:text-neon-cyan"
										>
											<Edit2 className="w-4 h-4" />
										</button>
										<button
											onClick={() => handleDeleteRequest(exam.id)}
											className="p-1.5 rounded bg-dark-600 hover:bg-neon-red/20 text-gray-500 hover:text-neon-red"
										>
											<Trash2 className="w-4 h-4" />
										</button>
									</div>

									<div className="flex items-start justify-between pr-20">
										<div className="flex-1">
											<div className="flex items-center gap-3 mb-2">
												{isPassed ? (
													<CheckCircle2 className="w-6 h-6 text-neon-green" />
												) : isOverdue ? (
													<AlertTriangle className="w-6 h-6 text-neon-red animate-pulse" />
												) : hasActiveRule ? (
													<Zap className="w-6 h-6 text-neon-yellow" />
												) : (
													<BookOpen className="w-6 h-6 text-neon-cyan" />
												)}
												<div>
													<h3 className={`text-xl font-semibold ${isPassed ? 'text-neon-green' : 'text-white'
														}`}>
														{exam.name}
													</h3>
													<p className="text-sm text-gray-500">{exam.category}</p>
												</div>
											</div>

											<div className="flex items-center gap-4 mt-3 text-sm flex-wrap">
												<span className="flex items-center gap-1 text-gray-400">
													<Calendar className="w-4 h-4" />
													{examDate ? format(examDate, 'EEEE, MMM d @ HH:mm') : 'Date TBD'}
												</span>
												<span className="px-2 py-1 rounded bg-dark-600 text-gray-300">
													{exam.cfu} CFU
												</span>
												{exam.is_scholarship_critical && (
													<span className="px-2 py-1 rounded bg-neon-purple/10 text-neon-purple border border-neon-purple/30 text-xs">
														SCHOLARSHIP CRITICAL
													</span>
												)}
											</div>

											{/* Strategic Rule Indicator */}
											{isOverdue && !isPassed && (
												<p className="mt-3 text-sm text-neon-red flex items-center gap-1">
													<AlertTriangle className="w-4 h-4" />
													Strategic rule deadline passed - decision required
												</p>
											)}
											{hasActiveRule && !isOverdue && !isPassed && (
												<p className="mt-3 text-sm text-neon-yellow flex items-center gap-1">
													<Zap className="w-4 h-4" />
													Has pending strategic rules
												</p>
											)}
											
											{/* Strategy Notes */}
											{exam.strategy_notes && !isOverdue && !hasActiveRule && (
												<p className="mt-3 text-sm text-gray-400">
													{exam.strategy_notes}
												</p>
											)}
										</div>

										<div className="text-right flex flex-col items-end gap-3 min-w-[120px]">
											{/* Countdown */}
											{!isPassed && daysLeft !== null && daysLeft > 0 && (
												<div className={`text-center ${daysLeft <= 7 ? 'text-neon-red' :
													daysLeft <= 14 ? 'text-neon-yellow' : 'text-gray-400'
													}`}>
													<div className="text-2xl font-bold">{daysLeft}</div>
													<div className="text-xs">days left</div>
												</div>
											)}

											{!examDate && !isPassed && (
												<div className="text-center text-gray-500">
													<Clock className="w-6 h-6 mx-auto" />
													<div className="text-xs mt-1">TBD</div>
												</div>
											)}

											{/* Status selector */}
											{/* Status selector - responsive grid */}
											<div className="status-selector">
												{examStatuses.map(status => (
													<button
														key={status}
														onClick={() => handleStatusChange(exam.id, status)}
														className={`status-btn border transition-all ${exam.status === status
															? getStatusColor(status)
															: 'bg-dark-700 text-gray-500 border-dark-600 hover:border-gray-500'
															}`}
													>
														{status === 'passed' && <CheckCircle2 className="w-3 h-3" />}
														{status === 'booked' && <Clock className="w-3 h-3" />}
														<span className="hidden xs:inline">{getStatusLabel(status)}</span>
														<span className="xs:hidden">{status.slice(0, 4)}</span>
													</button>
												))}
											</div>
										</div>
									</div>
								</div>
							);
						})}
					</div>
				)}
			</div>

			{/* Summary Stats */}
			<div className="grid grid-cols-2 md:grid-cols-5 gap-4">
				{examStatuses.filter(s => s !== 'study_plan').map(status => (
					<div key={status} className="card-cyber p-4 text-center">
						<div className={`text-3xl font-bold ${status === 'passed' ? 'text-neon-green' :
							status === 'booked' ? 'text-neon-cyan' :
								status === 'planned' ? 'text-neon-yellow' :
									status === 'enrolled' ? 'text-neon-purple' :
										'text-neon-red'
							}`}>
							{exams.filter(e => e.status === status).length}
						</div>
						<div className="text-sm text-gray-500 capitalize">{getStatusLabel(status)}</div>
					</div>
				))}
				<div className="card-cyber p-4 text-center">
					<div className="text-3xl font-bold text-white">
						{exams.reduce((sum, e) => sum + (e.status === 'passed' ? e.cfu : 0), 0)}
					</div>
					<div className="text-sm text-gray-500">Total CFU</div>
				</div>
			</div>

			{/* Add/Edit Exam Modal */}
			{isModalOpen && (
				<div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-2 sm:p-4 backdrop-blur-sm">
					<div className="card-cyber p-0 w-full max-w-[calc(100vw-1rem)] sm:max-w-lg max-h-[calc(100vh-1rem)] sm:max-h-[85vh] overflow-hidden flex flex-col">
						{/* Header */}
						<div className="flex items-center justify-between p-4 sm:p-6 pb-4 border-b border-dark-600">
							<h3 className="text-xl font-bold text-white">
								{editingExam ? 'Edit Exam' : 'Add New Exam'}
							</h3>
							<button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-white">
								<X className="w-6 h-6" />
							</button>
						</div>

						{/* Scrollable Content */}
						<div className="flex-1 overflow-y-auto p-4 sm:p-6 pt-4">
							<div className="space-y-4">
								<div>
									<label className="block text-sm text-gray-400 mb-2">Exam Name *</label>
									<input
										type="text"
										value={formData.name}
										onChange={e => setFormData({ ...formData, name: e.target.value })}
										placeholder="e.g., Machine Learning"
										className="w-full px-4 py-2 rounded-lg bg-dark-700 border border-dark-600 text-white placeholder-gray-500 focus:border-neon-cyan focus:outline-none"
									/>
								</div>

								<div className="grid grid-cols-2 gap-4">
									<div>
										<label className="block text-sm text-gray-400 mb-2">CFU</label>
										<input
											type="number"
											min="1"
											max="24"
											value={formData.cfu}
											onChange={e => setFormData({ ...formData, cfu: parseInt(e.target.value) || 1 })}
											className="w-full px-4 py-2 rounded-lg bg-dark-700 border border-dark-600 text-white focus:border-neon-cyan focus:outline-none"
										/>
									</div>
									<div>
										<label className="block text-sm text-gray-400 mb-2">Category</label>
										<select
											value={formData.category}
											onChange={e => setFormData({ ...formData, category: e.target.value })}
											className="w-full px-4 py-2 rounded-lg bg-dark-700 border border-dark-600 text-white focus:border-neon-cyan focus:outline-none"
										>
											{examCategories.map(cat => (
												<option key={cat} value={cat}>{cat}</option>
											))}
										</select>
									</div>
								</div>

								<div>
									<label className="block text-sm text-gray-400 mb-2">Status</label>
									<select
										value={formData.status}
										onChange={e => setFormData({ ...formData, status: e.target.value as Exam['status'] })}
										className="w-full px-4 py-2 rounded-lg bg-dark-700 border border-dark-600 text-white focus:border-neon-cyan focus:outline-none"
									>
										{examStatuses.map(status => (
											<option key={status} value={status}>{getStatusLabel(status)}</option>
										))}
									</select>
								</div>

								<div>
									<label className="block text-sm text-gray-400 mb-2">Exam Date (optional)</label>
									<input
										type="datetime-local"
										value={formData.exam_date}
										onChange={e => setFormData({ ...formData, exam_date: e.target.value })}
										className="w-full px-4 py-2 rounded-lg bg-dark-700 border border-dark-600 text-white focus:border-neon-cyan focus:outline-none"
									/>
									<p className="text-xs text-gray-500 mt-1">Leave empty if date is TBD</p>
								</div>

								<div>
									<label className="block text-sm text-gray-400 mb-2">Strategy Notes</label>
									<textarea
										value={formData.strategy_notes}
										onChange={e => setFormData({ ...formData, strategy_notes: e.target.value })}
										placeholder="e.g., Focus on chapters 1-5, project deadline..."
										rows={2}
										className="w-full px-4 py-2 rounded-lg bg-dark-700 border border-dark-600 text-white placeholder-gray-500 focus:border-neon-cyan focus:outline-none resize-none"
									/>
								</div>

								<div className="flex items-center gap-3">
									<input
										type="checkbox"
										id="scholarship_critical"
										checked={formData.is_scholarship_critical}
										onChange={e => setFormData({ ...formData, is_scholarship_critical: e.target.checked })}
										className="w-4 h-4 rounded bg-dark-700 border-dark-600 text-neon-cyan focus:ring-neon-cyan"
									/>
									<label htmlFor="scholarship_critical" className="text-gray-400 select-none cursor-pointer">
										Scholarship Critical (counts toward 20 CFU goal)
									</label>
								</div>
							</div>
						</div>

						{/* Fixed Footer */}
						<div className="flex gap-3 p-4 sm:p-6 pt-4 border-t border-dark-600 bg-dark-800">
							<button
								onClick={() => setIsModalOpen(false)}
								className="flex-1 px-4 py-2 rounded-lg bg-dark-700 text-gray-400 hover:bg-dark-600"
							>
								Cancel
							</button>
							<button
								onClick={handleSave}
								disabled={isSaving}
								className="flex-1 btn-cyber py-2 flex items-center justify-center gap-2 disabled:opacity-50"
							>
								{isSaving ? (
									<><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
								) : (
									<>{editingExam ? <Save className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
										{editingExam ? 'Save Changes' : 'Add Exam'}</>
								)}
							</button>
						</div>
					</div>
				</div>
			)}

			<ConfirmModal
				isOpen={confirmOpen}
				title="Delete Exam"
				message="Are you sure you want to delete this exam? This action cannot be undone."
				confirmText="Delete"
				isDangerous={true}
				onConfirm={confirmDelete}
				onCancel={() => setConfirmOpen(false)}
			/>
		</div>
	);
}
