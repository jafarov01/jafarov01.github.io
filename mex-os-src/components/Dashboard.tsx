import { useData } from '../contexts/DataContext';
import {
	Clock,
	Target,
	Zap,
	AlertTriangle,
	Calendar,
	DollarSign,
	BookOpen,
	Activity,
	Lock,
	Unlock,
	ChevronRight
} from 'lucide-react';
import { differenceInDays, differenceInHours, format } from 'date-fns';
import { Link } from 'react-router-dom';

export function Dashboard() {
	const {
		exams,
		profile,
		getPassedCFUs,
		getUnlockedMoney,
		getLockedMoney,
		getPendingMoney,
		getGlobalStatus,
		habits
	} = useData();

	const now = new Date();
	const nextExam = exams.find(e => new Date(e.exam_date) > now && e.status !== 'passed');
	const passedCFUs = getPassedCFUs();
	const status = getGlobalStatus();

	const daysUntilNextExam = nextExam
		? differenceInDays(new Date(nextExam.exam_date), now)
		: 0;
	const hoursUntilNextExam = nextExam
		? differenceInHours(new Date(nextExam.exam_date), now) % 24
		: 0;

	const cfuProgress = (passedCFUs / 20) * 100;

	const todayHabit = habits.find(h => h.date === format(now, 'yyyy-MM-dd'));

	return (
		<div className="p-6 max-w-7xl mx-auto space-y-6">
			{/* Header with global status */}
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-3xl font-bold text-white flex items-center gap-3">
						<Zap className={`w-8 h-8 ${status === 'green' ? 'text-neon-green' :
							status === 'yellow' ? 'text-neon-yellow' : 'text-neon-red'
							}`} />
						The Winter Campaign
					</h1>
					<p className="text-gray-500 mt-1">Survival Cockpit • {format(now, 'EEEE, MMM d, yyyy')}</p>
				</div>
				<div className={`
          px-4 py-2 rounded-lg border text-sm font-medium
          ${status === 'green' ? 'bg-neon-green/10 border-neon-green/30 text-neon-green' : ''}
          ${status === 'yellow' ? 'bg-neon-yellow/10 border-neon-yellow/30 text-neon-yellow' : ''}
          ${status === 'red' ? 'bg-neon-red/10 border-neon-red/30 text-neon-red animate-pulse' : ''}
        `}>
					{status === 'green' && 'SYSTEMS NOMINAL'}
					{status === 'yellow' && 'CAUTION ADVISED'}
					{status === 'red' && 'CRITICAL ALERT'}
				</div>
			</div>

			{/* Main countdown card */}
			{nextExam && (
				<div className={`card-cyber p-6 ${daysUntilNextExam <= 7 ? 'border-neon-red neon-border-red' :
					daysUntilNextExam <= 14 ? 'border-neon-yellow neon-border-yellow' :
						'border-neon-green neon-border-green'
					}`}>
					<div className="flex items-start justify-between">
						<div>
							<div className="flex items-center gap-2 text-gray-400 text-sm mb-2">
								<Clock className="w-4 h-4" />
								NEXT ENGAGEMENT
							</div>
							<h2 className="text-2xl font-bold text-white">{nextExam.name}</h2>
							<p className="text-gray-500 mt-1">{nextExam.strategy_notes}</p>
							<div className="flex items-center gap-4 mt-4">
								<span className="text-sm text-gray-400">
									<Calendar className="w-4 h-4 inline mr-1" />
									{format(new Date(nextExam.exam_date), 'EEEE, MMM d @ HH:mm')}
								</span>
								<span className="px-2 py-1 rounded text-xs bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/30">
									{nextExam.cfu} CFU
								</span>
								<span className={`px-2 py-1 rounded text-xs uppercase ${nextExam.status === 'booked' ? 'bg-neon-green/10 text-neon-green border border-neon-green/30' :
									'bg-neon-yellow/10 text-neon-yellow border border-neon-yellow/30'
									}`}>
									{nextExam.status}
								</span>
							</div>
						</div>
						<div className="text-right">
							<div className={`text-6xl font-bold ${daysUntilNextExam <= 7 ? 'text-neon-red neon-text-red' :
								daysUntilNextExam <= 14 ? 'text-neon-yellow neon-text-yellow' :
									'text-neon-green neon-text-green'
								}`}>
								{daysUntilNextExam}
							</div>
							<div className="text-gray-400">days</div>
							<div className="text-gray-500 text-sm mt-1">+{hoursUntilNextExam}h</div>
						</div>
					</div>
				</div>
			)}

			{/* Stats grid */}
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
				{/* CFU Progress */}
				<div className="card-cyber p-4">
					<div className="flex items-center justify-between mb-3">
						<div className="flex items-center gap-2 text-gray-400 text-sm">
							<Target className="w-4 h-4" />
							SCHOLARSHIP TARGET
						</div>
						<span className="text-xs text-gray-500">{passedCFUs}/20 CFU</span>
					</div>
					<div className="h-3 bg-dark-700 rounded-full overflow-hidden">
						<div
							className="h-full progress-bar-cyber rounded-full transition-all duration-500"
							style={{ width: `${cfuProgress}%` }}
						/>
					</div>
					<div className="mt-2 text-right">
						<span className={`text-2xl font-bold ${passedCFUs >= 20 ? 'text-neon-green' : 'text-white'
							}`}>
							{passedCFUs >= 20 ? 'UNLOCKED' : `${20 - passedCFUs} CFU needed`}
						</span>
					</div>
				</div>

				{/* Available Cash */}
				<div className="card-cyber p-4">
					<div className="flex items-center gap-2 text-gray-400 text-sm mb-3">
						<Unlock className="w-4 h-4 text-neon-green" />
						AVAILABLE FUNDS
					</div>
					<div className="text-3xl font-bold text-neon-green neon-text-green">
						€{getUnlockedMoney().toLocaleString('it-IT', { minimumFractionDigits: 2 })}
					</div>
					<div className="text-xs text-gray-500 mt-1">Received & Spendable</div>
				</div>

				{/* Locked Cash */}
				<div className="card-cyber p-4">
					<div className="flex items-center gap-2 text-gray-400 text-sm mb-3">
						<Lock className="w-4 h-4 text-neon-red" />
						LOCKED FUNDS
					</div>
					<div className="text-3xl font-bold text-neon-red">
						€{getLockedMoney().toLocaleString('it-IT', { minimumFractionDigits: 2 })}
					</div>
					<div className="text-xs text-gray-500 mt-1">Requires 20 CFUs</div>
				</div>

				{/* Pending Cash */}
				<div className="card-cyber p-4">
					<div className="flex items-center gap-2 text-gray-400 text-sm mb-3">
						<Clock className="w-4 h-4 text-neon-yellow" />
						PENDING FUNDS
					</div>
					<div className="text-3xl font-bold text-neon-yellow">
						€{getPendingMoney().toLocaleString('it-IT', { minimumFractionDigits: 2 })}
					</div>
					<div className="text-xs text-gray-500 mt-1">Awaiting Verification</div>
				</div>
			</div>

			{/* Exam overview and Quick actions */}
			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				{/* Kill List */}
				<div className="lg:col-span-2 card-cyber p-6">
					<div className="flex items-center justify-between mb-4">
						<h3 className="text-lg font-semibold text-white flex items-center gap-2">
							<BookOpen className="w-5 h-5 text-neon-cyan" />
							Kill List (Jan 23 - Feb 20)
						</h3>
						<Link
							to="/academics"
							className="text-sm text-neon-cyan hover:text-neon-green transition-colors flex items-center gap-1"
						>
							View All <ChevronRight className="w-4 h-4" />
						</Link>
					</div>
					<div className="space-y-3">
						{exams.map(exam => {
							const examDate = new Date(exam.exam_date);
							const daysLeft = differenceInDays(examDate, now);
							const isPassed = exam.status === 'passed';
							const isKillSwitch = exam.strategy_notes.includes('KILL SWITCH');

							return (
								<div
									key={exam.id}
									className={`p-3 rounded-lg border transition-all ${isPassed
										? 'bg-neon-green/5 border-neon-green/20'
										: isKillSwitch
											? 'bg-neon-red/5 border-neon-red/30 animate-pulse'
											: 'bg-dark-700 border-dark-600 hover:border-neon-cyan/30'
										}`}
								>
									<div className="flex items-center justify-between">
										<div className="flex items-center gap-3">
											{isKillSwitch && !isPassed && (
												<AlertTriangle className="w-5 h-5 text-neon-red" />
											)}
											<div>
												<span className={`font-medium ${isPassed ? 'text-neon-green line-through' : 'text-white'
													}`}>
													{exam.name}
												</span>
												<span className="text-gray-500 text-sm ml-2">({exam.cfu} CFU)</span>
											</div>
										</div>
										<div className="flex items-center gap-3">
											<span className="text-sm text-gray-400">
												{format(examDate, 'MMM d')}
											</span>
											{!isPassed && daysLeft > 0 && (
												<span className={`text-sm font-medium ${daysLeft <= 7 ? 'text-neon-red' :
													daysLeft <= 14 ? 'text-neon-yellow' : 'text-gray-400'
													}`}>
													{daysLeft}d
												</span>
											)}
											<span className={`px-2 py-1 rounded text-xs uppercase ${isPassed ? 'bg-neon-green/20 text-neon-green' :
												exam.status === 'booked' ? 'bg-neon-cyan/10 text-neon-cyan' :
													'bg-neon-yellow/10 text-neon-yellow'
												}`}>
												{exam.status}
											</span>
										</div>
									</div>
									{isKillSwitch && !isPassed && (
										<div className="mt-2 text-xs text-neon-red flex items-center gap-1">
											<AlertTriangle className="w-3 h-3" />
											{exam.strategy_notes}
										</div>
									)}
								</div>
							);
						})}
					</div>
				</div>

				{/* Quick Actions & Today's Protocol */}
				<div className="space-y-6">
					{/* Quick Actions */}
					<div className="card-cyber p-6">
						<h3 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
							<Zap className="w-5 h-5 text-neon-yellow" />
							Quick Actions
						</h3>
						<div className="space-y-2">
							<Link
								to="/habits"
								className="w-full btn-cyber py-3 flex items-center justify-center gap-2"
							>
								<Activity className="w-4 h-4" />
								Log Today's Habits
							</Link>
							<Link
								to="/academics"
								className="w-full btn-cyber py-3 flex items-center justify-center gap-2"
							>
								<BookOpen className="w-4 h-4" />
								Update Exam Status
							</Link>
							<Link
								to="/finance"
								className="w-full btn-cyber py-3 flex items-center justify-center gap-2"
							>
								<DollarSign className="w-4 h-4" />
								View Finances
							</Link>
						</div>
					</div>

					{/* Today's Protocol Status */}
					<div className="card-cyber p-6">
						<h3 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
							<Activity className="w-5 h-5 text-neon-purple" />
							Today's Protocol
						</h3>
						<div className="space-y-3">
							<div className="flex items-center justify-between">
								<span className="text-gray-400">Deep Work</span>
								<span className={`font-medium ${(todayHabit?.habits.deep_work_hours || 0) >= 4
									? 'text-neon-green' : 'text-gray-500'
									}`}>
									{todayHabit?.habits.deep_work_hours || 0}h / 4h
								</span>
							</div>
							<div className="flex items-center justify-between">
								<span className="text-gray-400">Gym</span>
								<span className={`font-medium ${todayHabit?.habits.gym_session ? 'text-neon-green' : 'text-neon-red'
									}`}>
									{todayHabit?.habits.gym_session ? '✓ DONE' : '✗ PENDING'}
								</span>
							</div>
							<div className="flex items-center justify-between">
								<span className="text-gray-400">Python</span>
								<span className={`font-medium ${todayHabit?.skills.python_practice !== '0 mins'
									? 'text-neon-green' : 'text-gray-500'
									}`}>
									{todayHabit?.skills.python_practice || '0 mins'}
								</span>
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* Visa Warning Banner */}
			{profile?.visa_expiry.includes('WARNING') && (
				<div className="card-cyber p-4 border-neon-red neon-border-red bg-neon-red/5">
					<div className="flex items-center gap-3">
						<AlertTriangle className="w-6 h-6 text-neon-red animate-pulse" />
						<div>
							<h4 className="font-semibold text-neon-red">VISA STATUS: CRITICAL</h4>
							<p className="text-sm text-gray-400">
								Permit expiry data missing. Update your visa status immediately to avoid system lockout.
							</p>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
