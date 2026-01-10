import { useState, useEffect, useMemo } from 'react';
import { useData } from '../contexts/DataContext';
import { useToast } from '../contexts/ToastContext';
import {
	Shield, AlertTriangle, CheckCircle2, Clock,
	FileWarning, Calendar, AlertOctagon, Info,
	Plus, X, Trash2, Edit2, Save, Loader2
} from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { type BureaucracyDoc } from '../lib/seedData';
import { ConfirmModal } from './ConfirmModal';

const STATUS_CONFIG = {
	valid: { color: 'text-neon-green', bg: 'bg-neon-green/10', border: 'border-neon-green/30', icon: CheckCircle2, label: 'VALID' },
	expiring_soon: { color: 'text-neon-yellow', bg: 'bg-neon-yellow/10', border: 'border-neon-yellow/30', icon: Clock, label: 'EXPIRING SOON' },
	expired: { color: 'text-neon-red', bg: 'bg-neon-red/10', border: 'border-neon-red/30', icon: AlertOctagon, label: 'EXPIRED' },
	pending: { color: 'text-neon-cyan', bg: 'bg-neon-cyan/10', border: 'border-neon-cyan/30', icon: Clock, label: 'PENDING' },
	unknown: { color: 'text-neon-red', bg: 'bg-neon-red/10', border: 'border-neon-red/30', icon: FileWarning, label: 'UNKNOWN' }
};

const DOC_TYPES = [
	{ value: 'visa', label: 'Visa / Permit' },
	{ value: 'tax', label: 'Tax Document' },
	{ value: 'university', label: 'University' },
	{ value: 'insurance', label: 'Insurance' },
	{ value: 'other', label: 'Other' }
];

