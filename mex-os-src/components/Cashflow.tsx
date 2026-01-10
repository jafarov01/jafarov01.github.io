import { useState } from 'react';
import { useData } from '../contexts/DataContext';
import {
	Wallet, TrendingUp, Plus, Trash2,
	DollarSign, Calendar, ArrowUpRight, ArrowDownRight,
	PieChart, BarChart3
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachMonthOfInterval, subMonths } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { type Transaction } from '../lib/seedData';

const CATEGORIES = [
	{ value: 'salary', label: 'Salary', color: '#00ff88' },
	{ value: 'freelance', label: 'Freelance', color: '#00ffff' },
	{ value: 'rent', label: 'Rent', color: '#ff3366' },
	{ value: 'utilities', label: 'Utilities', color: '#ff6644' },
	{ value: 'food', label: 'Food', color: '#ffee00' },
	{ value: 'transport', label: 'Transport', color: '#9d00ff' },
	{ value: 'entertainment', label: 'Entertainment', color: '#ff66cc' },
	{ value: 'other', label: 'Other', color: '#666666' }
];

export function Cashflow() {
	const { transactions, addTransaction, deleteTransaction, getMonthlyIncome, getMonthlyExpenses, getNetBalance } = useData();
	const [showAddForm, setShowAddForm] = useState(false);
	const [newTx, setNewTx] = useState<Omit<Transaction, 'id'>>({
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
	const categoryBreakdown = CATEGORIES.map(cat => ({
		...cat,
		amount: transactions
			.filter(tx => tx.category === cat.value && tx.type === 'expense')
			.reduce((sum, tx) => sum + tx.amount, 0)
	})).filter(c => c.amount > 0);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!newTx.description || newTx.amount <= 0) return;
		await addTransaction(newTx);
		setNewTx({
			date: format(new Date(), 'yyyy-MM-dd'),
			description: '',
			amount: 0,
			type: 'expense',
			category: 'other',
			recurring: false
		});
		setShowAddForm(false);
	};

	const getCategoryColor = (cat: string) => CATEGORIES.find(c => c.value === cat)?.color || '#666';

	return (
		<div className="p-6 max-w-7xl mx-auto space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-3xl font-bold text-white flex items-center gap-3">
						<Wallet className="w-8 h-8 text-neon-green" />Cashflow
					</h1>
					<p className="text-gray-500 mt-1">Real Money Movement • {format(now, 'MMMM yyyy')}</p>
				</div>
				<button onClick={() => setShowAddForm(!showAddForm)} className="btn-cyber flex items-center gap-2">
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

			{/* Add Transaction Form */}
			{showAddForm && (
				<form onSubmit={handleSubmit} className="card-cyber p-6">
					<h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
						<Plus className="w-5 h-5" />New Transaction
					</h2>
					<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
						<input type="text" placeholder="Description" value={newTx.description} onChange={e => setNewTx({ ...newTx, description: e.target.value })} className="w-full" required />
						<input type="number" placeholder="Amount" value={newTx.amount || ''} onChange={e => setNewTx({ ...newTx, amount: parseFloat(e.target.value) || 0 })} className="w-full" min="0" step="0.01" required />
						<input type="date" value={newTx.date} onChange={e => setNewTx({ ...newTx, date: e.target.value })} className="w-full" />
						<select value={newTx.type} onChange={e => setNewTx({ ...newTx, type: e.target.value as 'income' | 'expense' })} className="w-full bg-dark-700 border border-dark-600 rounded p-2 text-white">
							<option value="income">Income</option>
							<option value="expense">Expense</option>
						</select>
						<select value={newTx.category} onChange={e => setNewTx({ ...newTx, category: e.target.value as Transaction['category'] })} className="w-full bg-dark-700 border border-dark-600 rounded p-2 text-white">
							{CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
						</select>
						<label className="flex items-center gap-2 text-gray-400">
							<input type="checkbox" checked={newTx.recurring} onChange={e => setNewTx({ ...newTx, recurring: e.target.checked })} className="w-4 h-4" />
							Recurring
						</label>
					</div>
					<div className="flex gap-2 mt-4">
						<button type="submit" className="btn-cyber">Save</button>
						<button type="button" onClick={() => setShowAddForm(false)} className="btn-cyber btn-danger">Cancel</button>
					</div>
				</form>
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
								<tr key={tx.id} className="border-b border-dark-700 hover:bg-dark-700/50">
									<td className="py-3 text-gray-400">{format(new Date(tx.date), 'MMM d')}</td>
									<td className="py-3 text-white">{tx.description} {tx.recurring && <span className="text-xs text-neon-cyan">↻</span>}</td>
									<td className="py-3">
										<span className="px-2 py-1 rounded text-xs" style={{ backgroundColor: getCategoryColor(tx.category) + '22', color: getCategoryColor(tx.category) }}>
											{CATEGORIES.find(c => c.value === tx.category)?.label}
										</span>
									</td>
									<td className={`py-3 text-right font-medium ${tx.type === 'income' ? 'text-neon-green' : 'text-neon-red'}`}>
										{tx.type === 'income' ? '+' : '-'}€{tx.amount.toFixed(2)}
									</td>
									<td className="py-3 text-right">
										<button onClick={() => deleteTransaction(tx.id)} className="p-1 text-gray-500 hover:text-neon-red transition-colors">
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
		</div>
	);
}
