import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Terminal, Zap, AlertTriangle } from 'lucide-react';

export function Login() {
	const { signIn, signUp, user, loading: authLoading } = useAuth();
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [isSignUp, setIsSignUp] = useState(false);
	const [error, setError] = useState('');
	const [loading, setLoading] = useState(false);

	// Redirect if already logged in
	if (authLoading) {
		return (
			<div className="min-h-screen bg-dark-900 flex items-center justify-center">
				<div className="w-16 h-16 border-4 border-neon-green border-t-transparent rounded-full animate-spin" />
			</div>
		);
	}

	if (user) {
		return <Navigate to="/" replace />;
	}

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError('');
		setLoading(true);

		try {
			if (isSignUp) {
				await signUp(email, password);
			} else {
				await signIn(email, password);
			}
		} catch (err: any) {
			setError(err.message || 'Authentication failed');
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="min-h-screen bg-dark-900 flex items-center justify-center p-4">
			{/* Background grid effect */}
			<div className="fixed inset-0 opacity-10">
				<div className="absolute inset-0" style={{
					backgroundImage: `linear-gradient(rgba(0,255,136,0.1) 1px, transparent 1px),
                           linear-gradient(90deg, rgba(0,255,136,0.1) 1px, transparent 1px)`,
					backgroundSize: '50px 50px'
				}} />
			</div>

			<div className="relative w-full max-w-md">
				{/* Logo and title */}
				<div className="text-center mb-8">
					<div className="inline-flex items-center justify-center w-20 h-20 rounded-lg bg-dark-800 border border-neon-green/30 mb-4 neon-border-green">
						<Terminal className="w-10 h-10 text-neon-green" />
					</div>
					<h1 className="text-4xl font-bold text-white mb-2">
						<span className="neon-text-green">MEX</span>{' '}
						<span className="text-gray-400">OS</span>
					</h1>
					<p className="text-gray-500 flex items-center justify-center gap-2">
						<Zap className="w-4 h-4 text-neon-yellow" />
						LifeOS Survival Cockpit
					</p>
				</div>

				{/* Login form */}
				<form onSubmit={handleSubmit} className="card-cyber p-8">
					<h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
						<span className="w-2 h-2 rounded-full bg-neon-green animate-pulse" />
						{isSignUp ? 'Initialize System' : 'System Access'}
					</h2>

					{error && (
						<div className="mb-4 p-3 rounded bg-red-500/10 border border-red-500/30 flex items-center gap-2 text-red-400">
							<AlertTriangle className="w-4 h-4" />
							<span className="text-sm">{error}</span>
						</div>
					)}

					<div className="space-y-4">
						<div>
							<label className="block text-sm text-gray-400 mb-2">
								EMAIL_ADDR
							</label>
							<input
								type="email"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								className="w-full"
								placeholder="operator@mex.os"
								required
							/>
						</div>

						<div>
							<label className="block text-sm text-gray-400 mb-2">
								ACCESS_KEY
							</label>
							<input
								type="password"
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								className="w-full"
								placeholder="••••••••"
								required
								minLength={6}
							/>
						</div>
					</div>

					<button
						type="submit"
						disabled={loading}
						className="w-full btn-cyber mt-6 py-3 flex items-center justify-center gap-2"
					>
						{loading ? (
							<>
								<span className="w-4 h-4 border-2 border-neon-green border-t-transparent rounded-full animate-spin" />
								Processing...
							</>
						) : (
							<>
								<Zap className="w-4 h-4" />
								{isSignUp ? 'CREATE_ACCOUNT' : 'LOGIN'}
							</>
						)}
					</button>

					<div className="mt-6 text-center">
						<button
							type="button"
							onClick={() => setIsSignUp(!isSignUp)}
							className="text-sm text-gray-500 hover:text-neon-cyan transition-colors"
						>
							{isSignUp ? 'Already have access? Login' : 'New operator? Create account'}
						</button>
					</div>
				</form>

				{/* System status footer */}
				<div className="mt-6 text-center text-xs text-gray-600">
					<div className="flex items-center justify-center gap-4">
						<span className="flex items-center gap-1">
							<span className="w-2 h-2 rounded-full bg-neon-green animate-pulse" />
							FIRESTORE: ONLINE
						</span>
						<span className="flex items-center gap-1">
							<span className="w-2 h-2 rounded-full bg-neon-green animate-pulse" />
							AUTH: READY
						</span>
					</div>
				</div>
			</div>
		</div>
	);
}
