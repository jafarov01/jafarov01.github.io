import { format, subDays, addDays } from 'date-fns';

interface QuickDateSelectorProps {
	onSelect: (date: string) => void;
	currentDate?: string;
}

export function QuickDateSelector({ onSelect, currentDate }: QuickDateSelectorProps) {
	const today = format(new Date(), 'yyyy-MM-dd');
	const yesterday = format(subDays(new Date(), 1), 'yyyy-MM-dd');
	const tomorrow = format(addDays(new Date(), 1), 'yyyy-MM-dd');

	const options = [
		{ label: 'Yesterday', value: yesterday },
		{ label: 'Today', value: today },
		{ label: 'Tomorrow', value: tomorrow }
	];

	return (
		<div className="flex gap-2 mt-2">
			{options.map(opt => (
				<button
					key={opt.value}
					type="button"
					onClick={() => onSelect(opt.value)}
					className={`text-xs px-3 py-1 rounded-full border transition-all ${currentDate === opt.value
							? 'bg-neon-cyan/20 border-neon-cyan/50 text-neon-cyan'
							: 'bg-dark-700 border-dark-600 text-gray-400 hover:border-gray-500 hover:text-white'
						}`}
				>
					{opt.label}
				</button>
			))}
		</div>
	);
}
