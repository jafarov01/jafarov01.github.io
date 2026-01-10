import { useData } from '../contexts/DataContext';
import { Wallet, Lock, Unlock, Clock, TrendingUp, AlertTriangle, CheckCircle2, Target, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export function Finance() {
	const { finances, getUnlockedMoney, getLockedMoney, getPendingMoney, getPassedCFUs } = useData();
	const passedCFUs = getPassedCFUs();
	const totalPotential = finances.reduce((sum, f) => sum + f.amount, 0);

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

	return (
		<div className="p-6 max-w-7xl mx-auto space-y-6">
			<div>
				<h1 className="text-3xl font-bold text-white flex items-center gap-3">
					<Wallet className="w-8 h-8 text-neon-yellow" />Financial Command
				</h1>
				<p className="text-gray-500 mt-1">Regional Scholarship Tracking</p>
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
						<div key={entry.id} className={`p-4 rounded-lg border ${entry.status === 'received' ? 'bg-neon-green/5 border-neon-green/30' : entry.status === 'locked' ? 'bg-neon-red/5 border-neon-red/30' : 'bg-neon-yellow/5 border-neon-yellow/30'}`}>
							<div className="flex items-start justify-between">
								<div className="flex items-start gap-4">
									{entry.status === 'received' ? <CheckCircle2 className="w-5 h-5 text-neon-green" /> : entry.status === 'locked' ? <Lock className="w-5 h-5 text-neon-red" /> : <Clock className="w-5 h-5 text-neon-yellow" />}
									<div>
										<h3 className="text-lg font-semibold text-white">{entry.id.replace(/_/g, ' ')}</h3>
										<p className="text-sm text-gray-500">{entry.source}</p>
										<div className="flex items-center gap-4 mt-2 text-sm">
											<span className="text-gray-400"><Calendar className="w-4 h-4 inline mr-1" />{format(new Date(entry.expected_date), 'MMM d, yyyy')}</span>
											<span className={`px-2 py-1 rounded text-xs uppercase ${entry.status === 'received' ? 'bg-neon-green/20 text-neon-green' : entry.status === 'locked' ? 'bg-neon-red/20 text-neon-red' : 'bg-neon-yellow/20 text-neon-yellow'}`}>{entry.status}</span>
										</div>
									</div>
								</div>
								<div className={`text-2xl font-bold ${entry.status === 'received' ? 'text-neon-green' : entry.status === 'locked' ? 'text-neon-red' : 'text-neon-yellow'}`}>€{entry.amount.toFixed(2)}</div>
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
		</div>
	);
}
