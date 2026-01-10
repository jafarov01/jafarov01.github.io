import { useState } from 'react';
import { useData } from '../contexts/DataContext';
import {
	Wallet, Lock, Unlock, Clock, TrendingUp, AlertTriangle, CheckCircle2,
	Target, Calendar, Plus, X, Trash2, Edit2, Save
} from 'lucide-react';
import { format } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { type FinanceEntry } from '../lib/seedData';

export function Scholarship() {
	const { finances, getUnlockedMoney, getLockedMoney, getPendingMoney, getPassedCFUs, addFinance, updateFinance, deleteFinance } = useData();
	const passedCFUs = getPassedCFUs();
	const totalPotential = finances.reduce((sum, f) => sum + f.amount, 0);

	const [isModalOpen, setIsModalOpen] = useState(false);
	const [editingItem, setEditingItem] = useState<FinanceEntry | null>(null);
	const [formData, setFormData] = useState<Partial<FinanceEntry>>({
		source: 'Regional Scholarship',
		type: 'income',
		amount: 0,
		status: 'pending',
		unlock_condition: '',
		expected_date: ''
	});

	const chartData = finances.map(f => ({
		name: f.id.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
		amount: f.amount,
		status: f.status
	}));

	const getStatusColor = (status: string) => {
		switch (status) {
			case 'received': return '#00ff88';
			case 'pending': return '#ffee00';
			case 'locked': return '#ff3366';
			default: return '#666';
		}
	};

	const resetForm = () => {
		setFormData({
			source: 'Regional Scholarship',
			type: 'income',
			amount: 0,
			status: 'pending',
			unlock_condition: '',
			expected_date: ''
		});
		setEditingItem(null);
	};

	const handleSave = async (e: React.FormEvent) => {
		e.preventDefault();
		try {
			if (editingItem) {
				await updateFinance(editingItem.id, formData);
			} else {
				// Generate a simple ID from source + rand
				const id = `${formData.source?.toLowerCase().replace(/\s+/g, '_')}_${Math.random().toString(36).substr(2, 5)}`;
				await addFinance({ ...formData, id } as Omit<FinanceEntry, 'id'> & { id: string });
			}
			setIsModalOpen(false);
			resetForm();
		} catch (error) {
			console.error('Error saving finance entry:', error);
		}
	};

	const handleDelete = async (id: string) => {
		if (confirm('Are you sure you want to delete this installment?')) {
			await deleteFinance(id);
		}
	};

	const openEditModal = (item: FinanceEntry) => {
		setEditingItem(item);
		setFormData({ ...item });
		setIsModalOpen(true);
	};

	return (
		<div className="p-6 max-w-7xl mx-auto space-y-6">
			<div className="flex justify-between items-center">
				<div>
					<h1 className="text-3xl font-bold text-white flex items-center gap-3">
						<Wallet className="w-8 h-8 text-neon-yellow" />Financial Command
					</h1>
					<p className="text-gray-500 mt-1">Regional Scholarship Tracking</p>
				</div>
				<button
					onClick={() => { resetForm(); setIsModalOpen(true); }}
					className="btn-cyber flex items-center gap-2"
				>
					<Plus className="w-4 h-4" /> Add Installment
				</button>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
				<div className="card-cyber p-6">
					<div className="flex items-center gap-2 text-gray-400 text-sm mb-2"><Unlock className="w-4 h-4 text-neon-green" />AVAILABLE</div>
					<div className="text-3xl font-bold text-neon-green neon-text-green">€{getUnlockedMoney().toFixed(2)}</div>
				</div>
				<div className="card-cyber p-6">
					<div className="flex items-center gap-2 text-gray-400 text-sm mb-2"><Clock className="w-4 h-4 text-neon-yellow" />PENDING</div>
					<div className="text-3xl font-bold text-neon-yellow">€{getPendingMoney().toFixed(2)}</div>
				</div>
				<div className="card-cyber p-6">
					<div className="flex items-center gap-2 text-gray-400 text-sm mb-2"><Lock className="w-4 h-4 text-neon-red" />LOCKED</div>
					<div className="text-3xl font-bold text-neon-red">€{getLockedMoney().toFixed(2)}</div>
				</div>
				<div className="card-cyber p-6">
					<div className="flex items-center gap-2 text-gray-400 text-sm mb-2"><TrendingUp className="w-4 h-4 text-neon-cyan" />TOTAL</div>
					<div className="text-3xl font-bold text-white">€{totalPotential.toFixed(2)}</div>
				</div>
			</div>

			<div className="card-cyber p-6">
				<h2 className="text-lg font-semibold text-white mb-6">Scholarship Breakdown</h2>
				<div className="h-64">
					<ResponsiveContainer width="100%" height="100%">
						<BarChart data={chartData} layout="vertical">
							<XAxis type="number" tickFormatter={(v) => `€${v}`} stroke="#666" />
							<YAxis type="category" dataKey="name" width={120} stroke="#666" tick={{ fill: '#888', fontSize: 12 }} />
							<Tooltip contentStyle={{ backgroundColor: '#1a1a25', border: '1px solid #32324a' }} />
							<Bar dataKey="amount" radius={[0, 4, 4, 0]}>
								{chartData.map((entry, i) => (<Cell key={i} fill={getStatusColor(entry.status)} />))}
							</Bar>
						</BarChart>
					</ResponsiveContainer>
				</div>
			</div>

			<div className="card-cyber p-6">
				<h2 className="text-lg font-semibold text-white mb-6">Installment Details</h2>
				<div className="space-y-4">
					{finances.map(entry => (
						<div key={entry.id} className={`p-4 rounded-lg border ${entry.status === 'received' ? 'bg-neon-green/5 border-neon-green/30' : entry.status === 'locked' ? 'bg-neon-red/5 border-neon-red/30' : 'bg-neon-yellow/5 border-neon-yellow/30'} group relative`}>
							<div className="flex items-start justify-between">
								<div className="flex items-start gap-4">
									{entry.status === 'received' ? <CheckCircle2 className="w-5 h-5 text-neon-green" /> : entry.status === 'locked' ? <Lock className="w-5 h-5 text-neon-red" /> : <Clock className="w-5 h-5 text-neon-yellow" />}
									<div>
										<h3 className="text-lg font-semibold text-white flex items-center gap-2">
											{entry.id.replace(/_/g, ' ')}
											<button onClick={() => openEditModal(entry)} className="text-gray-500 hover:text-white transition-colors opacity-0 group-hover:opacity-100">
												<Edit2 className="w-3 h-3" />
											</button>
										</h3>
										<p className="text-sm text-gray-500">{entry.source}</p>
										<div className="flex items-center gap-4 mt-2 text-sm">
											<span className="text-gray-400"><Calendar className="w-4 h-4 inline mr-1" />{format(new Date(entry.expected_date), 'MMM d, yyyy')}</span>
											<span className={`px-2 py-1 rounded text-xs uppercase ${entry.status === 'received' ? 'bg-neon-green/20 text-neon-green' : entry.status === 'locked' ? 'bg-neon-red/20 text-neon-red' : 'bg-neon-yellow/20 text-neon-yellow'}`}>{entry.status}</span>
										</div>
									</div>
								</div>
								<div className="flex flex-col items-end gap-2">
									<div className={`text-2xl font-bold ${entry.status === 'received' ? 'text-neon-green' : entry.status === 'locked' ? 'text-neon-red' : 'text-neon-yellow'}`}>
										€{entry.amount.toFixed(2)}
									</div>
									<button
										onClick={() => handleDelete(entry.id)}
										className="text-gray-600 hover:text-neon-red transition-colors opacity-0 group-hover:opacity-100"
									>
										<Trash2 className="w-4 h-4" />
									</button>
								</div>
							</div>
							{entry.status !== 'received' && (
								<div className={`mt-4 p-3 rounded ${entry.status === 'locked' ? 'bg-neon-red/10' : 'bg-neon-yellow/10'}`}>
									<div className="flex items-center gap-2">
										<AlertTriangle className="w-4 h-4" />
										<span className="text-sm text-gray-300"><strong>Unlock:</strong> {entry.unlock_condition}</span>
									</div>
									{entry.id === 'installment_2_merit' && <div className="mt-2 text-sm text-gray-400"><Target className="w-4 h-4 inline mr-1" />Progress: {passedCFUs}/20 CFU</div>}
								</div>
							)}
						</div>
					))}
				</div>
			</div>

			{/* Add/Edit Modal */}
			{isModalOpen && (
				<div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
					<div className="bg-dark-800 border border-dark-600 rounded-xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
						<div className="p-6 border-b border-dark-600 flex justify-between items-center">
							<h2 className="text-xl font-bold text-white flex items-center gap-2">
								{editingItem ? <Edit2 className="w-5 h-5 text-neon-cyan" /> : <Plus className="w-5 h-5 text-neon-green" />}
								{editingItem ? 'Edit Installment' : 'Add Installment'}
							</h2>
							<button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white">
								<X className="w-5 h-5" />
							</button>
						</div>
						<form onSubmit={handleSave} className="p-6 space-y-4">
							<div>
								<label className="block text-sm font-medium text-gray-400 mb-1">Source</label>
								<input
									type="text"
									required
									value={formData.source}
									onChange={e => setFormData({ ...formData, source: e.target.value })}
									className="w-full bg-dark-900 border border-dark-600 rounded p-2 text-white focus:border-neon-purple focus:outline-none"
									placeholder="e.g. Regional Scholarship"
								/>
							</div>

							<div className="grid grid-cols-2 gap-4">
								<div>
									<label className="block text-sm font-medium text-gray-400 mb-1">Amount (€)</label>
									<input
										type="number"
										step="0.01"
										required
										value={formData.amount}
										onChange={e => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
										className="w-full bg-dark-900 border border-dark-600 rounded p-2 text-white focus:border-neon-purple focus:outline-none"
									/>
								</div>
								<div>
									<label className="block text-sm font-medium text-gray-400 mb-1">Status</label>
									<select
										value={formData.status}
										onChange={e => setFormData({ ...formData, status: e.target.value as any })}
										className="w-full bg-dark-900 border border-dark-600 rounded p-2 text-white focus:border-neon-purple focus:outline-none"
									>
										<option value="pending">Pending</option>
										<option value="received">Received</option>
										<option value="locked">Locked</option>
									</select>
								</div>
							</div>

							<div>
								<label className="block text-sm font-medium text-gray-400 mb-1">Expected Date</label>
								<input
									type="date"
									required
									value={formData.expected_date}
									onChange={e => setFormData({ ...formData, expected_date: e.target.value })}
									className="w-full bg-dark-900 border border-dark-600 rounded p-2 text-white focus:border-neon-purple focus:outline-none"
								/>
							</div>

							<div>
								<label className="block text-sm font-medium text-gray-400 mb-1">Unlock Condition</label>
								<textarea
									value={formData.unlock_condition}
									onChange={e => setFormData({ ...formData, unlock_condition: e.target.value })}
									className="w-full bg-dark-900 border border-dark-600 rounded p-2 text-white focus:border-neon-purple focus:outline-none h-20 resize-none"
									placeholder="e.g. 20 CFUs needed, Rent payment proof..."
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
									className="btn-cyber flex items-center gap-2"
								>
									<Save className="w-4 h-4" /> Save Installment
								</button>
							</div>
						</form>
					</div>
				</div>
			)}
		</div>
	);
}
