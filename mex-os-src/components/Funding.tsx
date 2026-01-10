import { useState } from 'react';
import { useData } from '../contexts/DataContext';
import { useToast } from '../contexts/ToastContext';
import {
	PiggyBank,
	Lock,
	Unlock,
	CheckCircle2,
	Clock,
	Plus,
	Trash2,
	Edit2,
	Briefcase,
	DollarSign,
	X,
	Save,
	Loader2
} from 'lucide-react';
import { format } from 'date-fns';
import { type FinanceEntry } from '../lib/seedData';
import { ConfirmModal } from './ConfirmModal';

export function Funding() {
	const { finances, addFinance, updateFinance, deleteFinance, getPassedCFUs } = useData();
	const { showToast } = useToast();
	const passedCFUs = getPassedCFUs();
	const totalPotential = finances.reduce((sum, f) => sum + f.amount, 0);
	const unlockedAmount = finances.filter(f => f.status === 'received').reduce((sum, f) => sum + f.amount, 0);
	const pendingAmount = finances.filter(f => f.status === 'pending').reduce((sum, f) => sum + f.amount, 0);

	const [isModalOpen, setIsModalOpen] = useState(false);
	const [editingItem, setEditingItem] = useState<FinanceEntry | null>(null);
	const [isSaving, setIsSaving] = useState(false);

	// Delete confirmation state
	const [confirmOpen, setConfirmOpen] = useState(false);
	const [deleteId, setDeleteId] = useState<string | null>(null);

	const [formData, setFormData] = useState<Omit<FinanceEntry, 'id'>>({
		source: '',
		type: 'income',
		amount: 0,
		status: 'locked',
		unlock_condition: '',
		expected_date: ''
	});

	const resetForm = () => {
		setFormData({
			source: '',
			type: 'income',
			amount: 0,
			status: 'locked',
			unlock_condition: '',
			expected_date: ''
		});
		setEditingItem(null);
	};

	const openAddModal = () => {
		resetForm();
		setIsModalOpen(true);
	};

	const openEditModal = (item: FinanceEntry) => {
		setEditingItem(item);
		setFormData(item);
		setIsModalOpen(true);
	};

	const handleSave = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!formData.source || formData.amount <= 0) return;

		setIsSaving(true);
		try {
			if (editingItem) {
				await updateFinance(editingItem.id, formData);
				showToast('Funding source updated', 'success');
			} else {
				await addFinance(formData);
				showToast('Funding source added', 'success');
			}
			setIsModalOpen(false);
			resetForm();
		} catch {
			showToast('Failed to save funding source', 'error');
		} finally {
			setIsSaving(false);
		}
	};

	const handleDeleteRequest = (id: string) => {
		setDeleteId(id);
		setConfirmOpen(true);
	};

	const confirmDelete = async () => {
		if (deleteId) {
			try {
				await deleteFinance(deleteId);
				showToast('Funding source deleted', 'success');
				setConfirmOpen(false);
				setDeleteId(null);
			} catch {
				showToast('Failed to delete funding source', 'error');
				setConfirmOpen(false);
			}
		}
	};

	return (
		<div className="p-6 max-w-7xl mx-auto space-y-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-3xl font-bold text-white flex items-center gap-3">
						<Briefcase className="w-8 h-8 text-neon-green" />
						Funding Engine
					</h1>
					<p className="text-gray-500 mt-1">Scholarships, Jobs & Collaborations</p>
				</div>
				<button
					onClick={openAddModal}
					className="btn-cyber flex items-center gap-2"
				>
					<Plus className="w-4 h-4" /> Add Funding Source
				</button>
			</div>

			{/* Summary Cards */}
			<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
				<div className="card-cyber p-4 bg-gradient-to-br from-neon-green/10 to-transparent border-neon-green/30">
					<div className="flex items-center gap-2 text-neon-green mb-2">
						<Unlock className="w-4 h-4" /> UNLOCKED FUNDING
					</div>
					<div className="text-3xl font-bold text-white">€{unlockedAmount.toFixed(0)}</div>
					<div className="text-sm text-gray-400 mt-1">Ready to use</div>
				</div>
				<div className="card-cyber p-4">
					<div className="flex items-center gap-2 text-neon-yellow mb-2">
						<Clock className="w-4 h-4" /> PENDING
					</div>
					<div className="text-3xl font-bold text-white">€{pendingAmount.toFixed(0)}</div>
					<div className="text-sm text-gray-400 mt-1">Awaiting disbursement</div>
				</div>
				<div className="card-cyber p-4">
					<div className="flex items-center gap-2 text-neon-purple mb-2">
						<PiggyBank className="w-4 h-4" /> TOTAL POTENTIAL
					</div>
					<div className="text-3xl font-bold text-white">€{totalPotential.toFixed(0)}</div>
					<div className="text-sm text-gray-400 mt-1">Total academic year value</div>
				</div>
			</div>

			{/* Installments List */}
			<div className="card-cyber p-6">
				<h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
					<DollarSign className="w-5 h-5 text-neon-cyan" />
					Funding Sources & Installments
				</h2>

				<div className="space-y-4">
					{finances.map(entry => {
						const isLocked = entry.status === 'locked';
						const isReceived = entry.status === 'received';

						return (
							<div key={entry.id} className={`p-4 rounded-lg border transition-all group relative ${isReceived ? 'bg-neon-green/5 border-neon-green/30' :
								isLocked ? 'bg-dark-700/50 border-dark-600 opacity-70' :
									'bg-dark-700 border-neon-yellow/30'
								}`}>
								<div className="flex items-start justify-between">
									<div className="flex items-start gap-4">
										<div className={`p-3 rounded-full ${isReceived ? 'bg-neon-green/10 text-neon-green' :
											isLocked ? 'bg-gray-800 text-gray-500' :
												'bg-neon-yellow/10 text-neon-yellow'
											}`}>
											{isReceived ? <CheckCircle2 className="w-6 h-6" /> :
												isLocked ? <Lock className="w-6 h-6" /> :
													<Clock className="w-6 h-6 animate-pulse" />}
										</div>

										<div>
											<h3 className="text-lg font-semibold text-white">{entry.source}</h3>
											<p className="text-sm text-gray-400 mt-0.5">{entry.unlock_condition}</p>

											<div className="flex items-center gap-3 mt-2 text-sm">
												<span className="flex items-center gap-1 text-gray-500">
													<Clock className="w-3 h-3" />
													Expected: {entry.expected_date ? format(new Date(entry.expected_date), 'MMM yyyy') : 'TBD'}
												</span>
												{isLocked && entry.unlock_condition.includes('CFU') && (
													<span className={`px-2 py-0.5 rounded text-xs border ${passedCFUs >= 20 ? 'bg-neon-green/10 text-neon-green border-neon-green/30' : 'bg-dark-600 text-gray-500 border-dark-500'
														}`}>
														{passedCFUs}/20 CFU
													</span>
												)}
											</div>
										</div>
									</div>

									<div className="text-right">
										<div className={`text-2xl font-bold font-mono ${isReceived ? 'text-neon-green' : 'text-gray-300'
											}`}>
											€{entry.amount}
										</div>
										<div className={`text-xs uppercase font-bold mt-1 ${isReceived ? 'text-neon-green' :
											isLocked ? 'text-gray-500' :
												'text-neon-yellow'
											}`}>
											{entry.status}
										</div>
									</div>
								</div>

								{/* Action Buttons */}
								<div className="absolute top-4 right-[120px] opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
									<button
										onClick={() => openEditModal(entry)}
										className="p-1.5 rounded bg-dark-600 hover:bg-neon-cyan/20 text-gray-400 hover:text-neon-cyan transition-colors"
									>
										<Edit2 className="w-4 h-4" />
									</button>
									<button
										onClick={() => handleDeleteRequest(entry.id)}
										className="p-1.5 rounded bg-dark-600 hover:bg-neon-red/20 text-gray-400 hover:text-neon-red transition-colors"
									>
										<Trash2 className="w-4 h-4" />
									</button>
								</div>
							</div>
						);
					})}
					{finances.length === 0 && (
						<p className="text-center text-gray-500 py-8">No funding sources tracked yet.</p>
					)}
				</div>
			</div>

			{/* Add/Edit Modal */}
			{isModalOpen && (
				<div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
					<div className="bg-dark-800 border border-dark-600 rounded-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
						<div className="p-6 border-b border-dark-600 flex justify-between items-center">
							<h2 className="text-xl font-bold text-white flex items-center gap-2">
								{editingItem ? <Edit2 className="w-5 h-5 text-neon-cyan" /> : <Plus className="w-5 h-5 text-neon-green" />}
								{editingItem ? 'Edit Funding Source' : 'Add Funding Source'}
							</h2>
							<button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white">
								<X className="w-5 h-5" />
							</button>
						</div>
						<form onSubmit={handleSave} className="p-6 space-y-4">
							<div className="grid grid-cols-2 gap-4">
								<div>
									<label className="block text-sm font-medium text-gray-400 mb-1">Source Name</label>
									<input
										type="text"
										placeholder="e.g. Scholarship Installment 1"
										value={formData.source}
										onChange={e => setFormData({ ...formData, source: e.target.value })}
										className="w-full bg-dark-900 border border-dark-600 rounded p-2 text-white focus:border-neon-purple focus:outline-none"
										required
									/>
								</div>
								<div>
									<label className="block text-sm font-medium text-gray-400 mb-1">Amount (€)</label>
									<input
										type="number"
										placeholder="0.00"
										value={formData.amount}
										onChange={e => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
										className="w-full bg-dark-900 border border-dark-600 rounded p-2 text-white focus:border-neon-purple focus:outline-none"
										required
									/>
								</div>
							</div>

							<div className="grid grid-cols-2 gap-4">
								<div>
									<label className="block text-sm font-medium text-gray-400 mb-1">Status</label>
									<select
										value={formData.status}
										onChange={e => setFormData({ ...formData, status: e.target.value as FinanceEntry['status'] })}
										className="w-full bg-dark-900 border border-dark-600 rounded p-2 text-white focus:border-neon-purple focus:outline-none"
									>
										<option value="locked">Locked</option>
										<option value="pending">Pending</option>
										<option value="received">Received</option>
									</select>
								</div>
								<div>
									<label className="block text-sm font-medium text-gray-400 mb-1">Expected Date</label>
									<input
										type="date"
										value={formData.expected_date}
										onChange={e => setFormData({ ...formData, expected_date: e.target.value })}
										className="w-full bg-dark-900 border border-dark-600 rounded p-2 text-white focus:border-neon-purple focus:outline-none"
									/>
								</div>
							</div>

							<div>
								<label className="block text-sm font-medium text-gray-400 mb-1">Unlock Condition / Notes</label>
								<textarea
									placeholder="e.g. Requires 20 CFUs by Feb 2026"
									value={formData.unlock_condition}
									onChange={e => setFormData({ ...formData, unlock_condition: e.target.value })}
									className="w-full bg-dark-900 border border-dark-600 rounded p-2 text-white focus:border-neon-purple focus:outline-none h-20 resize-none"
								/>
							</div>

							<div className="pt-4 flex justify-end gap-3">
								<button
									type="button"
									onClick={() => setIsModalOpen(false)}
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
										<><Save className="w-4 h-4" /> Save</>
									)}
								</button>
							</div>
						</form>
					</div>
				</div>
			)}

			<ConfirmModal
				isOpen={confirmOpen}
				title="Delete Funding Source"
				message="Are you sure you want to delete this funding source? This action cannot be undone."
				confirmText="Delete"
				isDangerous={true}
				onConfirm={confirmDelete}
				onCancel={() => setConfirmOpen(false)}
			/>
		</div>
	);
}
