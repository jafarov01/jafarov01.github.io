import { useState } from 'react';
import { useData } from '../contexts/DataContext';
import { useToast } from '../contexts/ToastContext';
import {
	Target,
	Calendar,
	Plus,
	Trash2,
	Edit2,
	X,
	Save,
	AlertTriangle,
	CheckCircle2,
	Clock,
	BookOpen,
	Shield,
	Link2,
	ChevronDown,
	ChevronUp,
	Zap,
	Flag,
	ArrowRight,
	Bell
} from 'lucide-react';
import { format, differenceInDays, isPast } from 'date-fns';
import { type Campaign, type CampaignStatus, type CampaignRule, type RuleStatus } from '../lib/seedData';
import { StrategyDecisionModal, type TriggeredRule, type RuleAction } from './StrategyDecisionModal';

const campaignStatuses: CampaignStatus[] = ['planned', 'active', 'completed', 'failed'];
const ruleStatuses: RuleStatus[] = ['pending', 'triggered', 'safe'];

export function Strategy() {
	const {
		campaigns, exams, bureaucracy,
		addCampaign, updateCampaign, deleteCampaign,
		getActiveCampaign,
		profile,
		// v7.0 Strategy Decision System
		getTriggeredRules,
		executeRuleAction,
		markRuleSafe,
		snoozeRule
	} = useData();
	const { showToast } = useToast();

	const [isModalOpen, setIsModalOpen] = useState(false);
	const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
	const [expandedCampaignId, setExpandedCampaignId] = useState<string | null>(null);
	const [showRuleModal, setShowRuleModal] = useState(false);
	const [editingRule, setEditingRule] = useState<{ campaignId: string; ruleIndex: number } | null>(null);
	const [showDecisionModal, setShowDecisionModal] = useState(false);

	const [campaignForm, setCampaignForm] = useState({
		name: '',
		startDate: '',
		endDate: '',
		status: 'planned' as CampaignStatus,
		focus_areas: '',
		linked_exams: [] as string[],
		linked_docs: [] as string[]
	});

	const [ruleForm, setRuleForm] = useState({
		condition: '',
		action: '',
		deadline: '',
		status: 'pending' as RuleStatus
	});

	const activeCampaign = getActiveCampaign();
	const now = new Date();

	// v7.0: Get triggered rules
	const triggeredRules = getTriggeredRules();

	// Decision modal handlers
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

	// Check if a rule's deadline has passed
	const isRuleOverdue = (rule: CampaignRule) => {
		return rule.status === 'pending' && isPast(new Date(rule.deadline));
	};

	const getDaysOverdue = (deadline: string) => {
		return differenceInDays(now, new Date(deadline));
	};

	const resetCampaignForm = () => {
		setCampaignForm({
			name: '',
			startDate: '',
			endDate: '',
			status: 'planned',
			focus_areas: '',
			linked_exams: [],
			linked_docs: []
		});
		setEditingCampaign(null);
	};

	const resetRuleForm = () => {
		setRuleForm({
			condition: '',
			action: '',
			deadline: '',
			status: 'pending'
		});
		setEditingRule(null);
	};

	const openEditCampaign = (campaign: Campaign) => {
		setEditingCampaign(campaign);
		setCampaignForm({
			name: campaign.name,
			startDate: campaign.startDate,
			endDate: campaign.endDate,
			status: campaign.status,
			focus_areas: campaign.focus_areas?.join(', ') || '',
			linked_exams: campaign.linked_exams || [],
			linked_docs: campaign.linked_docs || []
		});
		setIsModalOpen(true);
	};

	const handleSaveCampaign = async () => {
		if (!campaignForm.name.trim()) return;

		try {
			const campaignData: Omit<Campaign, 'id'> = {
				name: campaignForm.name,
				startDate: campaignForm.startDate,
				endDate: campaignForm.endDate,
				status: campaignForm.status,
				focus_areas: campaignForm.focus_areas.split(',').map(s => s.trim()).filter(Boolean),
				linked_exams: campaignForm.linked_exams,
				linked_docs: campaignForm.linked_docs,
				rules: editingCampaign?.rules || []
			};

			if (editingCampaign) {
				await updateCampaign(editingCampaign.id, campaignData);
				showToast('Campaign updated', 'success');
			} else {
				await addCampaign(campaignData);
				showToast('Campaign created', 'success');
			}

			setIsModalOpen(false);
			resetCampaignForm();
		} catch {
			showToast('Failed to save campaign', 'error');
		}
	};

	const handleAddRule = (campaignId: string) => {
		resetRuleForm();
		setEditingRule({ campaignId, ruleIndex: -1 });
		setShowRuleModal(true);
	};

	const handleEditRule = (campaignId: string, ruleIndex: number, rule: CampaignRule) => {
		setRuleForm({
			condition: rule.condition,
			action: rule.action,
			deadline: rule.deadline,
			status: rule.status
		});
		setEditingRule({ campaignId, ruleIndex });
		setShowRuleModal(true);
	};

	const handleSaveRule = async () => {
		if (!editingRule || !ruleForm.condition.trim() || !ruleForm.action.trim()) return;

		const campaign = campaigns.find(c => c.id === editingRule.campaignId);
		if (!campaign) return;

		try {
			const newRule: CampaignRule = {
				condition: ruleForm.condition,
				action: ruleForm.action,
				deadline: ruleForm.deadline,
				status: ruleForm.status
			};

			let updatedRules: CampaignRule[];
			if (editingRule.ruleIndex === -1) {
				// Adding new rule
				updatedRules = [...(campaign.rules || []), newRule];
			} else {
				// Editing existing rule
				updatedRules = [...(campaign.rules || [])];
				updatedRules[editingRule.ruleIndex] = newRule;
			}

			await updateCampaign(campaign.id, { rules: updatedRules });
			showToast(editingRule.ruleIndex === -1 ? 'Rule added' : 'Rule updated', 'success');
			setShowRuleModal(false);
			resetRuleForm();
		} catch {
			showToast('Failed to save rule', 'error');
		}
	};

	const handleDeleteRule = async (campaignId: string, ruleIndex: number) => {
		const campaign = campaigns.find(c => c.id === campaignId);
		if (!campaign) return;

		try {
			const updatedRules = (campaign.rules || []).filter((_, i) => i !== ruleIndex);
			await updateCampaign(campaignId, { rules: updatedRules });
			showToast('Rule deleted', 'success');
		} catch {
			showToast('Failed to delete rule', 'error');
		}
	};

	const handleUpdateRuleStatus = async (campaignId: string, ruleIndex: number, status: RuleStatus) => {
		const campaign = campaigns.find(c => c.id === campaignId);
		if (!campaign) return;

		try {
			const updatedRules = [...(campaign.rules || [])];
			updatedRules[ruleIndex] = { ...updatedRules[ruleIndex], status };
			await updateCampaign(campaignId, { rules: updatedRules });
		} catch {
			showToast('Failed to update rule status', 'error');
		}
	};

	const toggleLinkedExam = (examId: string) => {
		setCampaignForm(prev => ({
			...prev,
			linked_exams: prev.linked_exams.includes(examId)
				? prev.linked_exams.filter(id => id !== examId)
				: [...prev.linked_exams, examId]
		}));
	};

	const toggleLinkedDoc = (docId: string) => {
		setCampaignForm(prev => ({
			...prev,
			linked_docs: prev.linked_docs.includes(docId)
				? prev.linked_docs.filter(id => id !== docId)
				: [...prev.linked_docs, docId]
		}));
	};

	const getStatusColor = (status: CampaignStatus) => {
		switch (status) {
			case 'active': return 'bg-neon-green/10 text-neon-green border-neon-green/30';
			case 'planned': return 'bg-neon-cyan/10 text-neon-cyan border-neon-cyan/30';
			case 'completed': return 'bg-neon-purple/10 text-neon-purple border-neon-purple/30';
			case 'failed': return 'bg-neon-red/10 text-neon-red border-neon-red/30';
		}
	};

	const getRuleStatusColor = (status: RuleStatus) => {
		switch (status) {
			case 'pending': return 'bg-neon-yellow/10 text-neon-yellow border-neon-yellow/30';
			case 'triggered': return 'bg-neon-red/10 text-neon-red border-neon-red/30';
			case 'safe': return 'bg-neon-green/10 text-neon-green border-neon-green/30';
		}
	};

	const getCampaignProgress = (campaign: Campaign) => {
		const start = new Date(campaign.startDate);
		const end = new Date(campaign.endDate);
		const total = differenceInDays(end, start);
		const elapsed = differenceInDays(now, start);
		return Math.min(100, Math.max(0, (elapsed / total) * 100));
	};

	const getDaysRemaining = (endDate: string) => {
		const days = differenceInDays(new Date(endDate), now);
		return days;
	};

	// Get linked entity names
	const getExamName = (examId: string) => exams.find(e => e.id === examId)?.name || examId;
	const getDocName = (docId: string) => bureaucracy.find(d => d.id === docId)?.name || docId;

	// Stats
	const totalCampaigns = campaigns.length;
	const completedCampaigns = campaigns.filter(c => c.status === 'completed').length;
	const pendingRules = activeCampaign?.rules?.filter(r => r.status === 'pending').length || 0;
	const overdueRules = triggeredRules.length;

	return (
		<div className="p-6 max-w-7xl mx-auto space-y-6">
			{/* URGENT: Overdue Rules Alert */}
			{overdueRules > 0 && (
				<div className="card-cyber p-4 border-neon-red/50 bg-neon-red/5">
					<div className="flex items-start gap-3">
						<AlertTriangle className="w-6 h-6 text-neon-red animate-pulse flex-shrink-0 mt-0.5" />
						<div className="flex-1 min-w-0">
							<h4 className="font-semibold text-neon-red">
								{overdueRules} Strategic Decision{overdueRules > 1 ? 's' : ''} OVERDUE
							</h4>
							<p className="text-sm text-gray-400 mb-2">
								Rule deadline{overdueRules > 1 ? 's have' : ' has'} passed - action required
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
							className="btn-cyber px-4 py-2 text-sm flex-shrink-0 bg-neon-red/20 border-neon-red/50 hover:bg-neon-red/30 flex items-center gap-2"
						>
							<Bell className="w-4 h-4" />
							Decide Now
						</button>
					</div>
				</div>
			)}

			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-3xl font-bold text-white flex items-center gap-3">
						<Target className="w-8 h-8 text-neon-yellow" />
						Strategy Command
					</h1>
					<p className="text-gray-500 mt-1">
						{profile?.name || 'Your'} Campaign & Strategic Planning Center
					</p>
				</div>
				<button
					onClick={() => { resetCampaignForm(); setIsModalOpen(true); }}
					className="btn-cyber px-4 py-2 flex items-center gap-2"
				>
					<Plus className="w-4 h-4" />
					New Campaign
				</button>
			</div>

			{/* Stats Row */}
			<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
				<div className="card-cyber p-4">
					<div className="flex items-center gap-2 text-gray-400 text-sm mb-2">
						<Flag className="w-4 h-4" />
						CAMPAIGNS
					</div>
					<div className="text-2xl font-bold text-white">{totalCampaigns}</div>
					<div className="text-xs text-gray-500">{completedCampaigns} completed</div>
				</div>

				<div className="card-cyber p-4">
					<div className="flex items-center gap-2 text-gray-400 text-sm mb-2">
						<Zap className="w-4 h-4 text-neon-green" />
						ACTIVE CAMPAIGN
					</div>
					<div className="text-lg font-bold text-neon-green truncate">
						{activeCampaign?.name || 'None'}
					</div>
					{activeCampaign && (
						<div className="text-xs text-gray-500">
							{getDaysRemaining(activeCampaign.endDate)} days remaining
						</div>
					)}
				</div>

				<div className={`card-cyber p-4 ${overdueRules > 0 ? 'border-neon-red/30' : ''}`}>
					<div className="flex items-center gap-2 text-gray-400 text-sm mb-2">
						<AlertTriangle className={`w-4 h-4 ${overdueRules > 0 ? 'text-neon-red animate-pulse' : 'text-neon-yellow'}`} />
						{overdueRules > 0 ? 'OVERDUE RULES' : 'PENDING RULES'}
					</div>
					<div className={`text-2xl font-bold ${
						overdueRules > 0 ? 'text-neon-red' : 
						pendingRules > 0 ? 'text-neon-yellow' : 'text-gray-500'
					}`}>
						{overdueRules > 0 ? overdueRules : pendingRules}
					</div>
					<div className="text-xs text-gray-500">
						{overdueRules > 0 ? 'action required' : 'decisions awaiting'}
					</div>
				</div>

				<div className="card-cyber p-4">
					<div className="flex items-center gap-2 text-gray-400 text-sm mb-2">
						<BookOpen className="w-4 h-4 text-neon-cyan" />
						LINKED EXAMS
					</div>
					<div className="text-2xl font-bold text-neon-cyan">
						{activeCampaign?.linked_exams?.length || 0}
					</div>
					<div className="text-xs text-gray-500">in active campaign</div>
				</div>
			</div>

			{/* Active Campaign Highlight */}
			{activeCampaign && (
				<div className="card-cyber p-6 border-neon-green/30 neon-border-green">
					<div className="flex items-start justify-between mb-4">
						<div>
							<div className="flex items-center gap-2 text-neon-green text-sm mb-1">
								<Zap className="w-4 h-4" />
								ACTIVE CAMPAIGN
							</div>
							<h2 className="text-2xl font-bold text-white">{activeCampaign.name}</h2>
							<div className="flex items-center gap-4 mt-2 text-sm text-gray-400">
								<span className="flex items-center gap-1">
									<Calendar className="w-4 h-4" />
									{format(new Date(activeCampaign.startDate), 'MMM d')} — {format(new Date(activeCampaign.endDate), 'MMM d, yyyy')}
								</span>
								<span className="flex items-center gap-1">
									<Clock className="w-4 h-4" />
									{getDaysRemaining(activeCampaign.endDate)} days left
								</span>
							</div>
						</div>
						<div className="text-right">
							<div className="text-4xl font-bold text-neon-green neon-text-green">
								{Math.round(getCampaignProgress(activeCampaign))}%
							</div>
							<div className="text-xs text-gray-500">progress</div>
						</div>
					</div>

					{/* Progress bar */}
					<div className="h-2 bg-dark-700 rounded-full overflow-hidden mb-4">
						<div
							className="h-full bg-neon-green rounded-full transition-all duration-500"
							style={{ width: `${getCampaignProgress(activeCampaign)}%` }}
						/>
					</div>

					{/* Focus Areas */}
					{activeCampaign.focus_areas && activeCampaign.focus_areas.length > 0 && (
						<div className="flex flex-wrap gap-2 mb-4">
							{activeCampaign.focus_areas.map(area => (
								<span key={area} className="px-2 py-1 bg-dark-600 text-gray-300 text-xs rounded">
									{area}
								</span>
							))}
						</div>
					)}

					{/* Quick Rules Overview */}
					{activeCampaign.rules && activeCampaign.rules.length > 0 && (
						<div className="border-t border-dark-600 pt-4">
							<div className="flex items-center justify-between mb-2">
								<h4 className="text-sm text-gray-400 flex items-center gap-2">
									<AlertTriangle className="w-4 h-4" />
									Strategic Rules ({activeCampaign.rules.filter(r => r.status === 'pending').length} pending
									{overdueRules > 0 && <span className="text-neon-red">, {overdueRules} overdue</span>})
								</h4>
								{overdueRules > 0 && (
									<button
										onClick={() => setShowDecisionModal(true)}
										className="text-xs text-neon-red hover:text-white transition-colors flex items-center gap-1"
									>
										<Bell className="w-3 h-3" />
										Decide Now
									</button>
								)}
							</div>
							<div className="space-y-2">
								{activeCampaign.rules.slice(0, 3).map((rule, idx) => {
									const overdue = isRuleOverdue(rule);
									return (
										<div
											key={idx}
											className={`flex items-center justify-between p-2 rounded bg-dark-700 border ${
												overdue ? 'border-neon-red/50 bg-neon-red/5' :
												rule.status === 'triggered' ? 'border-neon-red/30' :
												rule.status === 'safe' ? 'border-neon-green/30' : 'border-dark-600'
											}`}
										>
											<div className="flex items-center gap-2 text-sm">
												<span className={`w-2 h-2 rounded-full ${
													overdue ? 'bg-neon-red animate-pulse' :
													rule.status === 'pending' ? 'bg-neon-yellow animate-pulse' :
													rule.status === 'triggered' ? 'bg-neon-red' : 'bg-neon-green'
												}`} />
												<span className="text-gray-400">{rule.condition}</span>
												<ArrowRight className="w-3 h-3 text-gray-600" />
												<span className="text-white">{rule.action}</span>
											</div>
											<div className="flex items-center gap-2">
												{overdue ? (
													<span className="text-xs text-neon-red">
														{getDaysOverdue(rule.deadline)}d overdue
													</span>
												) : (
													<span className="text-xs text-gray-500">
														{format(new Date(rule.deadline), 'MMM d')}
													</span>
												)}
												<span className={`px-2 py-0.5 text-xs rounded border ${
													overdue ? 'bg-neon-red/20 text-neon-red border-neon-red/30' :
													getRuleStatusColor(rule.status)
												}`}>
													{overdue ? 'OVERDUE' : rule.status}
												</span>
											</div>
										</div>
									);
								})}
							</div>
						</div>
					)}
				</div>
			)}

			{/* All Campaigns */}
			<div className="space-y-4">
				<h3 className="text-lg font-semibold text-white flex items-center gap-2">
					<Flag className="w-5 h-5 text-neon-cyan" />
					All Campaigns
				</h3>

				{campaigns.length === 0 ? (
					<div className="card-cyber p-12 text-center">
						<Target className="w-16 h-16 text-gray-600 mx-auto mb-4" />
						<p className="text-gray-500 mb-4">No campaigns created yet.</p>
						<button
							onClick={() => { resetCampaignForm(); setIsModalOpen(true); }}
							className="btn-cyber px-4 py-2"
						>
							Create Your First Campaign
						</button>
					</div>
				) : (
					<div className="space-y-4">
						{campaigns.map(campaign => (
							<div
								key={campaign.id}
								className={`card-cyber p-5 transition-all ${campaign.status === 'active' ? 'border-neon-green/20' : ''
									}`}
							>
								<div className="flex items-start justify-between">
									<div className="flex-1">
										<div className="flex items-center gap-3 mb-2">
											<h3 className="text-lg font-bold text-white">{campaign.name}</h3>
											<span className={`px-2 py-0.5 text-xs rounded-full border ${getStatusColor(campaign.status)}`}>
												{campaign.status}
											</span>
										</div>

										<div className="flex items-center gap-4 text-sm text-gray-400 mb-3">
											<span className="flex items-center gap-1">
												<Calendar className="w-4 h-4" />
												{format(new Date(campaign.startDate), 'MMM d')} — {format(new Date(campaign.endDate), 'MMM d, yyyy')}
											</span>
											{campaign.status !== 'completed' && campaign.status !== 'failed' && (
												<span className="flex items-center gap-1">
													<Clock className="w-4 h-4" />
													{getDaysRemaining(campaign.endDate)} days left
												</span>
											)}
										</div>

										{/* Linked entities summary */}
										<div className="flex items-center gap-4 text-sm">
											{campaign.linked_exams && campaign.linked_exams.length > 0 && (
												<span className="flex items-center gap-1 text-neon-cyan">
													<BookOpen className="w-4 h-4" />
													{campaign.linked_exams.length} exam{campaign.linked_exams.length > 1 ? 's' : ''}
												</span>
											)}
											{campaign.linked_docs && campaign.linked_docs.length > 0 && (
												<span className="flex items-center gap-1 text-neon-purple">
													<Shield className="w-4 h-4" />
													{campaign.linked_docs.length} doc{campaign.linked_docs.length > 1 ? 's' : ''}
												</span>
											)}
											{campaign.rules && campaign.rules.length > 0 && (
												<span className="flex items-center gap-1 text-neon-yellow">
													<AlertTriangle className="w-4 h-4" />
													{campaign.rules.length} rule{campaign.rules.length > 1 ? 's' : ''}
												</span>
											)}
										</div>
									</div>

									<div className="flex items-center gap-2">
										<button
											onClick={() => setExpandedCampaignId(expandedCampaignId === campaign.id ? null : campaign.id)}
											className="p-2 text-gray-400 hover:text-white transition-colors"
										>
											{expandedCampaignId === campaign.id ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
										</button>
										<button
											onClick={() => openEditCampaign(campaign)}
											className="p-2 text-gray-400 hover:text-neon-cyan transition-colors"
										>
											<Edit2 className="w-4 h-4" />
										</button>
										<button
											onClick={() => deleteCampaign(campaign.id)}
											className="p-2 text-gray-400 hover:text-neon-red transition-colors"
										>
											<Trash2 className="w-4 h-4" />
										</button>
									</div>
								</div>

								{/* Expanded Details */}
								{expandedCampaignId === campaign.id && (
									<div className="mt-4 pt-4 border-t border-dark-600 space-y-4">
										{/* Linked Exams */}
										{campaign.linked_exams && campaign.linked_exams.length > 0 && (
											<div>
												<h4 className="text-sm font-medium text-gray-400 mb-2 flex items-center gap-2">
													<BookOpen className="w-4 h-4 text-neon-cyan" />
													Linked Exams
												</h4>
												<div className="flex flex-wrap gap-2">
													{campaign.linked_exams.map(examId => {
														const exam = exams.find(e => e.id === examId);
														return (
															<span
																key={examId}
																className={`px-3 py-1 text-sm rounded border ${exam?.status === 'passed'
																		? 'bg-neon-green/10 text-neon-green border-neon-green/30'
																		: 'bg-dark-600 text-gray-300 border-dark-500'
																	}`}
															>
																{getExamName(examId)}
																{exam?.status === 'passed' && <CheckCircle2 className="w-3 h-3 inline ml-1" />}
															</span>
														);
													})}
												</div>
											</div>
										)}

										{/* Linked Docs */}
										{campaign.linked_docs && campaign.linked_docs.length > 0 && (
											<div>
												<h4 className="text-sm font-medium text-gray-400 mb-2 flex items-center gap-2">
													<Shield className="w-4 h-4 text-neon-purple" />
													Linked Documents
												</h4>
												<div className="flex flex-wrap gap-2">
													{campaign.linked_docs.map(docId => (
														<span key={docId} className="px-3 py-1 bg-dark-600 text-gray-300 text-sm rounded border border-dark-500">
															{getDocName(docId)}
														</span>
													))}
												</div>
											</div>
										)}

										{/* Rules */}
										<div>
											<div className="flex items-center justify-between mb-2">
												<h4 className="text-sm font-medium text-gray-400 flex items-center gap-2">
													<AlertTriangle className="w-4 h-4 text-neon-yellow" />
													Strategic Rules
												</h4>
												<button
													onClick={() => handleAddRule(campaign.id)}
													className="text-xs text-neon-cyan hover:text-neon-green transition-colors flex items-center gap-1"
												>
													<Plus className="w-3 h-3" />
													Add Rule
												</button>
											</div>

											{(!campaign.rules || campaign.rules.length === 0) ? (
												<p className="text-sm text-gray-500">No strategic rules defined.</p>
											) : (
												<div className="space-y-2">
													{campaign.rules.map((rule, idx) => (
														<div
															key={idx}
															className={`p-3 rounded-lg bg-dark-700 border ${rule.status === 'triggered' ? 'border-neon-red/30' :
																	rule.status === 'safe' ? 'border-neon-green/30' : 'border-dark-600'
																}`}
														>
															<div className="flex items-start justify-between">
																<div className="flex-1">
																	<div className="flex items-center gap-2 mb-1">
																		<span className="text-sm text-gray-400">IF:</span>
																		<span className="text-sm text-white">{rule.condition}</span>
																	</div>
																	<div className="flex items-center gap-2">
																		<span className="text-sm text-gray-400">THEN:</span>
																		<span className="text-sm font-medium text-neon-yellow">{rule.action}</span>
																	</div>
																	<div className="mt-1 text-xs text-gray-500">
																		Deadline: {format(new Date(rule.deadline), 'MMM d, yyyy')}
																	</div>
																</div>

																<div className="flex items-center gap-2">
																	<select
																		value={rule.status}
																		onChange={e => handleUpdateRuleStatus(campaign.id, idx, e.target.value as RuleStatus)}
																		className={`text-xs px-2 py-1 rounded border bg-dark-800 ${getRuleStatusColor(rule.status)}`}
																	>
																		{ruleStatuses.map(s => (
																			<option key={s} value={s}>{s}</option>
																		))}
																	</select>
																	<button
																		onClick={() => handleEditRule(campaign.id, idx, rule)}
																		className="p-1 text-gray-400 hover:text-neon-cyan"
																	>
																		<Edit2 className="w-3 h-3" />
																	</button>
																	<button
																		onClick={() => handleDeleteRule(campaign.id, idx)}
																		className="p-1 text-gray-400 hover:text-neon-red"
																	>
																		<Trash2 className="w-3 h-3" />
																	</button>
																</div>
															</div>
														</div>
													))}
												</div>
											)}
										</div>
									</div>
								)}
							</div>
						))}
					</div>
				)}
			</div>

			{/* Campaign Modal */}
			{isModalOpen && (
				<div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
					<div className="card-cyber p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
						<div className="flex items-center justify-between mb-6">
							<h2 className="text-xl font-bold text-white flex items-center gap-2">
								<Target className="w-5 h-5 text-neon-yellow" />
								{editingCampaign ? 'Edit Campaign' : 'Create New Campaign'}
							</h2>
							<button
								onClick={() => { setIsModalOpen(false); resetCampaignForm(); }}
								className="p-2 text-gray-400 hover:text-white"
							>
								<X className="w-5 h-5" />
							</button>
						</div>

						<div className="space-y-4">
							<div>
								<label className="block text-sm text-gray-400 mb-1">Campaign Name *</label>
								<input
									type="text"
									value={campaignForm.name}
									onChange={e => setCampaignForm({ ...campaignForm, name: e.target.value })}
									className="w-full bg-dark-700 border border-dark-600 rounded p-2 text-white focus:border-neon-yellow focus:outline-none"
									placeholder="e.g. Winter Campaign 2026"
								/>
							</div>

							<div className="grid grid-cols-3 gap-4">
								<div>
									<label className="block text-sm text-gray-400 mb-1">Start Date</label>
									<input
										type="date"
										value={campaignForm.startDate}
										onChange={e => setCampaignForm({ ...campaignForm, startDate: e.target.value })}
										className="w-full bg-dark-700 border border-dark-600 rounded p-2 text-white focus:border-neon-yellow focus:outline-none"
									/>
								</div>
								<div>
									<label className="block text-sm text-gray-400 mb-1">End Date</label>
									<input
										type="date"
										value={campaignForm.endDate}
										onChange={e => setCampaignForm({ ...campaignForm, endDate: e.target.value })}
										className="w-full bg-dark-700 border border-dark-600 rounded p-2 text-white focus:border-neon-yellow focus:outline-none"
									/>
								</div>
								<div>
									<label className="block text-sm text-gray-400 mb-1">Status</label>
									<select
										value={campaignForm.status}
										onChange={e => setCampaignForm({ ...campaignForm, status: e.target.value as CampaignStatus })}
										className="w-full bg-dark-700 border border-dark-600 rounded p-2 text-white focus:border-neon-yellow focus:outline-none"
									>
										{campaignStatuses.map(s => (
											<option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
										))}
									</select>
								</div>
							</div>

							<div>
								<label className="block text-sm text-gray-400 mb-1">Focus Areas (comma-separated)</label>
								<input
									type="text"
									value={campaignForm.focus_areas}
									onChange={e => setCampaignForm({ ...campaignForm, focus_areas: e.target.value })}
									className="w-full bg-dark-700 border border-dark-600 rounded p-2 text-white focus:border-neon-yellow focus:outline-none"
									placeholder="e.g. Academics, Visa, Job Hunt"
								/>
							</div>

							{/* Link Exams */}
							<div>
								<label className="block text-sm text-gray-400 mb-2 flex items-center gap-2">
									<Link2 className="w-4 h-4" />
									Link Exams
								</label>
								<div className="max-h-40 overflow-y-auto bg-dark-700 border border-dark-600 rounded p-2 space-y-1">
									{exams.filter(e => e.status !== 'passed').length === 0 ? (
										<p className="text-sm text-gray-500 text-center py-2">No unpassed exams to link</p>
									) : (
										exams.filter(e => e.status !== 'passed').map(exam => (
											<label
												key={exam.id}
												className="flex items-center gap-2 p-1.5 rounded hover:bg-dark-600 cursor-pointer"
											>
												<input
													type="checkbox"
													checked={campaignForm.linked_exams.includes(exam.id)}
													onChange={() => toggleLinkedExam(exam.id)}
													className="w-4 h-4 accent-neon-cyan"
												/>
												<span className="text-sm text-gray-300">{exam.name}</span>
												<span className="text-xs text-gray-500">({exam.cfu} CFU)</span>
											</label>
										))
									)}
								</div>
							</div>

							{/* Link Documents */}
							<div>
								<label className="block text-sm text-gray-400 mb-2 flex items-center gap-2">
									<Link2 className="w-4 h-4" />
									Link Documents
								</label>
								<div className="max-h-40 overflow-y-auto bg-dark-700 border border-dark-600 rounded p-2 space-y-1">
									{bureaucracy.length === 0 ? (
										<p className="text-sm text-gray-500 text-center py-2">No documents to link</p>
									) : (
										bureaucracy.map(doc => (
											<label
												key={doc.id}
												className="flex items-center gap-2 p-1.5 rounded hover:bg-dark-600 cursor-pointer"
											>
												<input
													type="checkbox"
													checked={campaignForm.linked_docs.includes(doc.id)}
													onChange={() => toggleLinkedDoc(doc.id)}
													className="w-4 h-4 accent-neon-purple"
												/>
												<span className="text-sm text-gray-300">{doc.name}</span>
												<span className={`text-xs ${doc.status === 'valid' ? 'text-neon-green' :
														doc.status === 'expired' ? 'text-neon-red' : 'text-gray-500'
													}`}>
													({doc.status})
												</span>
											</label>
										))
									)}
								</div>
							</div>
						</div>

						<div className="flex justify-end gap-3 mt-6 pt-4 border-t border-dark-600">
							<button
								onClick={() => { setIsModalOpen(false); resetCampaignForm(); }}
								className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
							>
								Cancel
							</button>
							<button
								onClick={handleSaveCampaign}
								disabled={!campaignForm.name.trim()}
								className="btn-cyber px-6 py-2 flex items-center gap-2 disabled:opacity-50"
							>
								<Save className="w-4 h-4" />
								{editingCampaign ? 'Update' : 'Create'} Campaign
							</button>
						</div>
					</div>
				</div>
			)}

			{/* Rule Modal */}
			{showRuleModal && editingRule && (
				<div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
					<div className="card-cyber p-6 w-full max-w-md">
						<div className="flex items-center justify-between mb-6">
							<h2 className="text-xl font-bold text-white flex items-center gap-2">
								<AlertTriangle className="w-5 h-5 text-neon-yellow" />
								{editingRule.ruleIndex === -1 ? 'Add Rule' : 'Edit Rule'}
							</h2>
							<button
								onClick={() => { setShowRuleModal(false); resetRuleForm(); }}
								className="p-2 text-gray-400 hover:text-white"
							>
								<X className="w-5 h-5" />
							</button>
						</div>

						<div className="space-y-4">
							<div>
								<label className="block text-sm text-gray-400 mb-1">IF (Condition) *</label>
								<input
									type="text"
									value={ruleForm.condition}
									onChange={e => setRuleForm({ ...ruleForm, condition: e.target.value })}
									className="w-full bg-dark-700 border border-dark-600 rounded p-2 text-white focus:border-neon-yellow focus:outline-none"
									placeholder="e.g. Project Topic NOT assigned"
								/>
							</div>

							<div>
								<label className="block text-sm text-gray-400 mb-1">THEN (Action) *</label>
								<input
									type="text"
									value={ruleForm.action}
									onChange={e => setRuleForm({ ...ruleForm, action: e.target.value })}
									className="w-full bg-dark-700 border border-dark-600 rounded p-2 text-white focus:border-neon-yellow focus:outline-none"
									placeholder="e.g. DROP Web Info Management"
								/>
							</div>

							<div className="grid grid-cols-2 gap-4">
								<div>
									<label className="block text-sm text-gray-400 mb-1">Deadline</label>
									<input
										type="date"
										value={ruleForm.deadline}
										onChange={e => setRuleForm({ ...ruleForm, deadline: e.target.value })}
										className="w-full bg-dark-700 border border-dark-600 rounded p-2 text-white focus:border-neon-yellow focus:outline-none"
									/>
								</div>
								<div>
									<label className="block text-sm text-gray-400 mb-1">Status</label>
									<select
										value={ruleForm.status}
										onChange={e => setRuleForm({ ...ruleForm, status: e.target.value as RuleStatus })}
										className="w-full bg-dark-700 border border-dark-600 rounded p-2 text-white focus:border-neon-yellow focus:outline-none"
									>
										{ruleStatuses.map(s => (
											<option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
										))}
									</select>
								</div>
							</div>
						</div>

						<div className="flex justify-end gap-3 mt-6 pt-4 border-t border-dark-600">
							<button
								onClick={() => { setShowRuleModal(false); resetRuleForm(); }}
								className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
							>
								Cancel
							</button>
							<button
								onClick={handleSaveRule}
								disabled={!ruleForm.condition.trim() || !ruleForm.action.trim()}
								className="btn-cyber px-6 py-2 flex items-center gap-2 disabled:opacity-50"
							>
								<Save className="w-4 h-4" />
								{editingRule.ruleIndex === -1 ? 'Add' : 'Update'} Rule
							</button>
						</div>
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
				onDismiss={() => setShowDecisionModal(false)}
			/>
		</div>
	);
}
