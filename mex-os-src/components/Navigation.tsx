import { NavLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import {
	Terminal, LogOut, BookOpen, Wallet, Activity,
	GraduationCap, Shield, DollarSign, ChevronDown,
	Briefcase, Target, Crosshair
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';

export function Navigation() {
	const { user, signOut } = useAuth();
	const { profile, getGlobalStatus, bureaucracy } = useData();
	const [financeOpen, setFinanceOpen] = useState(false);
	const financeDropdownRef = useRef<HTMLDivElement>(null);

	// Close dropdown on click outside
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (financeDropdownRef.current && !financeDropdownRef.current.contains(event.target as Node)) {
				setFinanceOpen(false);
			}
		};

		if (financeOpen) {
			document.addEventListener('mousedown', handleClickOutside);
		}

		return () => {
			document.removeEventListener('mousedown', handleClickOutside);
		};
	}, [financeOpen]);

	const globalStatus = getGlobalStatus();

	const statusColors = {
		green: 'bg-neon-green',
		yellow: 'bg-neon-yellow',
		red: 'bg-neon-red animate-pulse'
	};

	const criticalBureaucracy = bureaucracy.filter(d => d.is_critical && (d.status === 'unknown' || d.status === 'expired')).length;

	const baseNavLink = "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all";
	const activeClass = "bg-dark-600 text-white";
	const inactiveClass = "text-gray-400 hover:text-white hover:bg-dark-700";

	return (
		<nav className="bg-dark-800 border-b border-dark-600 sticky top-0 z-50">
			<div className="max-w-7xl mx-auto px-4">
				<div className="flex items-center justify-between h-16">
					{/* Logo + Status */}
					<div className="flex items-center gap-4">
						<NavLink to="/" className="flex items-center gap-2">
							<div className="w-10 h-10 rounded-lg bg-dark-700 border border-neon-green/30 flex items-center justify-center neon-border-green">
								<Terminal className="w-5 h-5 text-neon-green" />
							</div>
							<span className="text-xl font-bold">
								<span className="text-white">MEX</span>
								<span className="text-gray-500">OS</span>
							</span>
						</NavLink>
						<div className="flex items-center gap-2 px-3 py-1 rounded-full bg-dark-700 border border-dark-600">
							<span className={`w-2 h-2 rounded-full ${statusColors[globalStatus]}`} />
							<span className="text-xs text-gray-400 uppercase">{globalStatus}</span>
						</div>
					</div>

					{/* Domain Navigation - Grouped with separators */}
					<div className="hidden md:flex items-center">
						{/* Group 1: Academic & Finance */}
						<div className="flex items-center gap-1">
							<NavLink to="/academics" className={({ isActive }) => `${baseNavLink} ${isActive ? activeClass : inactiveClass}`}>
								<GraduationCap className="w-4 h-4" />Academics
							</NavLink>

							{/* Finance Dropdown */}
							<div className="relative" ref={financeDropdownRef}>
								<button
									onClick={() => setFinanceOpen(!financeOpen)}
									className={`${baseNavLink} ${inactiveClass}`}
								>
									<Wallet className="w-4 h-4" />Finance
									<ChevronDown className={`w-3 h-3 transition-transform ${financeOpen ? 'rotate-180' : ''}`} />
								</button>
								{financeOpen && (
									<div className="absolute top-full left-0 mt-1 w-48 bg-dark-700 border border-dark-600 rounded-lg shadow-xl py-1 z-50">
										<NavLink
											to="/cashflow"
											onClick={() => setFinanceOpen(false)}
											className={({ isActive }) => `block px-4 py-2 text-sm ${isActive ? 'text-white bg-dark-600' : 'text-gray-400 hover:text-white hover:bg-dark-600'}`}
										>
											<div className="flex items-center gap-2">
												<DollarSign className="w-4 h-4" />Cashflow
											</div>
										</NavLink>
										<NavLink
											to="/funding"
											onClick={() => setFinanceOpen(false)}
											className={({ isActive }) => `block px-4 py-2 text-sm ${isActive ? 'text-white bg-dark-600' : 'text-gray-400 hover:text-white hover:bg-dark-600'}`}
										>
											<div className="flex items-center gap-2">
												<GraduationCap className="w-4 h-4" />Funding
											</div>
										</NavLink>
									</div>
								)}
							</div>
						</div>

						{/* Separator */}
						<div className="h-6 w-px bg-dark-600 mx-2" />

						{/* Group 2: Life Management */}
						<div className="flex items-center gap-1">
							<NavLink to="/bureaucracy" className={({ isActive }) => `${baseNavLink} ${isActive ? activeClass : inactiveClass} relative`}>
								<Shield className="w-4 h-4" />Bureaucracy
								{criticalBureaucracy > 0 && (
									<span className="absolute -top-1 -right-1 w-4 h-4 bg-neon-red text-dark-900 text-xs rounded-full flex items-center justify-center font-bold animate-pulse">
										{criticalBureaucracy}
									</span>
								)}
							</NavLink>

							<NavLink to="/habits" className={({ isActive }) => `${baseNavLink} ${isActive ? activeClass : inactiveClass}`}>
								<Activity className="w-4 h-4" />Protocol
							</NavLink>

							<NavLink to="/skills" className={({ isActive }) => `${baseNavLink} ${isActive ? activeClass : inactiveClass}`}>
								<Crosshair className="w-4 h-4" />Skills
							</NavLink>
						</div>

						{/* Separator */}
						<div className="h-6 w-px bg-dark-600 mx-2" />

						{/* Group 3: Career & Strategy */}
						<div className="flex items-center gap-1">
							<NavLink to="/career" className={({ isActive }) => `${baseNavLink} ${isActive ? activeClass : inactiveClass}`}>
								<Briefcase className="w-4 h-4" />Career
							</NavLink>

							<NavLink to="/strategy" className={({ isActive }) => `${baseNavLink} ${isActive ? activeClass : inactiveClass}`}>
								<Target className="w-4 h-4" />Strategy
							</NavLink>
						</div>
					</div>

					{/* User Menu - Simplified */}
					<div className="flex items-center gap-2">
						<NavLink 
							to="/settings" 
							className={({ isActive }) => `hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-all ${isActive ? 'bg-dark-600 text-white' : 'text-gray-400 hover:text-white hover:bg-dark-700'}`}
						>
							<span className="font-medium">{profile?.name || user?.email}</span>
							<span className="text-neon-cyan font-mono text-xs">{profile?.unipd_id}</span>
						</NavLink>
						<button onClick={signOut} className="p-2 rounded-lg text-gray-400 hover:text-neon-red hover:bg-dark-700 transition-all" title="Logout">
							<LogOut className="w-5 h-5" />
						</button>
					</div>
				</div>

				{/* Mobile Navigation - Grouped */}
				<div className="md:hidden pb-4">
					{/* Row 1: Academic & Finance */}
					<div className="flex items-center gap-1 mb-2">
						<NavLink to="/academics" className={({ isActive }) => `${baseNavLink} ${isActive ? activeClass : inactiveClass}`} aria-label="Academics">
							<GraduationCap className="w-4 h-4" />
							<span className="text-xs">Academics</span>
						</NavLink>
						<NavLink to="/cashflow" className={({ isActive }) => `${baseNavLink} ${isActive ? activeClass : inactiveClass}`} aria-label="Cashflow">
							<DollarSign className="w-4 h-4" />
							<span className="text-xs">Cashflow</span>
						</NavLink>
						<NavLink to="/funding" className={({ isActive }) => `${baseNavLink} ${isActive ? activeClass : inactiveClass}`} aria-label="Funding">
							<BookOpen className="w-4 h-4" />
							<span className="text-xs">Funding</span>
						</NavLink>
					</div>
					
					{/* Row 2: Life Management */}
					<div className="flex items-center gap-1 mb-2">
						<NavLink to="/bureaucracy" className={({ isActive }) => `${baseNavLink} ${isActive ? activeClass : inactiveClass} relative`} aria-label="Bureaucracy">
							<Shield className="w-4 h-4" />
							<span className="text-xs">Bureaucracy</span>
							{criticalBureaucracy > 0 && (
								<span className="absolute -top-1 -right-1 w-3 h-3 bg-neon-red rounded-full animate-pulse" />
							)}
						</NavLink>
						<NavLink to="/habits" className={({ isActive }) => `${baseNavLink} ${isActive ? activeClass : inactiveClass}`} aria-label="Protocol">
							<Activity className="w-4 h-4" />
							<span className="text-xs">Protocol</span>
						</NavLink>
						<NavLink to="/skills" className={({ isActive }) => `${baseNavLink} ${isActive ? activeClass : inactiveClass}`} aria-label="Skills">
							<Crosshair className="w-4 h-4" />
							<span className="text-xs">Skills</span>
						</NavLink>
					</div>
					
					{/* Row 3: Career & Strategy */}
					<div className="flex items-center gap-1">
						<NavLink to="/career" className={({ isActive }) => `${baseNavLink} ${isActive ? activeClass : inactiveClass}`} aria-label="Career">
							<Briefcase className="w-4 h-4" />
							<span className="text-xs">Career</span>
						</NavLink>
						<NavLink to="/strategy" className={({ isActive }) => `${baseNavLink} ${isActive ? activeClass : inactiveClass}`} aria-label="Strategy">
							<Target className="w-4 h-4" />
							<span className="text-xs">Strategy</span>
						</NavLink>
					</div>
				</div>
			</div>
		</nav>
	);
}
