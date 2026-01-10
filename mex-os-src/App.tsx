import { HashRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { DataProvider } from './contexts/DataContext';
import { Login } from './components/Login';
import { Navigation } from './components/Navigation';
import { Dashboard } from './components/Dashboard';
import { Academics } from './components/Academics';
import { Bureaucracy } from './components/Bureaucracy';
import { Habits } from './components/Habits';
import { ProfileSettings } from './components/ProfileSettings';
import { Funding } from './components/Funding';
import { Cashflow } from './components/Cashflow';
import { Career } from './components/Career';
import { Strategy } from './components/Strategy';
import './index.css';

function ProtectedRoute() {
	const { user, loading } = useAuth();

	if (loading) {
		return (
			<div className="min-h-screen bg-dark-900 flex items-center justify-center">
				<div className="text-center">
					<div className="w-16 h-16 border-4 border-neon-green border-t-transparent rounded-full animate-spin mx-auto mb-4" />
					<p className="text-neon-green neon-text-green">INITIALIZING MEX OS...</p>
				</div>
			</div>
		);
	}

	if (!user) {
		return <Navigate to="/login" replace />;
	}

	return (
		<DataProvider>
			<div className="min-h-screen bg-dark-900">
				<Navigation />
				<Outlet />
			</div>
		</DataProvider>
	);
}

function App() {
	return (
		<AuthProvider>
			<HashRouter>
				<Routes>
					<Route path="/login" element={<Login />} />
					<Route element={<ProtectedRoute />}>
						<Route path="/" element={<Dashboard />} />
						<Route path="/academics" element={<Academics />} />
						<Route path="/cashflow" element={<Cashflow />} />
						<Route path="/funding" element={<Funding />} />
						<Route path="/bureaucracy" element={<Bureaucracy />} />
						<Route path="/habits" element={<Habits />} />
						<Route path="/career" element={<Career />} />
						<Route path="/strategy" element={<Strategy />} />
						<Route path="/settings" element={<ProfileSettings />} />
					</Route>
					<Route path="*" element={<Navigate to="/" replace />} />
				</Routes>
			</HashRouter>
		</AuthProvider>
	);
}

export default App;
