import { useMemo, useState, useEffect } from 'react';
import { useData } from '../contexts/DataContext';
import { useToast } from '../contexts/ToastContext';
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
	ArrowRight,
	CheckCircle2,
	Circle
} from 'lucide-react';
import { differenceInDays, differenceInHours, format } from 'date-fns';
import { Link } from 'react-router-dom';
import { StrategyDecisionModal, type TriggeredRule, type RuleAction } from './StrategyDecisionModal';

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
		getActiveCampaign,
		updateHabit,
		// v7.0 Strategy Decision System
		getTriggeredRules,
		executeRuleAction,
		markRuleSafe,
		snoozeRule,
		getExamsWithActiveRules
	} = useData();
	const { showToast } = useToast();

	// Strategy Decision Modal state
	const [showDecisionModal, setShowDecisionModal] = useState(false);
	const triggeredRules = getTriggeredRules();
	const examsWithActiveRules = getExamsWithActiveRules();

	// Auto-show decision modal when there are triggered rules (once per session)
	useEffect(() => {
		const dismissedKey = `strategy_dismissed_${format(new Date(), 'yyyy-MM-dd')}`;
		const wasDismissed = sessionStorage.getItem(dismissedKey);
		
		if (triggeredRules.length > 0 && !wasDismissed) {
			// Small delay to let the page render first
			const timer = setTimeout(() => setShowDecisionModal(true), 500);
			return () => clearTimeout(timer);
		}
	}, [triggeredRules.length]);

	const handleExecuteAction = async (rule: TriggeredRule, action: RuleAction) => {
		try {
			await executeRuleAction(
				rule.campaignId,
				rule.ruleIndex,
				action.examId,
				action.newStatus
			);
			showToast(
				action.type === 'drop_exam' 
					? 'Exam dropped successfully' 
					: action.type === 'change_status'
						? 'Exam status updated'
						: 'Rule marked as triggered',
				'success'
			);
		} catch {
			showToast('Failed to execute action', 'error');
		}
	};

	const handleMarkSafe = async (rule: TriggeredRule) => {
		try {
			await markRuleSafe(rule.campaignId, rule.ruleIndex);
			showToast('Rule marked as safe', 'success');
		} catch {
			showToast('Failed to update rule', 'error');
		}
	};

	const handleSnooze = async (rule: TriggeredRule, days: number) => {
		try {
			await snoozeRule(rule.campaignId, rule.ruleIndex, days);
			showToast(`Deadline extended by ${days} day${days > 1 ? 's' : ''}`, 'success');
		} catch {
			showToast('Failed to snooze rule', 'error');
		}
	};

	const handleDismissModal = () => {
		const dismissedKey = `strategy_dismissed_${format(new Date(), 'yyyy-MM-dd')}`;
		sessionStorage.setItem(dismissedKey, 'true');
		setShowDecisionModal(false);
	};

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
	
	// v7.0: Count rules that need immediate action (deadline passed)
	const urgentRules = triggeredRules.length;

	// Current job
	const currentJob = jobs.find(j => j.is_current);

	// Inline habit/skill handlers
	const handleQuickHabitToggle = async (habitId: string, value: boolean | number) => {
		try {
			await updateHabit(format(now, 'yyyy-MM-dd'), { habits: { [habitId]: value } });
			showToast('Habit logged', 'success');
		} catch {
			showToast('Failed to save', 'error');
		}
	};

	const handleQuickSkillChange = async (skillId: string, value: string) => {
		try {
			await updateHabit(format(now, 'yyyy-MM-dd'), { skills: { [skillId]: value } });
			showToast('Skill logged', 'success');
		} catch {
			showToast('Failed to save', 'error');
		}
	};

	// Filter tracked skills for display and counting
	const trackedSkills = useMemo(() => 
		skillDefinitions.filter(s => s.is_tracked !== false),
		[skillDefinitions]
	);

	const completedCount = useMemo(() => {
		let count = 0;
		habitDefinitions.forEach(def => {
			const val = todayHabit?.habits[def.id];
			if (def.trackingType === 'boolean' ? Boolean(val) : (val as number) >= (def.target || 1)) count++;
		});
		trackedSkills.forEach(def => {
			if ((todayHabit?.skills[def.id] || '0 mins') !== '0 mins') count++;
		});
		return count;
	}, [todayHabit, habitDefinitions, trackedSkills]);

	return (
		<div className="p-6 max-w-7xl mx-auto space-y-6">
			{/* Header with global status */}
			<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
				<div className="min-w-0 flex-1">
					<h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-2 sm:gap-3">
						<Zap className={`w-6 h-6 sm:w-8 sm:h-8 flex-shrink-0 ${status === 'green' ? 'text-neon-green' :
							status === 'yellow' ? 'text-neon-yellow' : 'text-neon-red'
							}`} />
						<span className="truncate">{profile?.name ? `${profile.name}'s Cockpit` : 'Survival Cockpit'}</span>
					</h1>
					<p className="text-gray-400 mt-1 text-sm sm:text-base">{format(now, 'EEEE, MMM d, yyyy')}</p>
				</div>
				<div className={`
          px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg border text-xs sm:text-sm font-medium flex-shrink-0
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
				<div className={`card-cyber p-4 sm:p-6 ${daysUntilNextExam <= 7 ? 'border-neon-red neon-border-red' :
					daysUntilNextExam <= 14 ? 'border-neon-yellow neon-border-yellow' :
						'border-neon-green neon-border-green'
					}`}>
					<div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
						<div className="flex-1 min-w-0">
							<div className="flex items-center gap-2 text-gray-400 text-xs sm:text-sm mb-2">
								<Clock className="w-4 h-4 flex-shrink-0" />
								NEXT ENGAGEMENT
							</div>
							<h2 className="text-xl sm:text-2xl font-bold text-white truncate">{nextExam.name}</h2>
							<p className="text-gray-500 mt-1 text-sm line-clamp-2">{nextExam.strategy_notes}</p>
							<div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-4">
								<span className="text-xs sm:text-sm text-gray-400 flex items-center gap-1">
									<Calendar className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
									<span className="truncate">{nextExam.exam_date ? format(new Date(nextExam.exam_date), 'MMM d @ HH:mm') : 'TBD'}</span>
								</span>
								<span className="px-2 py-0.5 rounded text-xs bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/30">
									{nextExam.cfu} CFU
								</span>
								<span className={`px-2 py-0.5 rounded text-xs uppercase ${nextExam.status === 'booked' ? 'bg-neon-green/10 text-neon-green border border-neon-green/30' :
									'bg-neon-yellow/10 text-neon-yellow border border-neon-yellow/30'
									}`}>
									{nextExam.status}
								</span>
							</div>
						</div>
						<div className="text-left sm:text-right flex sm:flex-col items-baseline sm:items-end gap-2 sm:gap-0">
							<div className={`text-4xl sm:text-6xl font-bold ${daysUntilNextExam <= 7 ? 'text-neon-red neon-text-red' :
								daysUntilNextExam <= 14 ? 'text-neon-yellow neon-text-yellow' :
									'text-neon-green neon-text-green'
								}`}>
								{daysUntilNextExam}
							</div>
							<div className="text-gray-400 text-sm sm:text-base">days <span className="text-gray-500 text-xs sm:text-sm">+{hoursUntilNextExam}h</span></div>
						</div>
					</div>
				</div>
			)}

			{/* URGENT STRATEGIC DECISIONS - Rules with passed deadlines */}
			{urgentRules > 0 && (
				<div className="card-cyber p-4 border-neon-red/50 bg-neon-red/5 animate-pulse">
					<div className="flex items-start gap-3">
						<AlertTriangle className="w-6 h-6 text-neon-red flex-shrink-0 mt-0.5" />
						<div className="flex-1 min-w-0">
							<h4 className="font-semibold text-neon-red">
								{urgentRules} Strategic Decision{urgentRules > 1 ? 's' : ''} OVERDUE
							</h4>
							<p className="text-xs text-gray-500 mb-2">
								Deadline{urgentRules > 1 ? 's' : ''} passed - action required
							</p>
							<div className="space-y-1">
								{triggeredRules.slice(0, 3).map((triggered, idx) => (
									<div key={idx} className="flex items-center gap-2 text-sm">
										<span className="w-1.5 h-1.5 bg-neon-red rounded-full flex-shrink-0 animate-pulse" />
										<span className="text-gray-400 truncate">IF {triggered.rule.condition}</span>
										<ArrowRight className="w-3 h-3 text-gray-600 flex-shrink-0" />
										<span className="text-white truncate">{triggered.rule.action}</span>
										<span className="text-neon-red text-xs">({triggered.daysOverdue}d overdue)</span>
									</div>
								))}
							</div>
						</div>
						<button
							onClick={() => setShowDecisionModal(true)}
							className="btn-cyber px-4 py-2 text-sm flex-shrink-0 bg-neon-red/20 border-neon-red/50 hover:bg-neon-red/30"
						>
							<AlertTriangle className="w-4 h-4 inline mr-1" />
							Decide Now
						</button>
					</div>
				</div>
			)}

			{/* PENDING STRATEGIC DECISIONS - Future deadlines */}
			{pendingRules > 0 && urgentRules === 0 && activeCampaign && (
				<div className="card-cyber p-4 border-neon-yellow/30 bg-neon-yellow/5">
					<div className="flex items-start gap-3">
						<Clock className="w-5 h-5 text-neon-yellow flex-shrink-0 mt-0.5" />
						<div className="flex-1 min-w-0">
							<h4 className="font-semibold text-neon-yellow">{pendingRules} Strategic Rule{pendingRules > 1 ? 's' : ''} Pending</h4>
							<p className="text-xs text-gray-500 mb-2">Campaign: {activeCampaign.name}</p>
							<div className="space-y-1">
								{activeCampaign.rules?.filter(r => r.status === 'pending').slice(0, 3).map((rule, idx) => (
									<div key={idx} className="flex items-center gap-2 text-sm">
										<span className="w-1.5 h-1.5 bg-neon-yellow rounded-full flex-shrink-0" />
										<span className="text-gray-400 truncate">IF {rule.condition}</span>
										<ArrowRight className="w-3 h-3 text-gray-600 flex-shrink-0" />
										<span className="text-white truncate">{rule.action}</span>
										<span className="text-gray-500 text-xs">
											(by {format(new Date(rule.deadline), 'MMM d')})
										</span>
									</div>
								))}
							</div>
						</div>
						<Link to="/strategy" className="btn-cyber px-3 py-1.5 text-sm flex-shrink-0">
							View Rules
						</Link>
					</div>
				</div>
			)}

			{/* Stats grid */}
			<div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
				{/* CFU Progress */}
				<div className="card-cyber p-3 sm:p-4">
					<div className="flex items-center justify-between mb-2 sm:mb-3">
						<div className="flex items-center gap-1 sm:gap-2 text-gray-400 text-xs sm:text-sm">
							<Target className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
							<span className="hidden sm:inline">SCHOLARSHIP TARGET</span>
							<span className="sm:hidden">TARGET</span>
						</div>
						<span className="text-xs text-gray-500">{passedCFUs}/20</span>
					</div>
					<div className="h-2 sm:h-3 bg-dark-700 rounded-full overflow-hidden">
						<div
							className="h-full progress-bar-cyber rounded-full transition-all duration-500"
							style={{ width: `${cfuProgress}%` }}
						/>
					</div>
					<div className="mt-2 text-right">
						<span className={`text-sm sm:text-lg font-bold ${passedCFUs >= 20 ? 'text-neon-green' : 'text-white'
							}`}>
							{passedCFUs >= 20 ? 'UNLOCKED' : `${20 - passedCFUs} needed`}
						</span>
					</div>
				</div>

				{/* Available Cash */}
				<div className="card-cyber p-3 sm:p-4">
					<div className="flex items-center gap-1 sm:gap-2 text-gray-400 text-xs sm:text-sm mb-2 sm:mb-3">
						<Unlock className="w-3 h-3 sm:w-4 sm:h-4 text-neon-green flex-shrink-0" />
						<span className="hidden sm:inline">AVAILABLE FUNDS</span>
						<span className="sm:hidden">AVAILABLE</span>
					</div>
					<div className="text-xl sm:text-2xl lg:text-3xl font-bold text-neon-green neon-text-green truncate">
						€{getUnlockedMoney().toLocaleString('it-IT', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
					</div>
					<div className="text-xs text-gray-500 mt-1 hidden sm:block">Received & Spendable</div>
				</div>

				{/* Locked Cash */}
				<div className="card-cyber p-3 sm:p-4">
					<div className="flex items-center gap-1 sm:gap-2 text-gray-400 text-xs sm:text-sm mb-2 sm:mb-3">
						<Lock className="w-3 h-3 sm:w-4 sm:h-4 text-neon-red flex-shrink-0" />
						<span className="hidden sm:inline">LOCKED FUNDS</span>
						<span className="sm:hidden">LOCKED</span>
					</div>
					<div className="text-xl sm:text-2xl lg:text-3xl font-bold text-neon-red truncate">
						€{getLockedMoney().toLocaleString('it-IT', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
					</div>
					<div className="text-xs text-gray-500 mt-1 hidden sm:block">Requires 20 CFUs</div>
				</div>

				{/* Pending Cash */}
				<div className="card-cyber p-3 sm:p-4">
					<div className="flex items-center gap-1 sm:gap-2 text-gray-400 text-xs sm:text-sm mb-2 sm:mb-3">
						<Clock className="w-3 h-3 sm:w-4 sm:h-4 text-neon-yellow flex-shrink-0" />
						<span className="hidden sm:inline">PENDING FUNDS</span>
						<span className="sm:hidden">PENDING</span>
					</div>
					<div className="text-xl sm:text-2xl lg:text-3xl font-bold text-neon-yellow truncate">
						€{getPendingMoney().toLocaleString('it-IT', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
					</div>
					<div className="text-xs text-gray-500 mt-1 hidden sm:block">Awaiting Verification</div>
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
								// v7.0: Use rule-based detection instead of text matching
								const hasActiveRule = examsWithActiveRules.some(e => e.id === exam.id);
								const isOverdue = triggeredRules.some(tr => tr.linkedExams.some(e => e.id === exam.id));

								return (
									<div
										key={exam.id}
										className={`p-3 rounded-lg border transition-all ${isPassed
											? 'bg-neon-green/5 border-neon-green/20'
											: isOverdue
												? 'bg-neon-red/5 border-neon-red/30'
												: hasActiveRule
													? 'bg-neon-yellow/5 border-neon-yellow/30'
													: 'bg-dark-700 border-dark-600 hover:border-neon-cyan/30'
											}`}
									>
										<div className="flex items-center justify-between">
											<div className="flex items-center gap-3">
												{isOverdue && !isPassed && (
													<AlertTriangle className="w-5 h-5 text-neon-red animate-pulse" />
												)}
												{hasActiveRule && !isOverdue && !isPassed && (
													<Clock className="w-5 h-5 text-neon-yellow" />
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
										{isOverdue && !isPassed && (
											<div className="mt-2 text-xs text-neon-red flex items-center gap-1">
												<AlertTriangle className="w-3 h-3" />
												Strategic rule deadline passed - decision required
											</div>
										)}
										{hasActiveRule && !isOverdue && !isPassed && (
											<div className="mt-2 text-xs text-neon-yellow flex items-center gap-1">
												<Clock className="w-3 h-3" />
												Has pending strategic rules
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

					{/* Today's Protocol - ACTIONABLE */}
					<div className="card-cyber p-6">
						<div className="flex items-center justify-between mb-4">
							<h3 className="text-lg font-semibold text-white flex items-center gap-2">
								<Activity className="w-5 h-5 text-neon-purple" />
								Today's Protocol
							</h3>
							<Link to="/habits" className="text-xs text-neon-cyan hover:text-neon-green flex items-center gap-1">
								View All <ChevronRight className="w-3 h-3" />
							</Link>
						</div>

						<div className="space-y-3">
							{/* Habits - Inline toggles */}
							{habitDefinitions.map(def => {
								const value = todayHabit?.habits[def.id];
								const isComplete = def.trackingType === 'boolean'
									? Boolean(value)
									: typeof value === 'number' && value >= (def.target || 1);

								return (
									<div key={def.id} className={`flex items-center justify-between p-2 rounded transition-colors ${isComplete ? 'bg-neon-green/5' : ''}`}>
										<span className={`text-sm ${isComplete ? 'text-neon-green' : 'text-gray-400'}`}>{def.name}</span>
										{def.trackingType === 'boolean' ? (
											<button
												onClick={() => handleQuickHabitToggle(def.id, !value)}
												className={`w-8 h-8 rounded flex items-center justify-center transition-colors ${
													value ? 'bg-neon-green/20 text-neon-green' : 'bg-dark-600 text-gray-500 hover:bg-dark-500'
												}`}
											>
												{value ? <CheckCircle2 className="w-4 h-4" /> : <Circle className="w-4 h-4" />}
											</button>
										) : (
											<div className="flex gap-1">
												{Array.from({ length: (def.maxValue || 3) + 1 }, (_, i) => i).map(v => (
													<button
														key={v}
														onClick={() => handleQuickHabitToggle(def.id, v)}
														className={`px-2 py-1 text-xs rounded transition-colors ${
															value === v ? 'bg-neon-green/20 text-neon-green' : 'bg-dark-600 text-gray-500 hover:bg-dark-500'
														}`}
													>
														{v}{def.trackingType === 'hours' ? 'h' : ''}
													</button>
												))}
											</div>
										)}
									</div>
								);
							})}

							{/* Skills - Time selection (only tracked skills) */}
							{trackedSkills.map(def => {
								const value = todayHabit?.skills[def.id] || '0 mins';
								const isComplete = value !== '0 mins';
								const options = def.trackingOptions || ['0 mins', '15 mins', '30 mins', '60 mins'];

								return (
									<div key={def.id} className={`flex items-center justify-between p-2 rounded transition-colors ${isComplete ? 'bg-neon-cyan/5' : ''}`}>
										<span className={`text-sm ${isComplete ? 'text-neon-cyan' : 'text-gray-400'}`}>{def.name}</span>
										<div className="flex gap-1">
											{options.slice(0, 5).map(opt => (
												<button
													key={opt}
													onClick={() => handleQuickSkillChange(def.id, opt)}
													className={`px-2 py-1 text-xs rounded transition-colors ${
														value === opt ? 'bg-neon-cyan/20 text-neon-cyan' : 'bg-dark-600 text-gray-500 hover:bg-dark-500'
													}`}
												>
													{opt.replace(' mins', 'm').replace(' min', 'm')}
												</button>
											))}
										</div>
									</div>
								);
							})}

							{habitDefinitions.length === 0 && trackedSkills.length === 0 && (
								<p className="text-gray-500 text-sm text-center py-2">
									No habits or skills being tracked.
									<Link to="/habits" className="text-neon-cyan ml-1 hover:underline">Add some!</Link>
								</p>
							)}
						</div>

						{/* Progress indicator */}
						{(habitDefinitions.length > 0 || trackedSkills.length > 0) && (
							<div className="mt-4 pt-3 border-t border-dark-600 text-xs text-gray-500">
								✓ {completedCount}/{habitDefinitions.length + trackedSkills.length} logged today
							</div>
						)}
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

			{/* Strategy Decision Modal */}
			<StrategyDecisionModal
				isOpen={showDecisionModal}
				triggeredRules={triggeredRules}
				onExecuteAction={handleExecuteAction}
				onMarkSafe={handleMarkSafe}
				onSnooze={handleSnooze}
				onDismiss={handleDismissModal}
			/>
		</div>
	);
}
