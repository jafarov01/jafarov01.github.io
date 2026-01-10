import { useState } from 'react';
import { Plus, Minus, Loader2 } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { useToast } from '../contexts/ToastContext';
import { format } from 'date-fns';

const QUICK_CATEGORIES = {
	expense: [
		{ value: 'food', label: '🍔 Food' },
		{ value: 'transport', label: '🚌 Transport' },
		{ value: 'entertainment', label: '🎬 Fun' },
		{ value: 'utilities', label: '💡 Utilities' },
		{ value: 'other_expense', label: '📦 Other' }
	],
	income: [
		{ value: 'salary', label: '💰 Salary' },
		{ value: 'freelance', label: '💻 Freelance' },
		{ value: 'scholarship', label: '🎓 Scholarship' },
		{ value: 'gift', label: '🎁 Gift' },
		{ value: 'other_income', label: '📦 Other' }
	]
};

const PRESETS = [
	{ label: '☕ Coffee', amount: 3, category: 'food' },
	{ label: '🚌 Tram', amount: 2, category: 'transport' },
	{ label: '🥪 Lunch', amount: 8, category: 'food' },
	{ label: '🛒 Groceries', amount: 30, category: 'food' },
];

export function QuickAddTransaction() {
	const { addTransaction } = useData();
	const { showToast } = useToast();

	const [type, setType] = useState<'income' | 'expense'>('expense');
	const [amount, setAmount] = useState('');
	const [category, setCategory] = useState('food');
	const [description, setDescription] = useState('');
	const [isSaving, setIsSaving] = useState(false);

	const handleSubmit = async (e?: React.FormEvent) => {
		e?.preventDefault();
		if (!amount || parseFloat(amount) <= 0) {
			showToast('Enter an amount', 'warning');
			return;
		}

		setIsSaving(true);
		try {
			await addTransaction({
				date: format(new Date(), 'yyyy-MM-dd'),
				amount: parseFloat(amount),
				type,
				category: category as any,
				description: description || `${type === 'expense' ? 'Expense' : 'Income'} - ${category}`,
				recurring: false
			});
			showToast(`€${amount} ${type} added`, 'success');
			// Reset form
			setAmount('');
			setDescription('');
			// Keep type and category for batch logging
		} catch {
			showToast('Failed to add', 'error');
		} finally {
			setIsSaving(false);
		}
	};

	const quickAddPreset = async (preset: { label: string; amount: number; category: string }) => {
		setIsSaving(true);
		try {
			await addTransaction({
				date: format(new Date(), 'yyyy-MM-dd'),
				amount: preset.amount,
				type: 'expense',
				category: preset.category as any,
				description: preset.label.replace(/^[^\s]+\s/, ''), // Remove emoji
				recurring: false
			});
			showToast(`€${preset.amount} added`, 'success');
		} catch {
			showToast('Failed to add', 'error');
		} finally {
			setIsSaving(false);
		}
	};

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === 'Enter') {
			e.preventDefault();
			handleSubmit();
		}
	};

	return (
		<div className="card-cyber p-4 space-y-3">
			{/* Quick Presets - 1 tap */}
			<div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
				{PRESETS.map(preset => (
					<button
						key={preset.label}
						type="button"
						onClick={() => quickAddPreset(preset)}
						disabled={isSaving}
						className="flex-shrink-0 px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-sm text-gray-300 hover:border-neon-cyan hover:text-white transition-colors disabled:opacity-50"
					>
						{preset.label} €{preset.amount}
					</button>
				))}
			</div>

			{/* Separator */}
			<div className="flex items-center gap-3 text-xs text-gray-600">
				<div className="flex-1 h-px bg-dark-600"></div>
				<span>or custom</span>
				<div className="flex-1 h-px bg-dark-600"></div>
			</div>

			{/* Quick Add Form */}
			<form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
				{/* Type Toggle */}
				<div className="flex bg-dark-700 rounded-lg p-1 border border-dark-600 sm:w-auto">
					<button
						type="button"
						onClick={() => { setType('expense'); setCategory('food'); }}
						className={`flex-1 sm:flex-none px-3 py-2 rounded text-sm font-medium flex items-center justify-center gap-1 transition-all ${type === 'expense'
							? 'bg-neon-red/20 text-neon-red'
							: 'text-gray-500 hover:text-gray-300'
							}`}
					>
						<Minus className="w-4 h-4" /> Out
					</button>
					<button
						type="button"
						onClick={() => { setType('income'); setCategory('salary'); }}
						className={`flex-1 sm:flex-none px-3 py-2 rounded text-sm font-medium flex items-center justify-center gap-1 transition-all ${type === 'income'
							? 'bg-neon-green/20 text-neon-green'
							: 'text-gray-500 hover:text-gray-300'
							}`}
					>
						<Plus className="w-4 h-4" /> In
					</button>
				</div>

				{/* Amount + Category */}
				<div className="flex gap-2 flex-1">
					<div className="relative flex-1 sm:max-w-[140px]">
						<span className="absolute left-3 top-2.5 text-gray-500">€</span>
						<input
							type="number"
							step="0.01"
							placeholder="0.00"
							value={amount}
							onChange={e => setAmount(e.target.value)}
							onKeyDown={handleKeyDown}
							className="w-full bg-dark-700 border border-dark-600 rounded-lg pl-7 pr-3 py-2 text-white focus:border-neon-cyan focus:outline-none text-lg font-mono"
						/>
					</div>

					<select
						value={category}
						onChange={e => setCategory(e.target.value)}
						className="bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-white text-sm focus:border-neon-cyan focus:outline-none flex-1 sm:flex-none sm:w-[130px]"
					>
						{QUICK_CATEGORIES[type].map(cat => (
							<option key={cat.value} value={cat.value}>{cat.label}</option>
						))}
					</select>
				</div>

				{/* Description + Submit */}
				<div className="flex gap-2 flex-1">
					<input
						type="text"
						placeholder="Description (optional)"
						value={description}
						onChange={e => setDescription(e.target.value)}
						onKeyDown={handleKeyDown}
						className="flex-1 bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-white text-sm focus:border-neon-cyan focus:outline-none"
					/>

					<button
						type="submit"
						disabled={isSaving || !amount}
						className="btn-cyber px-4 py-2 flex items-center gap-2 disabled:opacity-50"
					>
						{isSaving ? (
							<Loader2 className="w-4 h-4 animate-spin" />
						) : (
							<>
								<Plus className="w-4 h-4" />
								<span className="hidden sm:inline">Add</span>
							</>
						)}
					</button>
				</div>
			</form>
		</div>
	);
}
