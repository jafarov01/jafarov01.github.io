import { useState, useMemo } from 'react';
import { useData } from '../contexts/DataContext';
import {
	DollarSign,
	TrendingUp,
	TrendingDown,
	Calendar,
	ArrowUpRight,
	ArrowDownLeft,
	Filter,
	Plus,
	Repeat,
	Search,
	Trash2,
	Edit2,
	X,
	Save,
	PieChart,
	Wallet,
	BarChart3
} from 'lucide-react';
import { format, parseISO, startOfMonth, endOfMonth, isWithinInterval, addMonths, isSameMonth, subMonths, eachMonthOfInterval } from 'date-fns';
import { PieChart as RePieChart, Pie, Cell, ResponsiveContainer, Tooltip as ReTooltip, Legend, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import { type Transaction } from '../lib/seedData';
import { ConfirmModal } from './ConfirmModal';
import { QuickDateSelector } from './QuickDateSelector';

const CATEGORY_COLORS: Record<string, string> = {
	salary: '#00ff9d',
	freelance: '#00ccff',
	scholarship: '#bf00ff',
	gift: '#ff00ff',
	refund: '#ffff00',
	other_income: '#ffffff',
	rent: '#ff0055',
	utilities: '#ff5500',
	food: '#ffaa00',
	transport: '#00aaff',
	entertainment: '#aa00ff',
	health: '#ff00aa',
	education: '#00ffaa',
	other_expense: '#aaaaaa'
};

const INCOME_CATEGORIES = [
	{ value: 'salary', label: 'Salary' },
	{ value: 'freelance', label: 'Freelance' },
	{ value: 'scholarship', label: 'Scholarship' },
	{ value: 'gift', label: 'Gift' },
	{ value: 'refund', label: 'Refund' },
	{ value: 'other_income', label: 'Other' }
];

const EXPENSE_CATEGORIES = [
	{ value: 'rent', label: 'Rent' },
	{ value: 'utilities', label: 'Utilities' },
	{ value: 'food', label: 'Food' },
	{ value: 'transport', label: 'Transport' },
	{ value: 'entertainment', label: 'Entertainment' },
	{ value: 'health', label: 'Health' },
	{ value: 'education', label: 'Education' },
	{ value: 'other_expense', label: 'Other' }
];

export function Cashflow() {
	const { transactions, addTransaction, deleteTransaction, updateTransaction } = useData();
	const [filter, setFilter] = useState<'all' | 'income' | 'expense'>('all');
	const [searchTerm, setSearchTerm] = useState('');
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [editingTx, setEditingTx] = useState<Transaction | null>(null);

	// Confirm Modal State
	const [confirmOpen, setConfirmOpen] = useState(false);
	const [deleteId, setDeleteId] = useState<string | null>(null);

	const [formData, setFormData] = useState<Omit<Transaction, 'id'>>({
		date: format(new Date(), 'yyyy-MM-dd'),
		description: '',
		amount: 0,
		type: 'expense',
		category: 'food',
		recurring: false
	});

	// Derived Data
	const currentMonth = new Date();
	const start = startOfMonth(currentMonth);
	const end = endOfMonth(currentMonth);

	const monthlyTransactions = transactions.filter(t =>
		isWithinInterval(parseISO(t.date), { start, end })
	);

	const income = monthlyTransactions
		.filter(t => t.type === 'income')
		.reduce((sum, t) => sum + t.amount, 0);

	const expenses = monthlyTransactions
		.filter(t => t.type === 'expense')
		.reduce((sum, t) => sum + t.amount, 0);

	const balance = income - expenses;
	const savingsRate = income > 0 ? ((income - expenses) / income) * 100 : 0;

	// Chart Data
	const chartData = useMemo(() => {
		const data: { name: string; value: number }[] = [];
		const categories = filter === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
		const typeFilter = filter === 'income' ? 'income' : 'expense';

		categories.forEach(cat => {
			const total = monthlyTransactions
				.filter(t => t.type === typeFilter && t.category === cat.value)
				.reduce((sum, t) => sum + t.amount, 0);

			if (total > 0) {
				data.push({ name: cat.label, value: total });
			}
		});

		return data;
	}, [monthlyTransactions, filter]);

	// History Chart Data
	const historyData = useMemo(() => {
		const end = new Date();
		const start = subMonths(end, 5);
		const months = eachMonthOfInterval({ start, end });

		return months.map(month => {
			const monthTx = transactions.filter(t => isSameMonth(parseISO(t.date), month));
			return {
				month: format(month, 'MMM'),
				income: monthTx.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0),
				expense: monthTx.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0)
			};
		});
	}, [transactions]);

	// Recurring Expenses Projection
	const recurringExpenses = transactions.filter(t => t.recurring && t.type === 'expense');

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!formData.description || formData.amount <= 0) return;

		try {
			if (editingTx) {
				await updateTransaction(editingTx.id, {
					...formData,
					// category safety check
					category: (formData.type === 'income'
						? (INCOME_CATEGORIES.find(c => c.value === formData.category) ? formData.category : 'other_income')
						: (EXPENSE_CATEGORIES.find(c => c.value === formData.category) ? formData.category : 'other_expense')) as any
				});
			} else {
				await addTransaction({
					...formData,
					category: (formData.type === 'income'
						? (INCOME_CATEGORIES.find(c => c.value === formData.category) ? formData.category : 'other_income')
						: (EXPENSE_CATEGORIES.find(c => c.value === formData.category) ? formData.category : 'other_expense')) as any
				});
			}
			setIsModalOpen(false);
			resetForm();
		} catch (error) {
			console.error('Error saving transaction:', error);
		}
	};

	const resetForm = () => {
		setFormData({
			date: format(new Date(), 'yyyy-MM-dd'),
			description: '',
			amount: 0,
			type: 'expense',
			category: 'food',
			recurring: false
		});
		setEditingTx(null);
	};

	const openEditModal = (tx: Transaction) => {
		setEditingTx(tx);
		setFormData(tx);
		setIsModalOpen(true);
	};

	const handleDeleteRequest = (id: string) => {
		setDeleteId(id);
		setConfirmOpen(true);
	};

	const confirmDelete = async () => {
		if (deleteId) {
			await deleteTransaction(deleteId);
			setConfirmOpen(false);
			setDeleteId(null);
		}
	};

	// Filtered List
	const filteredTransactions = transactions
		.filter(t => {
			const matchesFilter = filter === 'all' || t.type === filter;
			const matchesSearch = t.description.toLowerCase().includes(searchTerm.toLowerCase());
			return matchesFilter && matchesSearch;
		})
		.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

	return (
		<div className="p-6 max-w-7xl mx-auto space-y-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-3xl font-bold text-white flex items-center gap-3">
						<Wallet className="w-8 h-8 text-neon-cyan" />
						Cashflow Command
					</h1>
					<p className="text-gray-500 mt-1">Track income, expenses, and burn rate</p>
				</div>
				<button
					onClick={() => { resetForm(); setIsModalOpen(true); }}
					className="btn-cyber flex items-center gap-2"
				>
					<Plus className="w-4 h-4" /> Add Transaction
				</button>
			</div>

			{/* KPI Cards */}
			<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
				<div className="card-cyber p-4">
					<div className="flex items-center gap-2 text-gray-400 mb-2">
						<DollarSign className="w-4 h-4" /> BALANCE
					</div>
					<div className={`text-2xl font-bold ${balance >= 0 ? 'text-white' : 'text-neon-red'}`}>
						€{balance.toFixed(2)}
					</div>
				</div>
				<div className="card-cyber p-4 bg-gradient-to-br from-neon-green/5 to-transparent border-neon-green/20">
					<div className="flex items-center gap-2 text-neon-green mb-2">
						<TrendingUp className="w-4 h-4" /> INCOME
					</div>
					<div className="text-2xl font-bold text-white">
						€{income.toFixed(2)}
					</div>
				</div>
				<div className="card-cyber p-4 bg-gradient-to-br from-neon-red/5 to-transparent border-neon-red/20">
					<div className="flex items-center gap-2 text-neon-red mb-2">
						<TrendingDown className="w-4 h-4" /> EXPENSES
					</div>
					<div className="text-2xl font-bold text-white">
						€{expenses.toFixed(2)}
					</div>
				</div>
				<div className="card-cyber p-4">
					<div className="flex items-center gap-2 text-neon-purple mb-2">
						<PieChart className="w-4 h-4" /> SAVINGS RATE
					</div>
					<div className="text-2xl font-bold text-white">
						{savingsRate.toFixed(1)}%
					</div>
				</div>
			</div>

			{/* Main Content Grid */}
			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				{/* Charts Column */}
				<div className="space-y-6">
					{/* Breakdown Chart */}
					<div className="card-cyber p-6 h-[300px]">
						<div className="flex justify-between items-center mb-4">
							<h3 className="text-lg font-bold text-white flex items-center gap-2">
								<PieChart className="w-5 h-5 text-neon-cyan" /> Breakdown
							</h3>
							<div className="flex gap-2">
								<button
									onClick={() => setFilter('income')}
									className={`text-xs px-2 py-1 rounded ${filter === 'income' ? 'bg-neon-green/20 text-neon-green' : 'text-gray-500'}`}
								>
									In
								</button>
								<button
									onClick={() => setFilter('expense')}
									className={`text-xs px-2 py-1 rounded ${filter === 'expense' ? 'bg-neon-red/20 text-neon-red' : 'text-gray-500'}`}
								>
									Out
								</button>
							</div>
						</div>
						<ResponsiveContainer width="100%" height="100%">
							<RePieChart>
								<Pie
									data={chartData}
									cx="50%"
									cy="50%"
									innerRadius={60}
									outerRadius={80}
									paddingAngle={5}
									dataKey="value"
								>
									{chartData.map((entry, index) => (
										<Cell key={`cell-${index}`} fill={CATEGORY_COLORS[(filter === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES).find(c => c.label === entry.name)?.value || 'other_expense']} />
									))}
								</Pie>
								<ReTooltip
									contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}
									formatter={(value: any) => `€${Number(value).toFixed(2)}`}
								/>
								<Legend />
							</RePieChart>
						</ResponsiveContainer>
					</div>

					{/* 6 Month History */}
					<div className="card-cyber p-6 h-[300px]">
						<h3 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
							<BarChart3 className="w-5 h-5 text-neon-yellow" /> 6 Month Trend
						</h3>
						<ResponsiveContainer width="100%" height="100%">
							<BarChart data={historyData}>
								<XAxis dataKey="month" stroke="#666" fontSize={12} />
								<YAxis stroke="#666" fontSize={12} />
								<Tooltip
									contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}
									cursor={{ fill: '#ffffff10' }}
								/>
								<Bar dataKey="income" fill="#00ff9d" radius={[4, 4, 0, 0]} />
								<Bar dataKey="expense" fill="#ff0055" radius={[4, 4, 0, 0]} />
							</BarChart>
						</ResponsiveContainer>
					</div>

					{/* Recurring Projection */}
					<div className="card-cyber p-6">
						<h3 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
							<Repeat className="w-5 h-5 text-neon-purple" /> Upcoming Recurring
						</h3>
						<div className="space-y-3">
							{recurringExpenses.map(tx => {
								const nextDate = addMonths(parseISO(tx.date), 1); // Simple projection for now
								const isSoon = isWithinInterval(nextDate, { start: new Date(), end: addMonths(new Date(), 1) });

								return (
									<div key={tx.id} className="flex items-center justify-between p-3 rounded bg-dark-700/50 border border-dark-600">
										<div className="flex items-center gap-3">
											<div className={`p-2 rounded-full bg-dark-600 ${isSoon ? 'text-neon-yellow' : 'text-gray-500'}`}>
												<Calendar className="w-4 h-4" />
											</div>
											<div>
												<div className="text-sm font-bold text-white">{tx.description}</div>
												<div className="text-xs text-gray-500">
													Due: {format(nextDate, 'MMM d')}
												</div>
											</div>
										</div>
										<div className="text-right">
											<div className="text-sm font-bold text-white">€{tx.amount}</div>
											<div className="text-[10px] text-gray-500 uppercase">{tx.category}</div>
										</div>
									</div>
								);
							})}
							{recurringExpenses.length === 0 && (
								<p className="text-sm text-gray-500 text-center py-2">No recurring expenses tracked.</p>
							)}
						</div>
					</div>
				</div>

				{/* Transaction List */}
				<div className="lg:col-span-2 card-cyber p-6 flex flex-col h-full">
					<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
						<h3 className="text-lg font-bold text-white flex items-center gap-2">
							<ArrowUpRight className="w-5 h-5 text-neon-cyan" /> Recent Activity
						</h3>
						<div className="flex items-center gap-2 w-full sm:w-auto">
							<div className="relative flex-1 sm:w-64">
								<Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" />
								<input
									type="text"
									placeholder="Search..."
									value={searchTerm}
									onChange={e => setSearchTerm(e.target.value)}
									className="w-full bg-dark-700 border border-dark-600 rounded pl-9 p-2 text-sm text-white focus:border-neon-purple focus:outline-none"
								/>
							</div>
							<div className="flex bg-dark-700 rounded p-1 border border-dark-600">
								<button
									onClick={() => setFilter('all')}
									className={`px-3 py-1 rounded text-xs transition-colors ${filter === 'all' ? 'bg-dark-600 text-white' : 'text-gray-400 hover:text-white'}`}
								>
									All
								</button>
								<button
									onClick={() => setFilter('income')}
									className={`px-3 py-1 rounded text-xs transition-colors ${filter === 'income' ? 'bg-neon-green/10 text-neon-green' : 'text-gray-400 hover:text-white'}`}
								>
									In
								</button>
								<button
									onClick={() => setFilter('expense')}
									className={`px-3 py-1 rounded text-xs transition-colors ${filter === 'expense' ? 'bg-neon-red/10 text-neon-red' : 'text-gray-400 hover:text-white'}`}
								>
									Out
								</button>
							</div>
						</div>
					</div>

					<div className="space-y-3 flex-1 overflow-auto max-h-[600px] pr-2 custom-scrollbar">
						{filteredTransactions.map(tx => (
							<div key={tx.id} className="group flex items-center justify-between p-4 rounded-lg bg-dark-700/30 border border-dark-600 hover:bg-dark-700 transition-colors">
								<div className="flex items-center gap-4">
									<div className={`p-3 rounded-full ${tx.type === 'income' ? 'bg-neon-green/10 text-neon-green' : 'bg-neon-red/10 text-neon-red'
										}`}>
										{tx.type === 'income' ? <ArrowDownLeft className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
									</div>
									<div>
										<div className="text-white font-medium flex items-center gap-2">
											{tx.description}
											{tx.recurring && <Repeat className="w-3 h-3 text-gray-500" />}
										</div>
										<div className="text-xs text-gray-500 mt-1 flex items-center gap-2">
											<Calendar className="w-3 h-3" />
											{format(parseISO(tx.date), 'MMM d, yyyy')}
											<span className="w-1 h-1 rounded-full bg-gray-600" />
											<span className="capitalize" style={{ color: CATEGORY_COLORS[tx.category] || '#fff' }}>
												{tx.category.replace('_', ' ')}
											</span>
										</div>
									</div>
								</div>

								<div className="flex items-center gap-4">
									<div className={`text-lg font-bold ${tx.type === 'income' ? 'text-neon-green' : 'text-white'
										}`}>
										{tx.type === 'income' ? '+' : '-'}€{tx.amount.toFixed(2)}
									</div>
									<div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
										<button
											onClick={() => openEditModal(tx)}
											className="p-1.5 rounded bg-dark-600 hover:bg-neon-cyan/20 text-gray-400 hover:text-neon-cyan"
										>
											<Edit2 className="w-3 h-3" />
										</button>
										<button
											onClick={() => handleDeleteRequest(tx.id)}
											className="p-1.5 rounded bg-dark-600 hover:bg-neon-red/20 text-gray-400 hover:text-neon-red"
										>
											<Trash2 className="w-3 h-3" />
										</button>
									</div>
								</div>
							</div>
						))}
						{filteredTransactions.length === 0 && (
							<div className="text-center py-12 text-gray-500">
								<Filter className="w-8 h-8 mx-auto mb-3 opacity-20" />
								No transactions found matching your criteria
							</div>
						)}
					</div>
				</div>
			</div>

			{/* Add/Edit Modal */}
			{isModalOpen && (
				<div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
					<div className="bg-dark-800 border border-dark-600 rounded-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
						<div className="p-6 border-b border-dark-600 flex justify-between items-center">
							<h2 className="text-xl font-bold text-white flex items-center gap-2">
								{editingTx ? <Edit2 className="w-5 h-5 text-neon-cyan" /> : <Plus className="w-5 h-5 text-neon-green" />}
								{editingTx ? 'Edit Transaction' : 'Add Transaction'}
							</h2>
							<button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white">
								<X className="w-5 h-5" />
							</button>
						</div>
						<form onSubmit={handleSubmit} className="p-6 space-y-4">

							{/* Type Toggle */}
							<div className="flex bg-dark-900 p-1 rounded-lg border border-dark-600">
								<button
									type="button"
									onClick={() => setFormData(p => ({ ...p, type: 'expense', category: 'food' }))}
									className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${formData.type === 'expense'
										? 'bg-neon-red text-dark-900 shadow-lg shadow-neon-red/20'
										: 'text-gray-400 hover:text-white'
										}`}
								>
									Expense
								</button>
								<button
									type="button"
									onClick={() => setFormData(p => ({ ...p, type: 'income', category: 'salary' }))}
									className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${formData.type === 'income'
										? 'bg-neon-green text-dark-900 shadow-lg shadow-neon-green/20'
										: 'text-gray-400 hover:text-white'
										}`}
								>
									Income
								</button>
							</div>

							<div className="grid grid-cols-2 gap-4">
								<div>
									<label className="block text-sm font-medium text-gray-400 mb-1">Date</label>
									<input
										type="date"
										value={formData.date}
										onChange={e => setFormData({ ...formData, date: e.target.value })}
										className="w-full bg-dark-900 border border-dark-600 rounded p-2 text-white focus:border-neon-purple focus:outline-none"
										required
									/>
									<QuickDateSelector
										currentDate={formData.date}
										onSelect={(date) => setFormData({ ...formData, date })}
									/>
								</div>
								<div>
									<label className="block text-sm font-medium text-gray-400 mb-1">Amount (€)</label>
									<div className="relative">
										<DollarSign className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" />
										<input
											type="number"
											step="0.01"
											placeholder="0.00"
											value={formData.amount}
											onChange={e => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
											className="w-full bg-dark-900 border border-dark-600 rounded pl-9 p-2 text-white focus:border-neon-purple focus:outline-none"
											required
										/>
									</div>
								</div>
							</div>

							<div>
								<label className="block text-sm font-medium text-gray-400 mb-1">Category</label>
								<select
									value={formData.category}
									onChange={e => setFormData({ ...formData, category: e.target.value as any })}
									className="w-full bg-dark-900 border border-dark-600 rounded p-2 text-white focus:border-neon-purple focus:outline-none capitalize"
								>
									{(formData.type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES).map(cat => (
										<option key={cat.value} value={cat.value}>{cat.label}</option>
									))}
								</select>
							</div>

							<div>
								<label className="block text-sm font-medium text-gray-400 mb-1">Description</label>
								<input
									type="text"
									placeholder={formData.type === 'income' ? "e.g. October Salary" : "e.g. Grocery Run"}
									value={formData.description}
									onChange={e => setFormData({ ...formData, description: e.target.value })}
									className="w-full bg-dark-900 border border-dark-600 rounded p-2 text-white focus:border-neon-purple focus:outline-none"
									required
								/>
							</div>

							<div className="flex items-center gap-2 pt-2">
								<input
									type="checkbox"
									id="recurring"
									checked={formData.recurring}
									onChange={e => setFormData({ ...formData, recurring: e.target.checked })}
									className="rounded border-dark-600 bg-dark-900 text-neon-purple focus:ring-neon-purple"
								/>
								<label htmlFor="recurring" className="text-sm text-gray-400 flex items-center gap-1 cursor-pointer select-none">
									<Repeat className="w-3 h-3" /> Monthly Recurring
								</label>
							</div>

							<div className="pt-4 flex justify-end gap-3 border-t border-dark-600 mt-4">
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

			<ConfirmModal
				isOpen={confirmOpen}
				title="Delete Transaction"
				message="Are you sure you want to delete this transaction? This action cannot be undone."
				confirmText="Delete"
				isDangerous={true}
				onConfirm={confirmDelete}
				onCancel={() => setConfirmOpen(false)}
			/>
		</div>
	);
}
