import { useState } from 'react';
import {
	AlertTriangle,
	X,
	Check,
	Clock,
	Calendar,
	BookOpen,
	Zap,
	ArrowRight,
	Shield,
	ChevronDown,
	ChevronUp
} from 'lucide-react';
import { format } from 'date-fns';
import { type CampaignRule, type Exam } from '../lib/seedData';

export interface TriggeredRule {
	campaignId: string;
	campaignName: string;
	ruleIndex: number;
	rule: CampaignRule;
	linkedExams: Exam[];
	daysOverdue: number;
}

export type RuleActionType = 'drop_exam' | 'change_status' | 'manual' | 'dismiss';

export interface RuleAction {
	type: RuleActionType;
	examId?: string;
	newStatus?: Exam['status'];
	description: string;
}

interface StrategyDecisionModalProps {
	isOpen: boolean;
	triggeredRules: TriggeredRule[];
	onExecuteAction: (rule: TriggeredRule, action: RuleAction) => Promise<void>;
	onMarkSafe: (rule: TriggeredRule) => Promise<void>;
	onSnooze: (rule: TriggeredRule, days: number) => Promise<void>;
	onDismiss: () => void;
}

export function StrategyDecisionModal({
	isOpen,
	triggeredRules,
	onExecuteAction,
	onMarkSafe,
	onSnooze,
	onDismiss
}: StrategyDecisionModalProps) {
	const [currentRuleIndex, setCurrentRuleIndex] = useState(0);
	const [isExecuting, setIsExecuting] = useState(false);
	const [showAdvanced, setShowAdvanced] = useState(false);
	const [selectedAction, setSelectedAction] = useState<RuleAction | null>(null);

	if (!isOpen || triggeredRules.length === 0) return null;

	const currentRule = triggeredRules[currentRuleIndex];
	const isLast = currentRuleIndex === triggeredRules.length - 1;

	// Parse the action text to suggest automatic actions
	const parseActionSuggestions = (rule: TriggeredRule): RuleAction[] => {
		const actionText = rule.rule.action.toLowerCase();
		const suggestions: RuleAction[] = [];

		// Check for DROP actions
		if (actionText.includes('drop')) {
			rule.linkedExams.forEach(exam => {
				if (exam.status !== 'dropped' && exam.status !== 'passed') {
					suggestions.push({
						type: 'drop_exam',
						examId: exam.id,
						newStatus: 'dropped',
						description: `Drop "${exam.name}" (change status to dropped)`
					});
				}
			});
		}

		// Check for status change actions
		if (actionText.includes('book') || actionText.includes('enroll')) {
			const targetStatus: Exam['status'] = actionText.includes('book') ? 'booked' : 'enrolled';
			rule.linkedExams.forEach(exam => {
				if (exam.status !== targetStatus && exam.status !== 'passed') {
					suggestions.push({
						type: 'change_status',
						examId: exam.id,
						newStatus: targetStatus,
						description: `Change "${exam.name}" status to ${targetStatus}`
					});
				}
			});
		}

		// Always add manual option
		suggestions.push({
			type: 'manual',
			description: 'I\'ll handle this manually (mark as triggered)'
		});

		return suggestions;
	};

	const suggestions = parseActionSuggestions(currentRule);

	const handleExecute = async () => {
		if (!selectedAction) return;
		setIsExecuting(true);
		try {
			await onExecuteAction(currentRule, selectedAction);
			if (!isLast) {
				setCurrentRuleIndex(prev => prev + 1);
				setSelectedAction(null);
			} else {
				onDismiss();
			}
		} finally {
			setIsExecuting(false);
		}
	};

	const handleMarkSafe = async () => {
		setIsExecuting(true);
		try {
			await onMarkSafe(currentRule);
			if (!isLast) {
				setCurrentRuleIndex(prev => prev + 1);
				setSelectedAction(null);
			} else {
				onDismiss();
			}
		} finally {
			setIsExecuting(false);
		}
	};

	const handleSnooze = async (days: number) => {
		setIsExecuting(true);
		try {
			await onSnooze(currentRule, days);
			if (!isLast) {
				setCurrentRuleIndex(prev => prev + 1);
				setSelectedAction(null);
			} else {
				onDismiss();
			}
		} finally {
			setIsExecuting(false);
		}
	};

	return (
		<div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
			<div className="card-cyber p-0 w-full max-w-2xl max-h-[90vh] overflow-hidden border-neon-red/50">
				{/* Header */}
				<div className="bg-neon-red/10 border-b border-neon-red/30 p-4">
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-3">
							<div className="w-10 h-10 rounded-full bg-neon-red/20 flex items-center justify-center">
								<AlertTriangle className="w-5 h-5 text-neon-red animate-pulse" />
							</div>
							<div>
								<h2 className="text-lg font-bold text-neon-red">STRATEGIC DECISION REQUIRED</h2>
								<p className="text-sm text-gray-400">
									{triggeredRules.length} rule{triggeredRules.length > 1 ? 's' : ''} triggered • 
									Reviewing {currentRuleIndex + 1} of {triggeredRules.length}
								</p>
							</div>
						</div>
						<button
							onClick={onDismiss}
							className="p-2 text-gray-400 hover:text-white transition-colors"
						>
							<X className="w-5 h-5" />
						</button>
					</div>
				</div>

				{/* Content */}
				<div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
					{/* Campaign Info */}
					<div className="mb-4 text-sm text-gray-400 flex items-center gap-2">
						<Zap className="w-4 h-4 text-neon-green" />
						Campaign: <span className="text-white font-medium">{currentRule.campaignName}</span>
					</div>

					{/* Rule Card */}
					<div className="bg-dark-700 border border-neon-red/30 rounded-lg p-4 mb-6">
						<div className="flex items-start gap-3">
							<div className="w-8 h-8 rounded-full bg-neon-red/20 flex items-center justify-center flex-shrink-0 mt-1">
								<Clock className="w-4 h-4 text-neon-red" />
							</div>
							<div className="flex-1">
								<div className="text-sm text-gray-400 mb-1">DEADLINE PASSED</div>
								<div className="flex items-center gap-2 text-neon-red mb-2">
									<Calendar className="w-4 h-4" />
									<span className="font-medium">
										{format(new Date(currentRule.rule.deadline), 'EEEE, MMMM d, yyyy')}
									</span>
									<span className="px-2 py-0.5 bg-neon-red/20 rounded text-xs">
										{currentRule.daysOverdue} day{currentRule.daysOverdue !== 1 ? 's' : ''} overdue
									</span>
								</div>

								{/* Rule Condition & Action */}
								<div className="space-y-2 mt-4">
									<div className="flex items-center gap-2">
										<span className="px-2 py-1 bg-neon-yellow/10 text-neon-yellow text-xs font-medium rounded">
											IF
										</span>
										<span className="text-white">{currentRule.rule.condition}</span>
									</div>
									<div className="flex items-center gap-2">
										<ArrowRight className="w-4 h-4 text-gray-600" />
									</div>
									<div className="flex items-center gap-2">
										<span className="px-2 py-1 bg-neon-red/10 text-neon-red text-xs font-medium rounded">
											THEN
										</span>
										<span className="text-white font-semibold">{currentRule.rule.action}</span>
									</div>
								</div>
							</div>
						</div>
					</div>

					{/* Linked Exams */}
					{currentRule.linkedExams.length > 0 && (
						<div className="mb-6">
							<h4 className="text-sm font-medium text-gray-400 mb-2 flex items-center gap-2">
								<BookOpen className="w-4 h-4 text-neon-cyan" />
								Linked Exams
							</h4>
							<div className="space-y-2">
								{currentRule.linkedExams.map(exam => (
									<div
										key={exam.id}
										className="flex items-center justify-between p-3 bg-dark-700 rounded-lg border border-dark-600"
									>
										<div className="flex items-center gap-3">
											<BookOpen className="w-4 h-4 text-neon-cyan" />
											<div>
												<span className="text-white font-medium">{exam.name}</span>
												<span className="text-gray-500 text-sm ml-2">({exam.cfu} CFU)</span>
											</div>
										</div>
										<span className={`px-2 py-1 rounded text-xs uppercase ${
											exam.status === 'passed' ? 'bg-neon-green/10 text-neon-green border border-neon-green/30' :
											exam.status === 'dropped' ? 'bg-neon-red/10 text-neon-red border border-neon-red/30' :
											exam.status === 'booked' ? 'bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/30' :
											'bg-neon-yellow/10 text-neon-yellow border border-neon-yellow/30'
										}`}>
											{exam.status}
										</span>
									</div>
								))}
							</div>
						</div>
					)}

					{/* Action Selection */}
					<div className="mb-6">
						<h4 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
							<Zap className="w-4 h-4 text-neon-yellow" />
							What do you want to do?
						</h4>
						<div className="space-y-2">
							{suggestions.map((suggestion, idx) => (
								<button
									key={idx}
									onClick={() => setSelectedAction(suggestion)}
									className={`w-full text-left p-3 rounded-lg border transition-all ${
										selectedAction === suggestion
											? 'border-neon-yellow bg-neon-yellow/10 text-white'
											: 'border-dark-600 bg-dark-700 text-gray-300 hover:border-dark-500'
									}`}
								>
									<div className="flex items-center gap-3">
										{suggestion.type === 'drop_exam' && (
											<div className="w-8 h-8 rounded-full bg-neon-red/20 flex items-center justify-center">
												<AlertTriangle className="w-4 h-4 text-neon-red" />
											</div>
										)}
										{suggestion.type === 'change_status' && (
											<div className="w-8 h-8 rounded-full bg-neon-cyan/20 flex items-center justify-center">
												<ArrowRight className="w-4 h-4 text-neon-cyan" />
											</div>
										)}
										{suggestion.type === 'manual' && (
											<div className="w-8 h-8 rounded-full bg-neon-purple/20 flex items-center justify-center">
												<Shield className="w-4 h-4 text-neon-purple" />
											</div>
										)}
										<span>{suggestion.description}</span>
									</div>
								</button>
							))}
						</div>
					</div>

					{/* Advanced Options */}
					<div className="border-t border-dark-600 pt-4">
						<button
							onClick={() => setShowAdvanced(!showAdvanced)}
							className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
						>
							{showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
							Other Options
						</button>
						
						{showAdvanced && (
							<div className="mt-3 space-y-2">
								<button
									onClick={handleMarkSafe}
									disabled={isExecuting}
									className="w-full flex items-center gap-3 p-3 rounded-lg border border-neon-green/30 bg-neon-green/5 text-neon-green hover:bg-neon-green/10 transition-colors disabled:opacity-50"
								>
									<Check className="w-5 h-5" />
									<div className="text-left">
										<div className="font-medium">Mark as Safe</div>
										<div className="text-xs text-gray-400">Condition was met - no action needed</div>
									</div>
								</button>

								<div className="flex gap-2">
									<button
										onClick={() => handleSnooze(1)}
										disabled={isExecuting}
										className="flex-1 p-2 rounded-lg border border-dark-600 bg-dark-700 text-gray-400 hover:text-white hover:border-dark-500 transition-colors disabled:opacity-50 text-sm"
									>
										Snooze 1 day
									</button>
									<button
										onClick={() => handleSnooze(3)}
										disabled={isExecuting}
										className="flex-1 p-2 rounded-lg border border-dark-600 bg-dark-700 text-gray-400 hover:text-white hover:border-dark-500 transition-colors disabled:opacity-50 text-sm"
									>
										Snooze 3 days
									</button>
									<button
										onClick={() => handleSnooze(7)}
										disabled={isExecuting}
										className="flex-1 p-2 rounded-lg border border-dark-600 bg-dark-700 text-gray-400 hover:text-white hover:border-dark-500 transition-colors disabled:opacity-50 text-sm"
									>
										Snooze 7 days
									</button>
								</div>
							</div>
						)}
					</div>
				</div>

				{/* Footer */}
				<div className="border-t border-dark-600 p-4 bg-dark-800 flex items-center justify-between">
					<div className="text-sm text-gray-500">
						{currentRuleIndex + 1} of {triggeredRules.length} decisions
					</div>
					<div className="flex gap-3">
						<button
							onClick={onDismiss}
							className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
						>
							Decide Later
						</button>
						<button
							onClick={handleExecute}
							disabled={!selectedAction || isExecuting}
							className="btn-cyber px-6 py-2 flex items-center gap-2 disabled:opacity-50"
						>
							{isExecuting ? (
								<>
									<div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
									Processing...
								</>
							) : (
								<>
									<Check className="w-4 h-4" />
									Execute & {isLast ? 'Finish' : 'Next'}
								</>
							)}
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}
