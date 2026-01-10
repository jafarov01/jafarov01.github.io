import { NavLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import {
	Terminal,
	LayoutDashboard,
	GraduationCap,
	Wallet,
	Activity,
	LogOut,
	AlertTriangle
} from 'lucide-react';

const navItems = [
	{ to: '/', icon: LayoutDashboard, label: 'Cockpit' },
	{ to: '/academics', icon: GraduationCap, label: 'Academics' },
	{ to: '/finance', icon: Wallet, label: 'Finance' },
	{ to: '/habits', icon: Activity, label: 'Protocol' },
];

export function Navigation() {
	const { signOut } = useAuth();
	const { getGlobalStatus, profile } = useData();
	const status = getGlobalStatus();

	const statusColors = {
		green: 'bg-neon-green',
		yellow: 'bg-neon-yellow',
		red: 'bg-neon-red'
	};

	const statusText = {
		green: 'ALL SYSTEMS GO',
		yellow: 'CAUTION',
		red: 'CRITICAL'
	};

	return (
		<nav className="bg-dark-800 border-b border-dark-600">
			<div className="max-w-7xl mx-auto px-4">
				<div className="flex items-center justify-between h-16">
					{/* Logo */}
					<div className="flex items-center gap-3">
						<div className="w-10 h-10 rounded-lg bg-dark-700 border border-neon-green/30 flex items-center justify-center">
							<Terminal className="w-5 h-5 text-neon-green" />
						</div>
						<div>
							<h1 className="text-lg font-bold text-white">
								<span className="neon-text-green">MEX</span>{' '}
								<span className="text-gray-400">OS</span>
							</h1>
							<div className="flex items-center gap-2 text-xs">
								<span className={`w-2 h-2 rounded-full ${statusColors[status]} animate-pulse`} />
								<span className={`
                  ${status === 'green' ? 'text-neon-green' : ''}
                  ${status === 'yellow' ? 'text-neon-yellow' : ''}
                  ${status === 'red' ? 'text-neon-red' : ''}
                `}>
									{statusText[status]}
								</span>
							</div>
						</div>
					</div>

					{/* Nav links */}
					<div className="flex items-center gap-1">
						{navItems.map(({ to, icon: Icon, label }) => (
							<NavLink
								key={to}
								to={to}
								className={({ isActive }) => `
                  flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all
                  ${isActive
										? 'bg-neon-green/10 text-neon-green border border-neon-green/30'
										: 'text-gray-400 hover:text-white hover:bg-dark-700'}
                `}
							>
								<Icon className="w-4 h-4" />
								<span className="hidden md:inline">{label}</span>
							</NavLink>
						))}
					</div>

					{/* User info and logout */}
					<div className="flex items-center gap-4">
						{profile?.visa_expiry.includes('WARNING') && (
							<div className="flex items-center gap-1 text-neon-red text-xs">
								<AlertTriangle className="w-4 h-4 animate-pulse" />
								<span className="hidden md:inline">VISA WARNING</span>
							</div>
						)}
						<div className="text-right hidden md:block">
							<div className="text-sm text-white">{profile?.name}</div>
							<div className="text-xs text-gray-500">ID: {profile?.unipd_id}</div>
						</div>
						<button
							onClick={signOut}
							className="p-2 rounded-lg text-gray-400 hover:text-neon-red hover:bg-dark-700 transition-all"
							title="Logout"
						>
							<LogOut className="w-5 h-5" />
						</button>
					</div>
				</div>
			</div>
		</nav>
	);
}
