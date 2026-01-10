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
	ChevronRight,
	FileText,
	Briefcase,
	Flag,
	ArrowRight
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
		habits,
		skillDefinitions,
		habitDefinitions,
		bureaucracy,
		// v5.0 additions
		jobs,
		getActiveCampaign
	} = useData();

	const now = new Date();
	const nextExam = exams.find(e => e.exam_date && new Date(e.exam_date) > now && e.status !== 'passed');
	const passedCFUs = getPassedCFUs();
	const status = getGlobalStatus();

	const daysUntilNextExam = nextExam?.exam_date
		? differenceInDays(new Date(nextExam.exam_date), now)
		: null;
	const hoursUntilNextExam = nextExam?.exam_date
		? differenceInHours(new Date(nextExam.exam_date), now) % 24
		: 0;

	const cfuProgress = (passedCFUs / 20) * 100;

	const todayHabit = habits.find(h => h.date === format(now, 'yyyy-MM-dd'));

	// Get exam date range dynamically
	const upcomingExams = exams.filter(e => e.exam_date && new Date(e.exam_date) > now && e.status !== 'passed');
	const examDateRange = upcomingExams.length > 0
		? `${format(new Date(upcomingExams[0].exam_date!), 'MMM d')} - ${format(new Date(upcomingExams[upcomingExams.length - 1].exam_date!), 'MMM d')}`
		: 'No upcoming exams';

	// Check for critical items
	const criticalBureaucracy = bureaucracy.filter(b => b.is_critical && (b.status === 'unknown' || b.status === 'expired'));

	// v5.0: Active Campaign
	const activeCampaign = getActiveCampaign();
	const campaignDaysRemaining = activeCampaign
		? differenceInDays(new Date(activeCampaign.endDate), now)
		: null;
	const pendingRules = activeCampaign?.rules?.filter(r => r.status === 'pending').length || 0;

	// Current job
	const currentJob = jobs.find(j => j.is_current);


	return (
		<div className="p-6 max-w-7xl mx-auto space-y-6">
			{/* Header with global status */}
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-3xl font-bold text-white flex items-center gap-3">
						<Zap className={`w-8 h-8 ${status === 'green' ? 'text-neon-green' :
							status === 'yellow' ? 'text-neon-yellow' : 'text-neon-red'
							}`} />
						{profile?.name ? `${profile.name}'s Cockpit` : 'Survival Cockpit'}
					</h1>
					<p className="text-gray-500 mt-1">{format(now, 'EEEE, MMM d, yyyy')}</p>
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
			{nextExam && daysUntilNextExam !== null && (
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
									{nextExam.exam_date ? format(new Date(nextExam.exam_date), 'EEEE, MMM d @ HH:mm') : 'Date TBD'}
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

			{/* v5.0: Active Campaign Widget + Career Status */}
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				{/* Active Campaign Card */}
				{activeCampaign ? (
					<div className="card-cyber p-5 border-neon-green/30 hover:neon-border-green transition-all">
						<div className="flex items-center justify-between mb-3">
							<div className="flex items-center gap-2 text-neon-green text-sm">
								<Flag className="w-4 h-4" />
								ACTIVE CAMPAIGN
							</div>
							<Link
								to="/strategy"
								className="text-xs text-gray-400 hover:text-neon-green transition-colors flex items-center gap-1"
							>
								Manage <ChevronRight className="w-3 h-3" />
							</Link>
						</div>
						<h3 className="text-xl font-bold text-white mb-2">{activeCampaign.name}</h3>
						<div className="flex items-center gap-4 text-sm text-gray-400 mb-3">
							<span className="flex items-center gap-1">
								<Calendar className="w-4 h-4" />
								{format(new Date(activeCampaign.startDate), 'MMM d')} — {format(new Date(activeCampaign.endDate), 'MMM d')}
							</span>
							<span className={`flex items-center gap-1 ${campaignDaysRemaining && campaignDaysRemaining <= 7 ? 'text-neon-red' : ''}`}>
								<Clock className="w-4 h-4" />
								{campaignDaysRemaining}d remaining
							</span>
						</div>

						{/* Progress bar */}
						<div className="h-1.5 bg-dark-700 rounded-full overflow-hidden mb-3">
							<div
								className="h-full bg-neon-green rounded-full transition-all duration-500"
								style={{
									width: `${Math.min(100, Math.max(0,
										((differenceInDays(now, new Date(activeCampaign.startDate))) /
										(differenceInDays(new Date(activeCampaign.endDate), new Date(activeCampaign.startDate)))) * 100
									))}%`
								}}
							/>
						</div>

						{/* Quick Stats */}
						<div className="flex items-center gap-4 text-sm">
							<span className="text-neon-cyan">
								<BookOpen className="w-4 h-4 inline mr-1" />
								{activeCampaign.linked_exams?.length || 0} exams
							</span>
							{pendingRules > 0 && (
								<span className="text-neon-yellow flex items-center gap-1">
									<AlertTriangle className="w-4 h-4" />
									{pendingRules} pending decision{pendingRules > 1 ? 's' : ''}
								</span>
							)}
						</div>

						{/* Pending Rules Preview */}
						{activeCampaign.rules && activeCampaign.rules.filter(r => r.status === 'pending').slice(0, 2).map((rule, idx) => (
							<div key={idx} className="mt-2 p-2 bg-dark-700 rounded text-sm flex items-center gap-2">
								<span className="w-2 h-2 bg-neon-yellow rounded-full animate-pulse" />
								<span className="text-gray-400 truncate">{rule.condition}</span>
								<ArrowRight className="w-3 h-3 text-gray-600 flex-shrink-0" />
								<span className="text-white truncate">{rule.action}</span>
							</div>
						))}
					</div>
				) : (
					<div className="card-cyber p-5 border-dashed border-dark-500">
						<div className="flex items-center gap-2 text-gray-500 text-sm mb-3">
							<Flag className="w-4 h-4" />
							NO ACTIVE CAMPAIGN
						</div>
						<p className="text-gray-500 text-sm mb-3">
							Create a strategic campaign to track your goals and deadlines.
						</p>
						<Link to="/strategy" className="btn-cyber px-4 py-2 text-sm inline-flex items-center gap-2">
							<Target className="w-4 h-4" />
							Create Campaign
						</Link>
					</div>
				)}

				{/* Current Position Card */}
				{currentJob ? (
					<div className="card-cyber p-5 border-neon-purple/30 hover:border-neon-purple/50 transition-all">
						<div className="flex items-center justify-between mb-3">
							<div className="flex items-center gap-2 text-neon-purple text-sm">
								<Briefcase className="w-4 h-4" />
								CURRENT POSITION
							</div>
							<Link
								to="/career"
								className="text-xs text-gray-400 hover:text-neon-purple transition-colors flex items-center gap-1"
							>
								Career Hub <ChevronRight className="w-3 h-3" />
							</Link>
						</div>
						<h3 className="text-xl font-bold text-white">{currentJob.role}</h3>
						<p className="text-gray-400 mb-2">{currentJob.company} • {currentJob.location}</p>
						<div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
							<Calendar className="w-4 h-4" />
							Since {format(new Date(currentJob.startDate), 'MMM yyyy')}
						</div>

						{/* Tech Stack Preview */}
						<div className="flex flex-wrap gap-1.5">
							{currentJob.tech_stack.slice(0, 5).map(tech => (
								<span key={tech} className="px-2 py-0.5 bg-dark-600 text-neon-cyan text-xs rounded">
									{tech}
								</span>
							))}
							{currentJob.tech_stack.length > 5 && (
								<span className="px-2 py-0.5 bg-dark-600 text-gray-500 text-xs rounded">
									+{currentJob.tech_stack.length - 5} more
								</span>
							)}
						</div>
					</div>
				) : (
					<div className="card-cyber p-5 border-dashed border-dark-500">
						<div className="flex items-center gap-2 text-gray-500 text-sm mb-3">
							<Briefcase className="w-4 h-4" />
							NO CURRENT POSITION
						</div>
						<p className="text-gray-500 text-sm mb-3">
							Track your career history and professional timeline.
						</p>
						<Link to="/career" className="btn-cyber px-4 py-2 text-sm inline-flex items-center gap-2">
							<Briefcase className="w-4 h-4" />
							Add Position
						</Link>
					</div>
				)}
			</div>

			{/* Exam overview and Quick actions */}
			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				{/* Kill List */}
				<div className="lg:col-span-2 card-cyber p-6">
					<div className="flex items-center justify-between mb-4">
						<h3 className="text-lg font-semibold text-white flex items-center gap-2">
							<BookOpen className="w-5 h-5 text-neon-cyan" />
							Upcoming Exams {upcomingExams.length > 0 && `(${examDateRange})`}
						</h3>
						<Link
							to="/academics"
							className="text-sm text-neon-cyan hover:text-neon-green transition-colors flex items-center gap-1"
						>
							View All <ChevronRight className="w-4 h-4" />
						</Link>
					</div>

					{exams.length === 0 ? (
						<p className="text-gray-500 text-center py-8">No exams tracked yet. Add exams in the Academics section.</p>
					) : (
						<div className="space-y-3">
							{exams.slice(0, 5).map(exam => {
								const examDate = exam.exam_date ? new Date(exam.exam_date) : null;
								const daysLeft = examDate ? differenceInDays(examDate, now) : null;
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
													{examDate ? format(examDate, 'MMM d') : 'TBD'}
												</span>
												{!isPassed && daysLeft !== null && daysLeft > 0 && (
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
					)}
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
								to="/cashflow"
								className="w-full btn-cyber py-3 flex items-center justify-center gap-2"
							>
								<DollarSign className="w-4 h-4" />
								Add Transaction
							</Link>
						</div>
					</div>

					{/* Today's Protocol Status - Dynamic */}
					<div className="card-cyber p-6">
						<h3 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
							<Activity className="w-5 h-5 text-neon-purple" />
							Today's Protocol
						</h3>
						<div className="space-y-3">
							{/* Dynamic Habits */}
							{habitDefinitions.slice(0, 2).map(def => {
								const value = todayHabit?.habits[def.id];
								const isComplete = def.trackingType === 'boolean'
									? Boolean(value)
									: typeof value === 'number' && value >= (def.target || 1);

								return (
									<div key={def.id} className="flex items-center justify-between">
										<span className="text-gray-400">{def.name}</span>
										<span className={`font-medium ${isComplete ? 'text-neon-green' : 'text-gray-500'}`}>
											{def.trackingType === 'boolean'
												? (value ? '✓ DONE' : '✗ PENDING')
												: `${value || 0}${def.trackingType === 'hours' ? 'h' : ''} / ${def.target || 1}${def.trackingType === 'hours' ? 'h' : ''}`
											}
										</span>
									</div>
								);
							})}

							{/* Dynamic Skills */}
							{skillDefinitions.slice(0, 2).map(def => {
								const value = todayHabit?.skills[def.id] || '0 mins';
								const isComplete = value !== '0 mins';

								return (
									<div key={def.id} className="flex items-center justify-between">
										<span className="text-gray-400">{def.name}</span>
										<span className={`font-medium ${isComplete ? 'text-neon-green' : 'text-gray-500'}`}>
											{value}
										</span>
									</div>
								);
							})}

							{habitDefinitions.length === 0 && skillDefinitions.length === 0 && (
								<p className="text-gray-500 text-sm text-center py-2">
									No habits or skills defined yet.
									<Link to="/habits" className="text-neon-cyan ml-1 hover:underline">Add some!</Link>
								</p>
							)}
						</div>
					</div>
				</div>
			</div>

			{/* Critical Alerts Banner */}
			{criticalBureaucracy.length > 0 && (
				<div className="card-cyber p-4 border-neon-red neon-border-red bg-neon-red/5">
					<div className="flex items-center gap-3">
						<AlertTriangle className="w-6 h-6 text-neon-red animate-pulse" />
						<div className="flex-1">
							<h4 className="font-semibold text-neon-red">CRITICAL: {criticalBureaucracy.length} Document(s) Need Attention</h4>
							<p className="text-sm text-gray-400">
								{criticalBureaucracy.map(b => b.name).join(', ')}
							</p>
						</div>
						<Link to="/bureaucracy" className="btn-cyber px-4 py-2 text-sm">
							<FileText className="w-4 h-4 inline mr-1" />
							Review
						</Link>
					</div>
				</div>
			)}
		</div>
	);
}