export function Bureaucracy() {
	const { bureaucracy, profile, updateBureaucracy, addBureaucracy, deleteBureaucracy } = useData();
	const { showToast } = useToast();
	const [isAddModalOpen, setIsAddModalOpen] = useState(false);
	const [editingDoc, setEditingDoc] = useState<BureaucracyDoc | null>(null);
	const [isSaving, setIsSaving] = useState(false);

	// Delete confirmation state
	const [confirmOpen, setConfirmOpen] = useState(false);
	const [deleteId, setDeleteId] = useState<string | null>(null);

	// Expiry alert modal state
	const [showExpiryAlert, setShowExpiryAlert] = useState(false);

	// Documents expiring within 30 days (critical alerts)
	const expiringDocs = useMemo(() => {
		return bureaucracy.filter(doc => {
			if (!doc.expiry_date) return false;
			const daysLeft = differenceInDays(new Date(doc.expiry_date), new Date());
			return daysLeft >= 0 && daysLeft <= 30;
		}).sort((a, b) => {
			const daysA = differenceInDays(new Date(a.expiry_date!), new Date());
			const daysB = differenceInDays(new Date(b.expiry_date!), new Date());
			return daysA - daysB; // Sort by urgency (soonest first)
		});
	}, [bureaucracy]);

	// Expired documents (already past expiry)
	const expiredDocs = useMemo(() => {
		return bureaucracy.filter(doc => {
			if (!doc.expiry_date) return false;
			const daysLeft = differenceInDays(new Date(doc.expiry_date), new Date());
			return daysLeft < 0;
		});
	}, [bureaucracy]);

	// Show alert modal on page load if there are expiring/expired docs
	useEffect(() => {
		const hasUrgentDocs = expiringDocs.length > 0 || expiredDocs.length > 0;
		const dismissedKey = 'mex_bureaucracy_alert_dismissed';
		const lastDismissed = localStorage.getItem(dismissedKey);
		const today = format(new Date(), 'yyyy-MM-dd');
		
		// Show alert if not dismissed today and there are urgent docs
		if (hasUrgentDocs && lastDismissed !== today) {
			setShowExpiryAlert(true);
		}
	}, [expiringDocs.length, expiredDocs.length]);

	const dismissExpiryAlert = () => {
		const dismissedKey = 'mex_bureaucracy_alert_dismissed';
		localStorage.setItem(dismissedKey, format(new Date(), 'yyyy-MM-dd'));
		setShowExpiryAlert(false);
	};

	// Form State
	const [formData, setFormData] = useState<Partial<BureaucracyDoc>>({
		name: '',
		type: 'other',
		status: 'pending',
		notes: '',
		is_critical: false
	});

	const criticalItems = bureaucracy.filter(doc => doc.is_critical);
	const otherItems = bureaucracy.filter(doc => !doc.is_critical);

	const getStatusConfig = (status: keyof typeof STATUS_CONFIG) => STATUS_CONFIG[status] || STATUS_CONFIG.unknown;

	const getDaysUntilExpiry = (expiryDate?: string) => {
		if (!expiryDate) return null;
		return differenceInDays(new Date(expiryDate), new Date());
	};

	const handleStatusChange = async (docId: string, newStatus: string) => {
		try {
			await updateBureaucracy(docId, { status: newStatus as any });
		} catch {
			showToast('Failed to update status', 'error');
		}
	};

	const resetForm = () => {
		setFormData({
			name: '',
			type: 'other',
			status: 'pending',
			notes: '',
			is_critical: false,
			issue_date: '',
			expiry_date: ''
		});
		setEditingDoc(null);
	};

	const handleSave = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsSaving(true);
		try {
			if (editingDoc) {
				await updateBureaucracy(editingDoc.id, formData);
				showToast('Document updated', 'success');
			} else {
				await addBureaucracy(formData as Omit<BureaucracyDoc, 'id'>);
				showToast('Document added', 'success');
			}
			setIsAddModalOpen(false);
			resetForm();
		} catch {
			showToast('Failed to save document', 'error');
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
				await deleteBureaucracy(deleteId);
				showToast('Document deleted', 'success');
				setConfirmOpen(false);
				setDeleteId(null);
			} catch {
				showToast('Failed to delete document', 'error');
				setConfirmOpen(false);
			}
		}
	};

	const openEditModal = (doc: BureaucracyDoc) => {
		setEditingDoc(doc);
		setFormData({ ...doc });
		setIsAddModalOpen(true);
	};

	return (
		<div className="p-6 max-w-7xl mx-auto space-y-6">
			<div className="flex justify-between items-center">
				<div>
					<h1 className="text-3xl font-bold text-white flex items-center gap-3">
						<Shield className="w-8 h-8 text-neon-purple" />Bureaucracy
					</h1>
					<p className="text-gray-500 mt-1">Legal Status • Permits • Deadlines</p>
				</div>
				<button
					onClick={() => { resetForm(); setIsAddModalOpen(true); }}
					className="btn-cyber flex items-center gap-2"
				>
					<Plus className="w-4 h-4" /> Add Document
				</button>
			</div>

			{/* Global Warning Banner */}
			{profile?.visa_expiry.includes('WARNING') && (
				<div className="card-cyber p-4 border-neon-red neon-border-red bg-neon-red/5">
					<div className="flex items-center gap-3">
						<AlertTriangle className="w-8 h-8 text-neon-red animate-pulse" />
						<div>
							<h2 className="text-xl font-bold text-neon-red">VISA STATUS: CRITICAL</h2>
							<p className="text-gray-400">Your residence permit expiry date is unknown. This must be resolved immediately.</p>
						</div>
					</div>
				</div>
			)}

			{/* Critical Documents */}
			<div className="card-cyber p-6">
				<h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
					<AlertOctagon className="w-5 h-5 text-neon-red" />Critical Documents
				</h2>
				<div className="space-y-4">
					{criticalItems.length === 0 ? (
						<p className="text-gray-500">No critical documents tracked</p>
					) : (
						criticalItems.map(doc => {
							const config = getStatusConfig(doc.status);
							const StatusIcon = config.icon;
							const daysLeft = getDaysUntilExpiry(doc.expiry_date);

							return (
								<div key={doc.id} className={`p-4 rounded-lg border ${config.border} ${config.bg} group relative`}>
									<div className="flex items-start justify-between">
										<div className="flex items-start gap-4">
											<StatusIcon className={`w-6 h-6 ${config.color} mt-1`} />
											<div>
												<h3 className="text-lg font-semibold text-white flex items-center gap-2">
													{doc.name}
													<button onClick={() => openEditModal(doc)} className="text-gray-500 hover:text-white transition-colors opacity-0 group-hover:opacity-100">
														<Edit2 className="w-3 h-3" />
													</button>
												</h3>
												<p className="text-sm text-gray-400 capitalize">{doc.type.replace('_', ' ')}</p>
												<p className="text-sm text-gray-500 mt-2">{doc.notes}</p>
												{doc.expiry_date && (
													<div className="flex items-center gap-2 mt-2 text-sm">
														<Calendar className="w-4 h-4 text-gray-500" />
														<span className="text-gray-400">Expires: {format(new Date(doc.expiry_date), 'MMM d, yyyy')}</span>
														{daysLeft !== null && daysLeft > 0 && (
															<span className={`font-medium ${daysLeft <= 30 ? 'text-neon-red' : daysLeft <= 90 ? 'text-neon-yellow' : 'text-gray-400'}`}>
																({daysLeft} days left)
															</span>
														)}
													</div>
												)}
											</div>
										</div>
										<div className="flex flex-col items-end gap-2">
											<div className="flex items-center gap-2">
												<span className={`px-3 py-1 rounded text-xs font-medium ${config.bg} ${config.color} border ${config.border}`}>
													{config.label}
												</span>
												<button
													onClick={() => handleDeleteRequest(doc.id)}
													className="text-gray-600 hover:text-neon-red transition-colors p-1"
													title="Delete document"
												>
													<Trash2 className="w-4 h-4" />
												</button>
											</div>
											<select
												value={doc.status}
												onChange={(e) => handleStatusChange(doc.id, e.target.value)}
												className="bg-dark-700 border border-dark-600 rounded px-2 py-1 text-xs text-gray-400 mt-2"
											>
												{Object.keys(STATUS_CONFIG).map(status => (
													<option key={status} value={status}>{STATUS_CONFIG[status as keyof typeof STATUS_CONFIG].label}</option>
												))}
											</select>
										</div>
									</div>
								</div>
							);
						})
					)}
				</div>
			</div>

			{/* Other Documents */}
			<div className="card-cyber p-6">
				<h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
					<Info className="w-5 h-5 text-neon-cyan" />Other Documents
				</h2>
				<div className="space-y-3">
					{otherItems.length === 0 ? (
						<p className="text-gray-500">No other documents tracked</p>
					) : (
						otherItems.map(doc => {
							const config = getStatusConfig(doc.status);
							const StatusIcon = config.icon;

							return (
								<div key={doc.id} className="p-3 rounded-lg bg-dark-700 border border-dark-600 flex items-center justify-between group">
									<div className="flex items-center gap-3">
										<StatusIcon className={`w-5 h-5 ${config.color}`} />
										<div>
											<span className="text-white font-medium flex items-center gap-2">
												{doc.name}
												<button onClick={() => openEditModal(doc)} className="text-gray-500 hover:text-white transition-colors opacity-0 group-hover:opacity-100">
													<Edit2 className="w-3 h-3" />
												</button>
											</span>
											<span className="text-gray-500 text-sm ml-2">({doc.type.replace('_', ' ')})</span>
										</div>
									</div>
									<div className="flex items-center gap-2">
										<span className={`px-2 py-1 rounded text-xs ${config.bg} ${config.color}`}>{config.label}</span>
										<button
											onClick={() => handleDeleteRequest(doc.id)}
											className="text-gray-600 hover:text-neon-red transition-colors p-1 opacity-0 group-hover:opacity-100"
										>
											<Trash2 className="w-4 h-4" />
										</button>
									</div>
								</div>
							);
						})
					)}
				</div>
			</div>

			{/* Quick Reference */}
			<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
				<div className="card-cyber p-4">
					<h3 className="text-sm text-gray-400 uppercase mb-3">Identity</h3>
					<div className="space-y-2">
						<div className="flex justify-between">
							<span className="text-gray-500">Codice Fiscale</span>
							<span className="text-neon-cyan font-mono">{profile?.cf}</span>
						</div>
						<div className="flex justify-between">
							<span className="text-gray-500">Student ID</span>
							<span className="text-white font-mono">{profile?.unipd_id}</span>
						</div>
					</div>
				</div>
				<div className="card-cyber p-4">
					<h3 className="text-sm text-gray-400 uppercase mb-3">Status Summary</h3>
					<div className="flex gap-4">
						<div className="flex items-center gap-2">
							<span className="w-3 h-3 rounded-full bg-neon-green" />
							<span className="text-gray-400">{bureaucracy.filter(d => d.status === 'valid').length} Valid</span>
						</div>
						<div className="flex items-center gap-2">
							<span className="w-3 h-3 rounded-full bg-neon-yellow" />
							<span className="text-gray-400">{bureaucracy.filter(d => d.status === 'expiring_soon' || d.status === 'pending').length} Pending</span>
						</div>
						<div className="flex items-center gap-2">
							<span className="w-3 h-3 rounded-full bg-neon-red" />
							<span className="text-gray-400">{bureaucracy.filter(d => d.status === 'expired' || d.status === 'unknown').length} Critical</span>
						</div>
					</div>
				</div>
			</div>

			{/* Add/Edit Modal */}
			{isAddModalOpen && (
				<div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
					<div className="bg-dark-800 border border-dark-600 rounded-xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
						<div className="p-6 border-b border-dark-600 flex justify-between items-center">
							<h2 className="text-xl font-bold text-white flex items-center gap-2">
								{editingDoc ? <Edit2 className="w-5 h-5 text-neon-cyan" /> : <Plus className="w-5 h-5 text-neon-green" />}
								{editingDoc ? 'Edit Document' : 'Add Document'}
							</h2>
							<button onClick={() => setIsAddModalOpen(false)} className="text-gray-400 hover:text-white">
								<X className="w-5 h-5" />
							</button>
						</div>
						<form onSubmit={handleSave} className="p-6 space-y-4">
							<div>
								<label className="block text-sm font-medium text-gray-400 mb-1">Document Name</label>
								<input
									type="text"
									required
									value={formData.name}
									onChange={e => setFormData({ ...formData, name: e.target.value })}
									className="w-full bg-dark-900 border border-dark-600 rounded p-2 text-white focus:border-neon-purple focus:outline-none"
									placeholder="e.g. Residence Permit"
								/>
							</div>

							<div className="grid grid-cols-2 gap-4">
								<div>
									<label className="block text-sm font-medium text-gray-400 mb-1">Type</label>
									<select
										value={formData.type}
										onChange={e => setFormData({ ...formData, type: e.target.value as any })}
										className="w-full bg-dark-900 border border-dark-600 rounded p-2 text-white focus:border-neon-purple focus:outline-none"
									>
										{DOC_TYPES.map(type => (
											<option key={type.value} value={type.value}>{type.label}</option>
										))}
									</select>
								</div>
								<div>
									<label className="block text-sm font-medium text-gray-400 mb-1">Status</label>
									<select
										value={formData.status}
										onChange={e => setFormData({ ...formData, status: e.target.value as any })}
										className="w-full bg-dark-900 border border-dark-600 rounded p-2 text-white focus:border-neon-purple focus:outline-none"
									>
										{Object.keys(STATUS_CONFIG).map(status => (
											<option key={status} value={status}>{STATUS_CONFIG[status as keyof typeof STATUS_CONFIG].label}</option>
										))}
									</select>
								</div>
							</div>

							<div className="grid grid-cols-2 gap-4">
								<div>
									<label className="block text-sm font-medium text-gray-400 mb-1">Issue Date</label>
									<input
										type="date"
										value={formData.issue_date || ''}
										onChange={e => setFormData({ ...formData, issue_date: e.target.value })}
										className="w-full bg-dark-900 border border-dark-600 rounded p-2 text-white focus:border-neon-purple focus:outline-none"
									/>
								</div>
								<div>
									<label className="block text-sm font-medium text-gray-400 mb-1">Expiry Date</label>
									<input
										type="date"
										value={formData.expiry_date || ''}
										onChange={e => setFormData({ ...formData, expiry_date: e.target.value })}
										className="w-full bg-dark-900 border border-dark-600 rounded p-2 text-white focus:border-neon-purple focus:outline-none"
									/>
								</div>
							</div>

							<div>
								<label className="block text-sm font-medium text-gray-400 mb-1">Notes</label>
								<textarea
									value={formData.notes || ''}
									onChange={e => setFormData({ ...formData, notes: e.target.value })}
									className="w-full bg-dark-900 border border-dark-600 rounded p-2 text-white focus:border-neon-purple focus:outline-none h-24 resize-none"
									placeholder="Add details, protocol numbers, or action items..."
								/>
							</div>

							<div className="flex items-center gap-2">
								<input
									type="checkbox"
									id="is_critical"
									checked={formData.is_critical || false}
									onChange={e => setFormData({ ...formData, is_critical: e.target.checked })}
									className="w-4 h-4 rounded border-dark-600 bg-dark-900 text-neon-purple focus:ring-neon-purple"
								/>
								<label htmlFor="is_critical" className="text-sm font-medium text-white cursor-pointer select-none">
									Mark as Critical Document
								</label>
							</div>

							<div className="pt-4 flex justify-end gap-3">
								<button
									type="button"
									onClick={() => setIsAddModalOpen(false)}
									className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
								>
									Cancel
								</button>
								<button
									type="submit"
									disabled={isSaving}
									className="btn-cyber flex items-center gap-2 disabled:opacity-50"
								>
									{isSaving ? (
										<><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
									) : (
										<><Save className="w-4 h-4" /> Save Document</>
									)}
								</button>
							</div>
						</form>
					</div>
				</div>
			)}

			{/* Expiry Alert Modal */}
			{showExpiryAlert && (expiringDocs.length > 0 || expiredDocs.length > 0) && (
				<div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
					<div className="card-cyber p-6 max-w-lg w-full border-neon-red/50 bg-dark-800">
						<div className="flex items-start gap-4 mb-6">
							<div className="p-3 rounded-full bg-neon-red/20">
								<AlertTriangle className="w-8 h-8 text-neon-red animate-pulse" />
							</div>
							<div>
								<h2 className="text-xl font-bold text-neon-red">⚠️ Document Alert</h2>
								<p className="text-gray-400 mt-1">Critical documents require your attention</p>
							</div>
						</div>

						{/* Expired Documents */}
						{expiredDocs.length > 0 && (
							<div className="mb-4">
								<h3 className="text-sm font-semibold text-neon-red mb-2 flex items-center gap-2">
									<AlertOctagon className="w-4 h-4" />
									EXPIRED ({expiredDocs.length})
								</h3>
								<div className="space-y-2">
									{expiredDocs.map(doc => {
										const daysAgo = Math.abs(differenceInDays(new Date(doc.expiry_date!), new Date()));
										return (
											<div key={doc.id} className="p-3 rounded-lg bg-neon-red/10 border border-neon-red/30">
												<div className="flex justify-between items-center">
													<span className="font-medium text-white">{doc.name}</span>
													<span className="text-neon-red text-sm font-bold">Expired {daysAgo}d ago</span>
												</div>
											</div>
										);
									})}
								</div>
							</div>
						)}

						{/* Expiring Soon Documents */}
						{expiringDocs.length > 0 && (
							<div className="mb-4">
								<h3 className="text-sm font-semibold text-neon-yellow mb-2 flex items-center gap-2">
									<Clock className="w-4 h-4" />
									EXPIRING WITHIN 30 DAYS ({expiringDocs.length})
								</h3>
								<div className="space-y-2">
									{expiringDocs.map(doc => {
										const daysLeft = differenceInDays(new Date(doc.expiry_date!), new Date());
										const urgencyColor = daysLeft <= 7 ? 'text-neon-red' : daysLeft <= 14 ? 'text-neon-yellow' : 'text-neon-cyan';
										return (
											<div key={doc.id} className="p-3 rounded-lg bg-neon-yellow/10 border border-neon-yellow/30">
												<div className="flex justify-between items-center">
													<span className="font-medium text-white">{doc.name}</span>
													<span className={`${urgencyColor} text-sm font-bold`}>
														{daysLeft === 0 ? 'Expires TODAY!' : `${daysLeft}d left`}
													</span>
												</div>
												<div className="text-xs text-gray-500 mt-1">
													Expires: {format(new Date(doc.expiry_date!), 'MMM d, yyyy')}
												</div>
											</div>
										);
									})}
								</div>
							</div>
						)}

						<div className="flex justify-end gap-3 mt-6 pt-4 border-t border-dark-600">
							<button
								onClick={dismissExpiryAlert}
								className="px-4 py-2 text-gray-400 hover:text-white transition-colors text-sm"
							>
								Dismiss for today
							</button>
							<button
								onClick={() => setShowExpiryAlert(false)}
								className="btn-cyber px-4 py-2 flex items-center gap-2"
							>
								<CheckCircle2 className="w-4 h-4" />
								I'll handle it
							</button>
						</div>
					</div>
				</div>
			)}

			<ConfirmModal
				isOpen={confirmOpen}
				title="Delete Document"
				message="Are you sure you want to delete this document? This action cannot be undone."
				confirmText="Delete"
				isDangerous={true}
				onConfirm={confirmDelete}
				onCancel={() => setConfirmOpen(false)}
			/>
		</div>
	);
}
