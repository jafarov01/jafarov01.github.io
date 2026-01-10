import { useData } from '../contexts/DataContext';
import {
	GraduationCap,
	Calendar,
	AlertTriangle,
	CheckCircle2,
	Clock,
	Target,
	BookOpen,
	Zap
} from 'lucide-react';
import { differenceInDays, format } from 'date-fns';
import { type Exam } from '../lib/seedData';

export function Academics() {
	const { exams, updateExamStatus, getPassedCFUs } = useData();
	const now = new Date();
	const passedCFUs = getPassedCFUs();
	const cfuProgress = (passedCFUs / 20) * 100;

	const handleStatusChange = async (examId: string, newStatus: Exam['status']) => {
		await updateExamStatus(examId, newStatus);
	};

	const getStatusColor = (status: Exam['status']) => {
		switch (status) {
			case 'passed': return 'bg-neon-green/20 text-neon-green border-neon-green/30';
			case 'booked': return 'bg-neon-cyan/10 text-neon-cyan border-neon-cyan/30';
			case 'intel': return 'bg-neon-yellow/10 text-neon-yellow border-neon-yellow/30';
			case 'dropped': return 'bg-neon-red/10 text-neon-red border-neon-red/30';
			default: return 'bg-dark-600 text-gray-400 border-dark-500';
		}
	};

	return (
		<div className="p-6 max-w-7xl mx-auto space-y-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-3xl font-bold text-white flex items-center gap-3">
						<GraduationCap className="w-8 h-8 text-neon-cyan" />
						Academic Radar
					</h1>
					<p className="text-gray-500 mt-1">MSc Computer Science • 1st Year • UniPD</p>
				</div>
			</div>

			{/* CFU Progress Banner */}
			<div className="card-cyber p-6">
				<div className="flex items-center justify-between mb-4">
					<div className="flex items-center gap-3">
						<Target className="w-6 h-6 text-neon-green" />
						<div>
							<h2 className="text-lg font-semibold text-white">Scholarship Unlock Progress</h2>
							<p className="text-sm text-gray-500">20 CFUs required to unlock €2,106.39</p>
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
						style={{ width: `${cfuProgress}%` }}
					/>
				</div>
				<div className="flex justify-between mt-2 text-sm">
					<span className="text-gray-500">€2,106.39 LOCKED</span>
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
						Kill List: Jan 23 - Feb 20
					</h2>
					<div className="flex items-center gap-2 text-sm text-gray-400">
						<Zap className="w-4 h-4" />
						Click status to update
					</div>
				</div>

				<div className="space-y-4">
					{exams.map(exam => {
						const examDate = new Date(exam.exam_date);
						const daysLeft = differenceInDays(examDate, now);
						const isPassed = exam.status === 'passed';
						const isKillSwitch = exam.strategy_notes.includes('KILL SWITCH');
						const isPast = examDate < now && !isPassed;

						return (
							<div
								key={exam.id}
								className={`p-4 rounded-lg border transition-all ${isPassed
									? 'bg-neon-green/5 border-neon-green/30'
									: isKillSwitch
										? 'bg-neon-red/5 border-neon-red/30'
										: isPast
											? 'bg-dark-700/50 border-dark-600 opacity-50'
											: 'bg-dark-700 border-dark-600 hover:border-neon-cyan/30'
									}`}
							>
								<div className="flex items-start justify-between">
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

										<div className="flex items-center gap-4 mt-3 text-sm">
											<span className="flex items-center gap-1 text-gray-400">
												<Calendar className="w-4 h-4" />
												{format(examDate, 'EEEE, MMM d @ HH:mm')}
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
											{exam.strategy_notes}
										</p>
									</div>

									<div className="text-right flex flex-col items-end gap-3">
										{/* Countdown */}
										{!isPassed && daysLeft > 0 && (
											<div className={`text-center ${daysLeft <= 7 ? 'text-neon-red' :
												daysLeft <= 14 ? 'text-neon-yellow' : 'text-gray-400'
												}`}>
												<div className="text-2xl font-bold">{daysLeft}</div>
												<div className="text-xs">days left</div>
											</div>
										)}

										{/* Status selector */}
										<div className="flex flex-wrap gap-2 justify-end">
											{(['booked', 'intel', 'passed', 'dropped'] as Exam['status'][]).map(status => (
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
													{status}
												</button>
											))}
										</div>
									</div>
								</div>
							</div>
						);
					})}
				</div>
			</div>

			{/* Summary Stats */}
			<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
				<div className="card-cyber p-4 text-center">
					<div className="text-3xl font-bold text-neon-green">
						{exams.filter(e => e.status === 'passed').length}
					</div>
					<div className="text-sm text-gray-500">Passed</div>
				</div>
				<div className="card-cyber p-4 text-center">
					<div className="text-3xl font-bold text-neon-cyan">
						{exams.filter(e => e.status === 'booked').length}
					</div>
					<div className="text-sm text-gray-500">Booked</div>
				</div>
				<div className="card-cyber p-4 text-center">
					<div className="text-3xl font-bold text-neon-yellow">
						{exams.filter(e => e.status === 'intel').length}
					</div>
					<div className="text-sm text-gray-500">Intel</div>
				</div>
				<div className="card-cyber p-4 text-center">
					<div className="text-3xl font-bold text-white">
						{exams.reduce((sum, e) => sum + (e.status === 'passed' ? e.cfu : 0), 0)}
					</div>
					<div className="text-sm text-gray-500">Total CFU</div>
				</div>
			</div>
		</div>
	);
}
