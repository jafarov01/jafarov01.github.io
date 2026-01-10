import { useData } from '../contexts/DataContext';
import {
	Shield, AlertTriangle, CheckCircle2, Clock,
	FileWarning, Calendar, AlertOctagon, Info
} from 'lucide-react';
import { format, differenceInDays } from 'date-fns';

const STATUS_CONFIG = {
	valid: { color: 'text-neon-green', bg: 'bg-neon-green/10', border: 'border-neon-green/30', icon: CheckCircle2, label: 'VALID' },
	expiring_soon: { color: 'text-neon-yellow', bg: 'bg-neon-yellow/10', border: 'border-neon-yellow/30', icon: Clock, label: 'EXPIRING SOON' },
	expired: { color: 'text-neon-red', bg: 'bg-neon-red/10', border: 'border-neon-red/30', icon: AlertOctagon, label: 'EXPIRED' },
	pending: { color: 'text-neon-cyan', bg: 'bg-neon-cyan/10', border: 'border-neon-cyan/30', icon: Clock, label: 'PENDING' },
	unknown: { color: 'text-neon-red', bg: 'bg-neon-red/10', border: 'border-neon-red/30', icon: FileWarning, label: 'UNKNOWN' }
};

export function Bureaucracy() {
	const { bureaucracy, profile, updateBureaucracy } = useData();

	const criticalItems = bureaucracy.filter(doc => doc.is_critical);
	const otherItems = bureaucracy.filter(doc => !doc.is_critical);

	const getStatusConfig = (status: keyof typeof STATUS_CONFIG) => STATUS_CONFIG[status] || STATUS_CONFIG.unknown;

	const getDaysUntilExpiry = (expiryDate?: string) => {
		if (!expiryDate) return null;
		return differenceInDays(new Date(expiryDate), new Date());
	};

	const handleStatusChange = async (docId: string, newStatus: string) => {
		await updateBureaucracy(docId, { status: newStatus as any });
	};

	return (
		<div className="p-6 max-w-7xl mx-auto space-y-6">
			<div>
				<h1 className="text-3xl font-bold text-white flex items-center gap-3">
					<Shield className="w-8 h-8 text-neon-purple" />Bureaucracy
				</h1>
				<p className="text-gray-500 mt-1">Legal Status • Permits • Deadlines</p>
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
								<div key={doc.id} className={`p-4 rounded-lg border ${config.border} ${config.bg}`}>
									<div className="flex items-start justify-between">
										<div className="flex items-start gap-4">
											<StatusIcon className={`w-6 h-6 ${config.color} mt-1`} />
											<div>
												<h3 className="text-lg font-semibold text-white">{doc.name}</h3>
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
											<span className={`px-3 py-1 rounded text-xs font-medium ${config.bg} ${config.color} border ${config.border}`}>
												{config.label}
											</span>
											<select
												value={doc.status}
												onChange={(e) => handleStatusChange(doc.id, e.target.value)}
												className="bg-dark-700 border border-dark-600 rounded px-2 py-1 text-xs text-gray-400"
											>
												<option value="valid">Valid</option>
												<option value="expiring_soon">Expiring Soon</option>
												<option value="expired">Expired</option>
												<option value="pending">Pending</option>
												<option value="unknown">Unknown</option>
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
								<div key={doc.id} className="p-3 rounded-lg bg-dark-700 border border-dark-600 flex items-center justify-between">
									<div className="flex items-center gap-3">
										<StatusIcon className={`w-5 h-5 ${config.color}`} />
										<div>
											<span className="text-white font-medium">{doc.name}</span>
											<span className="text-gray-500 text-sm ml-2">({doc.type.replace('_', ' ')})</span>
										</div>
									</div>
									<div className="flex items-center gap-2">
										<span className={`px-2 py-1 rounded text-xs ${config.bg} ${config.color}`}>{config.label}</span>
										<select
											value={doc.status}
											onChange={(e) => handleStatusChange(doc.id, e.target.value)}
											className="bg-dark-600 border border-dark-500 rounded px-2 py-1 text-xs text-gray-400"
										>
											<option value="valid">Valid</option>
											<option value="expiring_soon">Expiring Soon</option>
											<option value="expired">Expired</option>
											<option value="pending">Pending</option>
											<option value="unknown">Unknown</option>
										</select>
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
		</div>
	);
}
