import { useState } from 'react';
import { useData } from '../contexts/DataContext';
import {
	GraduationCap,
	Calendar,
	AlertTriangle,
	CheckCircle2,
	Clock,
	Target,
	BookOpen,
	Zap,
	Plus,
	Trash2,
	X,
	Edit2,
	Save
} from 'lucide-react';
import { differenceInDays, format } from 'date-fns';
import { type Exam } from '../lib/seedData';

const examStatuses: Exam['status'][] = ['study_plan', 'enrolled', 'planned', 'booked', 'passed', 'dropped'];
const examCategories = ['Mandatory Core', 'Elective', 'Free Choice', 'Seminar', 'Thesis', 'Other'];

export function Academics() {
	const { exams, updateExamStatus, updateExam, addExam, deleteExam, getPassedCFUs, profile } = useData();
	const now = new Date();
	const passedCFUs = getPassedCFUs();
	const cfuProgress = (passedCFUs / 20) * 100;

	const [isModalOpen, setIsModalOpen] = useState(false);
	const [editingExam, setEditingExam] = useState<Exam | null>(null);
	const [formData, setFormData] = useState({
		name: '',
		cfu: 6,
		status: 'enrolled' as Exam['status'],
		exam_date: '',
		strategy_notes: '',
		is_scholarship_critical: true,
		category: 'Mandatory Core'
	});

	const handleStatusChange = async (examId: string, newStatus: Exam['status']) => {
		await updateExamStatus(examId, newStatus);
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
		} else {
			await addExam(examData);
		}

		setIsModalOpen(false);
		resetForm();
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
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-3xl font-bold text-white flex items-center gap-3">
						<GraduationCap className="w-8 h-8 text-neon-cyan" />
						Academic Radar
					</h1>
					<p className="text-gray-500 mt-1">
						{profile?.name || 'Student'} • Track your academic progress
					</p>
				</div>
				<button
					onClick={openAddModal}
					className="btn-cyber px-4 py-2 flex items-center gap-2"
				>
					<Plus className="w-4 h-4" />
					Add Exam
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
				<div className="flex items-center justify-between mb-6">
					<h2 className="text-lg font-semibold text-white flex items-center gap-2">
						<BookOpen className="w-5 h-5 text-neon-cyan" />
						{dateRange ? `Exams (${dateRange})` : 'All Exams'}
					</h2>
					<div className="flex items-center gap-2 text-sm text-gray-400">
						<Zap className="w-4 h-4" />
						Click status to update
					</div>
				</div>

				{exams.length === 0 ? (
					<div className="text-center py-12">
						<BookOpen className="w-12 h-12 text-gray-600 mx-auto mb-4" />
						<p className="text-gray-500">No exams tracked yet.</p>
						<button
							onClick={openAddModal}
							className="mt-4 btn-cyber px-4 py-2"
						>
							Add Your First Exam
						</button>
					</div>
				) : (
					<div className="space-y-4">
						{exams.map(exam => {
							const examDate = exam.exam_date ? new Date(exam.exam_date) : null;
							const daysLeft = examDate ? differenceInDays(examDate, now) : null;
							const isPassed = exam.status === 'passed';
							const isKillSwitch = exam.strategy_notes.includes('KILL SWITCH');
							const isPast = examDate && examDate < now && !isPassed;

							return (
								<div
									key={exam.id}
									className={`p-4 rounded-lg border transition-all group relative ${isPassed
										? 'bg-neon-green/5 border-neon-green/30'
										: isKillSwitch
											? 'bg-neon-red/5 border-neon-red/30'
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
											onClick={() => deleteExam(exam.id)}
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
												) : isKillSwitch ? (
													<AlertTriangle className="w-6 h-6 text-neon-red animate-pulse" />
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

											<p className={`mt-3 text-sm ${isKillSwitch ? 'text-neon-red' : 'text-gray-400'
												}`}>
												{isKillSwitch && <AlertTriangle className="w-4 h-4 inline mr-1" />}
												{exam.strategy_notes || 'No notes'}
											</p>
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
											<div className="flex flex-wrap gap-2 justify-end max-w-xs mt-auto">
												{examStatuses.map(status => (
													<button
														key={status}
														onClick={() => handleStatusChange(exam.id, status)}
														className={`px-3 py-1.5 rounded text-xs uppercase font-medium border transition-all ${exam.status === status
															? getStatusColor(status)
															: 'bg-dark-700 text-gray-500 border-dark-600 hover:border-gray-500'
															}`}
													>
														{status === 'passed' && <CheckCircle2 className="w-3 h-3 inline mr-1" />}
														{status === 'booked' && <Clock className="w-3 h-3 inline mr-1" />}
														{getStatusLabel(status)}
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
				<div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
					<div className="card-cyber p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in duration-200">
						<div className="flex items-center justify-between mb-6">
							<h3 className="text-xl font-bold text-white">
								{editingExam ? 'Edit Exam' : 'Add New Exam'}
							</h3>
							<button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-white">
								<X className="w-6 h-6" />
							</button>
						</div>

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

						<div className="flex gap-3 mt-6">
							<button
								onClick={() => setIsModalOpen(false)}
								className="flex-1 px-4 py-2 rounded-lg bg-dark-700 text-gray-400 hover:bg-dark-600"
							>
								Cancel
							</button>
							<button
								onClick={handleSave}
								className="flex-1 btn-cyber py-2 flex items-center justify-center gap-2"
							>
								{editingExam ? <Save className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
								{editingExam ? 'Save Changes' : 'Add Exam'}
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
