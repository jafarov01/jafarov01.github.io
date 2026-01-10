import { useState, useMemo } from 'react';
import { useData } from '../contexts/DataContext';
import {
	Wallet, TrendingUp, Plus, Trash2, Edit2, Save, X,
	DollarSign, Calendar, ArrowUpRight, ArrowDownRight,
	PieChart, BarChart3, Repeat
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachMonthOfInterval, subMonths, addMonths, isAfter, isSameMonth } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { type Transaction } from '../lib/seedData';

const INCOME_CATEGORIES = [
	{ value: 'salary', label: 'Salary', color: '#00ff88' },
	{ value: 'freelance', label: 'Freelance', color: '#00ffff' },
	{ value: 'scholarship', label: 'Scholarship', color: '#00ccff' },
	{ value: 'gift', label: 'Gift', color: '#ff66cc' },
	{ value: 'other', label: 'Other', color: '#666666' }
];

const EXPENSE_CATEGORIES = [
	{ value: 'rent', label: 'Rent', color: '#ff3366' },
	{ value: 'utilities', label: 'Utilities', color: '#ff6644' },
	{ value: 'food', label: 'Food', color: '#ffee00' },
	{ value: 'transport', label: 'Transport', color: '#9d00ff' },
	{ value: 'entertainment', label: 'Entertainment', color: '#ff66cc' },
	{ value: 'health', label: 'Health', color: '#ff3333' },
	{ value: 'education', label: 'Education', color: '#3366ff' },
	{ value: 'other', label: 'Other', color: '#666666' }
];

