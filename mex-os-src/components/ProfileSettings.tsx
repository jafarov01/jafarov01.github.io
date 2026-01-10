import { useState, useEffect } from 'react';
import { useData } from '../contexts/DataContext';
import { User, Save, Building2, GraduationCap, CreditCard, Calendar } from 'lucide-react';
import { type Profile } from '../lib/seedData';

export function ProfileSettings() {
	const { profile, updateProfile } = useData();
	const [formData, setFormData] = useState<Partial<Profile>>({});
	const [isSaving, setIsSaving] = useState(false);
	const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

	useEffect(() => {
		if (profile) {
			setFormData(profile);
		}
	}, [profile]);

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsSaving(true);
		setMessage(null);

		try {
			await updateProfile(formData);
			setMessage({ type: 'success', text: 'Profile updated successfully!' });
		} catch (error) {
			console.error('Error updating profile:', error);
			setMessage({ type: 'error', text: 'Failed to update profile.' });
		} finally {
			setIsSaving(false);
			setTimeout(() => setMessage(null), 3000);
		}
	};

	if (!profile) return null;

	return (
		<div className="p-6 max-w-4xl mx-auto space-y-6">
			<div>
				<h1 className="text-3xl font-bold text-white flex items-center gap-3">
					<User className="w-8 h-8 text-neon-purple" />
					Profile Settings
				</h1>
				<p className="text-gray-500 mt-1">Manage your personal and academic details</p>
			</div>

			<form onSubmit={handleSubmit} className="card-cyber p-8 space-y-6">
				{message && (
					<div className={`p-4 rounded-lg border ${message.type === 'success'
							? 'bg-neon-green/10 border-neon-green/30 text-neon-green'
							: 'bg-neon-red/10 border-neon-red/30 text-neon-red'
						}`}>
						{message.text}
					</div>
				)}

				<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
					{/* Personal Info */}
					<div className="space-y-4">
						<h2 className="text-lg font-semibold text-white flex items-center gap-2 border-b border-dark-600 pb-2">
							<User className="w-5 h-5 text-neon-cyan" /> Personal Details
						</h2>

						<div>
							<label className="block text-sm text-gray-400 mb-1">Full Name</label>
							<input
								type="text"
								name="name"
								value={formData.name || ''}
								onChange={handleChange}
								className="w-full bg-dark-700 border border-dark-600 rounded p-2 text-white focus:border-neon-purple focus:outline-none"
							/>
						</div>

						<div>
							<label className="block text-sm text-gray-400 mb-1">Codice Fiscale</label>
							<div className="relative">
								<CreditCard className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" />
								<input
									type="text"
									name="cf"
									value={formData.cf || ''}
									onChange={handleChange}
									className="w-full bg-dark-700 border border-dark-600 rounded p-2 pl-9 text-white focus:border-neon-purple focus:outline-none uppercase"
								/>
							</div>
						</div>

						<div>
							<label className="block text-sm text-gray-400 mb-1">Visa Expiry Date</label>
							<div className="relative">
								<Calendar className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" />
								<input
									type="date"
									name="visa_expiry"
									value={formData.visa_expiry || ''}
									onChange={handleChange}
									className="w-full bg-dark-700 border border-dark-600 rounded p-2 pl-9 text-white focus:border-neon-purple focus:outline-none"
								/>
							</div>
						</div>
					</div>

					{/* Academic Info */}
					<div className="space-y-4">
						<h2 className="text-lg font-semibold text-white flex items-center gap-2 border-b border-dark-600 pb-2">
							<GraduationCap className="w-5 h-5 text-neon-cyan" /> Academic Info
						</h2>

						<div>
							<label className="block text-sm text-gray-400 mb-1">University</label>
							<div className="relative">
								<Building2 className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" />
								<input
									type="text"
									name="university"
									value={formData.university || ''}
									onChange={handleChange}
									className="w-full bg-dark-700 border border-dark-600 rounded p-2 pl-9 text-white focus:border-neon-purple focus:outline-none"
								/>
							</div>
						</div>

						<div>
							<label className="block text-sm text-gray-400 mb-1">Degree Program</label>
							<input
								type="text"
								name="degree"
								value={formData.degree || ''}
								onChange={handleChange}
								className="w-full bg-dark-700 border border-dark-600 rounded p-2 text-white focus:border-neon-purple focus:outline-none"
							/>
						</div>

						<div>
							<label className="block text-sm text-gray-400 mb-1">Student ID</label>
							<input
								type="text"
								name="unipd_id"
								value={formData.unipd_id || ''}
								onChange={handleChange}
								className="w-full bg-dark-700 border border-dark-600 rounded p-2 text-white focus:border-neon-purple focus:outline-none"
							/>
						</div>
					</div>
				</div>

				<div className="pt-6 border-t border-dark-600 flex justify-end">
					<button
						type="submit"
						disabled={isSaving}
						className="btn-cyber px-8 py-3 flex items-center gap-2 font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed"
					>
						<Save className="w-5 h-5" />
						{isSaving ? 'Saving...' : 'Save Changes'}
					</button>
				</div>
			</form>
		</div>
	);
}