export function Cashflow() {
	const { transactions, addTransaction, updateTransaction, deleteTransaction, getMonthlyIncome, getMonthlyExpenses, getNetBalance } = useData();

	const [isModalOpen, setIsModalOpen] = useState(false);
	const [editingTx, setEditingTx] = useState<Transaction | null>(null);
	const [formData, setFormData] = useState<Omit<Transaction, 'id'>>({
		date: format(new Date(), 'yyyy-MM-dd'),
		description: '',
		amount: 0,
		type: 'expense',
		category: 'other',
		recurring: false
	});

	const now = new Date();
	const currentMonth = now.getMonth();
	const currentYear = now.getFullYear();

	const monthlyIncome = getMonthlyIncome(currentYear, currentMonth);
	const monthlyExpenses = getMonthlyExpenses(currentYear, currentMonth);
	const netBalance = getNetBalance();
	const monthlyNet = monthlyIncome - monthlyExpenses;

	// Recurring Expenses Projection
	const upcomingRecurring = useMemo(() => {
		return transactions
			.filter(tx => tx.recurring && tx.type === 'expense')
			.map(tx => {
				const txDate = new Date(tx.date);
				let nextDate = new Date(txDate);
				// Find next occurrence after today
				while (!isAfter(nextDate, now) && !isSameMonth(nextDate, now)) {
					nextDate = addMonths(nextDate, 1);
				}
				// If strictly in regular monthly cycle, just project to next month if passed this month
				if (new Date(tx.date).getDate() < now.getDate()) {
					nextDate = addMonths(now, 1);
					nextDate.setDate(new Date(tx.date).getDate());
				} else {
					nextDate = new Date(now);
					nextDate.setDate(new Date(tx.date).getDate());
				}

				return {
					...tx,
					nextDate
				};
			})
			.sort((a, b) => a.nextDate.getTime() - b.nextDate.getTime())
			.slice(0, 3);
	}, [transactions]);

	// Chart data for last 6 months
	const last6Months = eachMonthOfInterval({
		start: subMonths(startOfMonth(now), 5),
		end: endOfMonth(now)
	});

	const chartData = last6Months.map(month => ({
		name: format(month, 'MMM'),
		income: getMonthlyIncome(month.getFullYear(), month.getMonth()),
		expenses: getMonthlyExpenses(month.getFullYear(), month.getMonth())
	}));

	// Category breakdown
	const activeCategories = formData.type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
	const categoryBreakdown = EXPENSE_CATEGORIES.map(cat => ({
		...cat,
		amount: transactions
			.filter(tx => tx.category === cat.value && tx.type === 'expense')
			.reduce((sum, tx) => sum + tx.amount, 0)
	})).filter(c => c.amount > 0);

	const resetForm = () => {
		setFormData({
			date: format(new Date(), 'yyyy-MM-dd'),
			description: '',
			amount: 0,
			type: 'expense',
			category: 'other',
			recurring: false
		});
		setEditingTx(null);
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!formData.description || formData.amount <= 0) return;

		try {
			if (editingTx) {
				await updateTransaction(editingTx.id, formData);
			} else {
				await addTransaction(formData);
			}
			setIsModalOpen(false);
			resetForm();
		} catch (error) {
			console.error('Error saving transaction:', error);
		}
	};

	const handleDelete = async (id: string) => {
		if (confirm('Are you sure you want to delete this transaction?')) {
			await deleteTransaction(id);
		}
	};

	const openEditModal = (tx: Transaction) => {
		setEditingTx(tx);
		setFormData(tx);
		setIsModalOpen(true);
	};

	const handleTypeChange = (type: 'income' | 'expense') => {
		const newCategories = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
		setFormData(prev => ({
			...prev,
			type,
			category: newCategories[0].value as Transaction['category'] // Reset category to valid value
		}));
	};

	const getCategoryColor = (cat: string, type: 'income' | 'expense') => {
		const cats = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
		return cats.find(c => c.value === cat)?.color || '#666';
	};

	const getCategoryLabel = (cat: string, type: 'income' | 'expense') => {
		const cats = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
		return cats.find(c => c.value === cat)?.label || cat;
	};

	return (
		<div className="p-6 max-w-7xl mx-auto space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-3xl font-bold text-white flex items-center gap-3">
						<Wallet className="w-8 h-8 text-neon-green" />Cashflow
					</h1>
					<p className="text-gray-500 mt-1">Real Money Movement • {format(now, 'MMMM yyyy')}</p>
				</div>
				<button
					onClick={() => { resetForm(); setIsModalOpen(true); }}
					className="btn-cyber flex items-center gap-2"
				>
					<Plus className="w-4 h-4" /> Add Transaction
				</button>
			</div>

			{/* Summary Cards */}
			<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
				<div className="card-cyber p-4">
					<div className="flex items-center gap-2 text-gray-400 text-sm mb-2">
						<ArrowUpRight className="w-4 h-4 text-neon-green" />MONTHLY INCOME
					</div>
					<div className="text-3xl font-bold text-neon-green">€{monthlyIncome.toFixed(2)}</div>
				</div>
				<div className="card-cyber p-4">
					<div className="flex items-center gap-2 text-gray-400 text-sm mb-2">
						<ArrowDownRight className="w-4 h-4 text-neon-red" />MONTHLY EXPENSES
					</div>
					<div className="text-3xl font-bold text-neon-red">€{monthlyExpenses.toFixed(2)}</div>
				</div>
				<div className="card-cyber p-4">
					<div className="flex items-center gap-2 text-gray-400 text-sm mb-2">
						<TrendingUp className="w-4 h-4 text-neon-cyan" />MONTHLY NET
					</div>
					<div className={`text-3xl font-bold ${monthlyNet >= 0 ? 'text-neon-green' : 'text-neon-red'}`}>
						{monthlyNet >= 0 ? '+' : ''}€{monthlyNet.toFixed(2)}
					</div>
				</div>
				<div className="card-cyber p-4">
					<div className="flex items-center gap-2 text-gray-400 text-sm mb-2">
						<DollarSign className="w-4 h-4 text-neon-yellow" />TOTAL BALANCE
					</div>
					<div className={`text-3xl font-bold ${netBalance >= 0 ? 'text-neon-green' : 'text-neon-red'}`}>
						€{netBalance.toFixed(2)}
					</div>
				</div>
			</div>

			{/* Upcoming Recurring */}
			{upcomingRecurring.length > 0 && (
				<div className="card-cyber p-6 bg-gradient-to-r from-dark-800 to-dark-700/50">
					<h2 className="text-sm font-semibold text-gray-400 uppercase mb-4 flex items-center gap-2">
						<Repeat className="w-4 h-4 text-neon-cyan" /> Upcoming Recurring Expenses
					</h2>
					<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
						{upcomingRecurring.map(tx => (
							<div key={tx.id} className="flex items-center justify-between p-3 rounded bg-dark-900/50 border border-dark-600">
								<div>
									<div className="text-white font-medium">{tx.description}</div>
									<div className="text-xs text-neon-cyan mt-1">Due {format(tx.nextDate, 'MMM d')}</div>
								</div>
								<div className="text-neon-red font-mono">-€{tx.amount.toFixed(0)}</div>
							</div>
						))}
					</div>
				</div>
			)}

			{/* Charts Row */}
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				{/* Income vs Expenses Chart */}
				<div className="card-cyber p-6">
					<h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
						<BarChart3 className="w-5 h-5 text-neon-cyan" />6-Month Overview
					</h2>
					<div className="h-64">
						<ResponsiveContainer width="100%" height="100%">
							<BarChart data={chartData}>
								<XAxis dataKey="name" stroke="#666" />
								<YAxis stroke="#666" tickFormatter={v => `€${v}`} />
								<Tooltip contentStyle={{ backgroundColor: '#1a1a25', border: '1px solid #32324a' }} formatter={(value) => `€${Number(value).toFixed(2)}`} />
								<Legend />
								<Bar dataKey="income" name="Income" fill="#00ff88" radius={[4, 4, 0, 0]} />
								<Bar dataKey="expenses" name="Expenses" fill="#ff3366" radius={[4, 4, 0, 0]} />
							</BarChart>
						</ResponsiveContainer>
					</div>
				</div>

				{/* Category Breakdown */}
				<div className="card-cyber p-6">
					<h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
						<PieChart className="w-5 h-5 text-neon-purple" />Expense Categories
					</h2>
					<div className="space-y-3">
						{categoryBreakdown.length === 0 ? (
							<p className="text-gray-500">No expenses recorded</p>
						) : (
							categoryBreakdown.map(cat => (
								<div key={cat.value} className="flex items-center justify-between">
									<div className="flex items-center gap-2">
										<div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
										<span className="text-gray-300">{cat.label}</span>
									</div>
									<span className="font-medium text-white">€{cat.amount.toFixed(2)}</span>
								</div>
							))
						)}
					</div>
				</div>
			</div>

			{/* Transactions Table */}
			<div className="card-cyber p-6">
				<h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
					<Calendar className="w-5 h-5" />Recent Transactions
				</h2>
				<div className="overflow-x-auto">
					<table className="w-full">
						<thead>
							<tr className="text-left text-gray-500 text-sm border-b border-dark-600">
								<th className="pb-3">Date</th>
								<th className="pb-3">Description</th>
								<th className="pb-3">Category</th>
								<th className="pb-3 text-right">Amount</th>
								<th className="pb-3"></th>
							</tr>
						</thead>
						<tbody>
							{transactions.slice(0, 20).map(tx => (
								<tr key={tx.id} className="border-b border-dark-700 hover:bg-dark-700/50 group">
									<td className="py-3 text-gray-400">{format(new Date(tx.date), 'MMM d')}</td>
									<td className="py-3 text-white">
										<div className="flex items-center gap-2">
											{tx.description}
											{tx.recurring && <Repeat className="w-3 h-3 text-neon-cyan" />}
											<button onClick={() => openEditModal(tx)} className="text-gray-500 hover:text-white transition-colors opacity-0 group-hover:opacity-100">
												<Edit2 className="w-3 h-3" />
											</button>
										</div>
									</td>
									<td className="py-3">
										<span className="px-2 py-1 rounded text-xs" style={{ backgroundColor: getCategoryColor(tx.category, tx.type) + '22', color: getCategoryColor(tx.category, tx.type) }}>
											{getCategoryLabel(tx.category, tx.type)}
										</span>
									</td>
									<td className={`py-3 text-right font-medium ${tx.type === 'income' ? 'text-neon-green' : 'text-neon-red'}`}>
										{tx.type === 'income' ? '+' : '-'}€{tx.amount.toFixed(2)}
									</td>
									<td className="py-3 text-right">
										<button onClick={() => handleDelete(tx.id)} className="p-1 text-gray-500 hover:text-neon-red transition-colors opacity-0 group-hover:opacity-100">
											<Trash2 className="w-4 h-4" />
										</button>
									</td>
								</tr>
							))}
						</tbody>
					</table>
					{transactions.length === 0 && <p className="text-center text-gray-500 py-8">No transactions yet</p>}
				</div>
			</div>

			{/* Add/Edit Modal */}
			{isModalOpen && (
				<div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
					<div className="bg-dark-800 border border-dark-600 rounded-xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
						<div className="p-6 border-b border-dark-600 flex justify-between items-center">
							<h2 className="text-xl font-bold text-white flex items-center gap-2">
								{editingTx ? <Edit2 className="w-5 h-5 text-neon-cyan" /> : <Plus className="w-5 h-5 text-neon-green" />}
								{editingTx ? 'Edit Transaction' : 'New Transaction'}
							</h2>
							<button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white">
								<X className="w-5 h-5" />
							</button>
						</div>
						<form onSubmit={handleSubmit} className="p-6 space-y-4">
							<div className="grid grid-cols-2 gap-4">
								<div>
									<label className="block text-sm font-medium text-gray-400 mb-1">Type</label>
									<select
										value={formData.type}
										onChange={e => handleTypeChange(e.target.value as 'income' | 'expense')}
										className="w-full bg-dark-900 border border-dark-600 rounded p-2 text-white focus:border-neon-purple focus:outline-none"
									>
										<option value="income">Income</option>
										<option value="expense">Expense</option>
									</select>
								</div>
								<div>
									<label className="block text-sm font-medium text-gray-400 mb-1">Date</label>
									<input
										type="date"
										value={formData.date}
										onChange={e => setFormData({ ...formData, date: e.target.value })}
										className="w-full bg-dark-900 border border-dark-600 rounded p-2 text-white focus:border-neon-purple focus:outline-none"
									/>
								</div>
							</div>

							<div>
								<label className="block text-sm font-medium text-gray-400 mb-1">Description</label>
								<input
									type="text"
									placeholder="e.g. Grocery Run"
									value={formData.description}
									onChange={e => setFormData({ ...formData, description: e.target.value })}
									className="w-full bg-dark-900 border border-dark-600 rounded p-2 text-white focus:border-neon-purple focus:outline-none"
									required
								/>
							</div>

							<div className="grid grid-cols-2 gap-4">
								<div>
									<label className="block text-sm font-medium text-gray-400 mb-1">Amount (€)</label>
									<input
										type="number"
										placeholder="0.00"
										value={formData.amount || ''}
										onChange={e => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
										className="w-full bg-dark-900 border border-dark-600 rounded p-2 text-white focus:border-neon-purple focus:outline-none"
										min="0"
										step="0.01"
										required
									/>
								</div>
								<div>
									<label className="block text-sm font-medium text-gray-400 mb-1">Category</label>
									<select
										value={formData.category}
										onChange={e => setFormData({ ...formData, category: e.target.value as Transaction['category'] })}
										className="w-full bg-dark-900 border border-dark-600 rounded p-2 text-white focus:border-neon-purple focus:outline-none"
									>
										{activeCategories.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
									</select>
								</div>
							</div>

							<div className="flex items-center gap-2 pt-2">
								<input
									type="checkbox"
									id="recurring"
									checked={formData.recurring}
									onChange={e => setFormData({ ...formData, recurring: e.target.checked })}
									className="w-4 h-4 rounded border-dark-600 bg-dark-900 text-neon-purple focus:ring-neon-purple"
								/>
								<label htmlFor="recurring" className="text-sm font-medium text-white cursor-pointer select-none">
									Recurring Monthly
								</label>
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
									<Save className="w-4 h-4" /> Save Transaction
								</button>
							</div>
						</form>
					</div>
				</div>
			)}
		</div>
	);
}
