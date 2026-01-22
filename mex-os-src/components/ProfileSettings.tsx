import { useState, useEffect } from 'react';
import { useData } from '../contexts/DataContext';
import { useToast } from '../contexts/ToastContext';
import { User, Save, Building2, GraduationCap, CreditCard, Calendar, Download, Upload, AlertTriangle, FileJson, Database, Briefcase, MapPin, Mail, Phone, Linkedin, Github, FileText, Camera } from 'lucide-react';
import { type Profile, BLUEPRINT_TEMPLATE } from '../lib/seedData';
import { ConfirmModal } from './ConfirmModal';

export function ProfileSettings() {
	const { profile, updateProfile, exportData, importData, hardResetData } = useData();
	const { showToast } = useToast();
	const [formData, setFormData] = useState<Partial<Profile>>({});
	const [isSaving, setIsSaving] = useState(false);
	const [showResetConfirm, setShowResetConfirm] = useState(false);
	const [importFile, setImportFile] = useState<File | null>(null);

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

		try {
			await updateProfile(formData);
			showToast('Profile updated', 'success');
		} catch (error) {
			console.error('Error updating profile:', error);
			showToast('Failed to update profile', 'error');
		} finally {
			setIsSaving(false);
		}
	};

	const handleExport = async () => {
		if (!profile) return;
		try {
			const data = await exportData();
			const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
			const url = URL.createObjectURL(blob);
			const link = document.createElement('a');
			link.href = url;
			link.download = `mex_os_backup_${new Date().toISOString().split('T')[0]}.json`;
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
			showToast('Data exported successfully', 'success');
		} catch (error) {
			console.error('Export failed', error);
			showToast('Export failed', 'error');
		}
	};

	const handleBlueprintDownload = () => {
		const blob = new Blob([JSON.stringify(BLUEPRINT_TEMPLATE, null, 2)], { type: 'application/json' });
		const url = URL.createObjectURL(blob);
		const link = document.createElement('a');
		link.href = url;
		link.download = 'mex_os_blueprint_template.json';
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
	};

	const handleImport = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!importFile) return;

		const reader = new FileReader();
		reader.onload = async (event) => {
			try {
				const json = JSON.parse(event.target?.result as string);
				// Basic validation
				if (!json.profile) throw new Error("Invalid format: missing profile");

				await importData(json);
				showToast('Data imported successfully', 'success');
				setImportFile(null);
			} catch (error: any) {
				console.error('Import failed', error);
				showToast(error instanceof Error ? error.message : 'Import failed. Check file format.', 'error');
			}
		};
		reader.readAsText(importFile);
	};

	const handleHardReset = async () => {
		try {
			await hardResetData();
			setShowResetConfirm(false);
			showToast('All data wiped successfully', 'success');
		} catch (error) {
			console.error('Reset failed', error);
			showToast('Failed to reset data', 'error');
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

				{/* CV Contact Info - Full Width Section */}
				<div className="space-y-4 pt-6 border-t border-dark-600">
					<h2 className="text-lg font-semibold text-white flex items-center gap-2 border-b border-dark-600 pb-2">
						<FileText className="w-5 h-5 text-neon-purple" /> CV Contact Info
					</h2>
					<p className="text-sm text-gray-500 mb-4">
						This information will appear on your generated CV. Fields are optional.
					</p>

					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div>
							<label className="block text-sm text-gray-400 mb-1">Professional Title</label>
							<div className="relative">
								<Briefcase className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" />
								<input
									type="text"
									name="professional_title"
									value={formData.professional_title || ''}
									onChange={handleChange}
									placeholder="e.g. Software Developer"
									className="w-full bg-dark-700 border border-dark-600 rounded p-2 pl-9 text-white focus:border-neon-purple focus:outline-none"
								/>
							</div>
						</div>
						<div>
							<label className="block text-sm text-gray-400 mb-1">Location</label>
							<div className="relative">
								<MapPin className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" />
								<input
									type="text"
									name="location"
									value={formData.location || ''}
									onChange={handleChange}
									placeholder="e.g. Budapest, Hungary"
									className="w-full bg-dark-700 border border-dark-600 rounded p-2 pl-9 text-white focus:border-neon-purple focus:outline-none"
								/>
							</div>
						</div>
					</div>

					{/* Role-Specific Titles */}
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div>
							<label className="block text-sm text-gray-400 mb-1">Title (Software Engineering)</label>
							<input
								type="text"
								value={formData.cv_titles?.se || ''}
								onChange={(e) => setFormData(prev => ({
									...prev,
									cv_titles: {
										...prev.cv_titles,
										se: e.target.value
									}
								}))}
								placeholder="e.g. Software Engineer"
								className="w-full bg-dark-700 border border-dark-600 rounded p-2 text-white focus:border-neon-purple focus:outline-none"
							/>
						</div>
						<div>
							<label className="block text-sm text-gray-400 mb-1">Title (Customer Support)</label>
							<input
								type="text"
								value={formData.cv_titles?.cs || ''}
								onChange={(e) => setFormData(prev => ({
									...prev,
									cv_titles: {
										...prev.cv_titles,
										cs: e.target.value
									}
								}))}
								placeholder="e.g. Customer Support Specialist"
								className="w-full bg-dark-700 border border-dark-600 rounded p-2 text-white focus:border-neon-purple focus:outline-none"
							/>
						</div>
					</div>

					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div>
							<label className="block text-sm text-gray-400 mb-1">Email</label>
							<div className="relative">
								<Mail className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" />
								<input
									type="email"
									name="email"
									value={formData.email || ''}
									onChange={handleChange}
									placeholder="your.email@example.com"
									className="w-full bg-dark-700 border border-dark-600 rounded p-2 pl-9 text-white focus:border-neon-purple focus:outline-none"
								/>
							</div>
						</div>
						<div>
							<label className="block text-sm text-gray-400 mb-1">Phone</label>
							<div className="relative">
								<Phone className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" />
								<input
									type="tel"
									name="phone"
									value={formData.phone || ''}
									onChange={handleChange}
									placeholder="+36 20 123 4567"
									className="w-full bg-dark-700 border border-dark-600 rounded p-2 pl-9 text-white focus:border-neon-purple focus:outline-none"
								/>
							</div>
						</div>
					</div>

					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div>
							<label className="block text-sm text-gray-400 mb-1">LinkedIn URL</label>
							<div className="relative">
								<Linkedin className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" />
								<input
									type="url"
									name="linkedin_url"
									value={formData.linkedin_url || ''}
									onChange={handleChange}
									placeholder="https://linkedin.com/in/yourprofile"
									className="w-full bg-dark-700 border border-dark-600 rounded p-2 pl-9 text-white focus:border-neon-purple focus:outline-none"
								/>
							</div>
						</div>
						<div>
							<label className="block text-sm text-gray-400 mb-1">GitHub URL</label>
							<div className="relative">
								<Github className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" />
								<input
									type="url"
									name="github_url"
									value={formData.github_url || ''}
									onChange={handleChange}
									placeholder="https://github.com/yourusername"
									className="w-full bg-dark-700 border border-dark-600 rounded p-2 pl-9 text-white focus:border-neon-purple focus:outline-none"
								/>
							</div>
						</div>
					</div>

					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div>
							<label className="block text-sm text-gray-400 mb-1">CV Photo</label>
							<div className="flex items-start gap-4">
								{formData.photo_url ? (
									<div className="relative group">
										<img
											src={formData.photo_url}
											alt="Profile"
											className="w-20 h-20 rounded-full object-cover border-2 border-neon-purple"
										/>
										<button
											type="button"
											onClick={() => setFormData(prev => ({ ...prev, photo_url: undefined }))}
											className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
											title="Remove photo"
										>
											<AlertTriangle className="w-3 h-3" />
										</button>
									</div>
								) : (
									<div className="w-20 h-20 rounded-full bg-dark-700 border-2 border-dashed border-gray-600 flex items-center justify-center text-gray-500">
										<User className="w-8 h-8" />
									</div>
								)}

								<div className="flex-1">
									<input
										type="file"
										id="photo-upload"
										accept="image/jpeg,image/png"
										className="hidden"
										onChange={(e) => {
											const file = e.target.files?.[0];
											if (!file) return;

											// Limit: 500KB to ensure Firestore document size safety
											if (file.size > 500 * 1024) {
												showToast('Image too large (max 500KB)', 'error');
												return;
											}

											const reader = new FileReader();
											reader.onloadend = () => {
												setFormData(prev => ({ ...prev, photo_url: reader.result as string }));
											};
											reader.readAsDataURL(file);
										}}
									/>
									<label
										htmlFor="photo-upload"
										className="btn-cyber px-4 py-2 flex items-center gap-2 cursor-pointer w-fit text-sm"
									>
										<Camera className="w-4 h-4" />
										{formData.photo_url ? 'Change Photo' : 'Upload Photo'}
									</label>
									<p className="text-xs text-gray-500 mt-2">
										Passport-style (Max 500KB).<br />
										Appears in CV top-right.
									</p>
								</div>
							</div>
						</div>
					</div>

					<div>
						<label className="block text-sm text-gray-400 mb-1">Professional Summary</label>
						<textarea
							name="professional_summary"
							value={formData.professional_summary || ''}
							onChange={(e) => setFormData(prev => ({ ...prev, professional_summary: e.target.value }))}
							rows={4}
							placeholder="A results-driven Software Engineer with professional experience in..."
							className="w-full bg-dark-700 border border-dark-600 rounded p-2 text-white focus:border-neon-purple focus:outline-none resize-none"
						/>
						<p className="text-xs text-gray-600 mt-1">This will appear at the top of your CV.</p>
					</div>

					{/* Role-Specific Summaries */}
					<div className="grid grid-cols-1 gap-4 pt-4 border-t border-dark-600 mt-4">
						<h3 className="text-sm font-semibold text-gray-400">Role-Specific Summaries (Overrides default)</h3>

						<div>
							<label className="block text-sm text-gray-400 mb-1">Summary (Software Engineering)</label>
							<textarea
								value={formData.cv_summaries?.se || ''}
								onChange={(e) => setFormData(prev => ({
									...prev,
									cv_summaries: {
										...prev.cv_summaries,
										se: e.target.value
									}
								}))}
								rows={3}
								placeholder="Specialized summary for Software Engineering roles..."
								className="w-full bg-dark-700 border border-dark-600 rounded p-2 text-white focus:border-neon-purple focus:outline-none resize-none"
							/>
						</div>

						<div>
							<label className="block text-sm text-gray-400 mb-1">Summary (Customer Support)</label>
							<textarea
								value={formData.cv_summaries?.cs || ''}
								onChange={(e) => setFormData(prev => ({
									...prev,
									cv_summaries: {
										...prev.cv_summaries,
										cs: e.target.value
									}
								}))}
								rows={3}
								placeholder="Specialized summary for Customer Support roles..."
								className="w-full bg-dark-700 border border-dark-600 rounded p-2 text-white focus:border-neon-purple focus:outline-none resize-none"
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

			{/* Data Management Section */}
			<div className="card-cyber p-8 space-y-6 border-t font-mono">
				<h2 className="text-xl font-bold text-white flex items-center gap-2">
					<Database className="w-6 h-6 text-neon-yellow" /> Data Sovereignty
				</h2>

				<div className="grid grid-cols-1 md:grid-cols-2 gap-8">
					<div className="space-y-4">
						<h3 className="text-lg font-semibold text-gray-300">Backup & Template</h3>
						<p className="text-sm text-gray-500">Download your data or a blank template.</p>
						<div className="flex flex-col gap-3">
							<button
								onClick={handleExport}
								className="btn-cyber w-full flex items-center justify-center gap-2"
							>
								<Download className="w-4 h-4" /> Export Current Data
							</button>
							<button
								onClick={handleBlueprintDownload}
								className="p-2 border border-neon-cyan/50 text-neon-cyan rounded hover:bg-neon-cyan/10 transition-colors w-full flex items-center justify-center gap-2"
							>
								<FileJson className="w-4 h-4" /> Download Empty Blueprint
							</button>
						</div>
					</div>

					<div className="space-y-4">
						<h3 className="text-lg font-semibold text-gray-300">Import Data</h3>
						<p className="text-sm text-gray-500">Overwrite everything with a backup file.</p>
						<div className="flex gap-2">
							<input
								type="file"
								accept=".json"
								onChange={(e) => setImportFile(e.target.files?.[0] || null)}
								className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-dark-600 file:text-neon-purple hover:file:bg-dark-500"
							/>
							<button
								onClick={handleImport}
								disabled={!importFile}
								className="btn-cyber px-4 disabled:opacity-50"
							>
								<Upload className="w-4 h-4" />
							</button>
						</div>
					</div>
				</div>

				<div className="pt-6 border-t border-dark-600">
					<h3 className="text-lg font-bold text-neon-red flex items-center gap-2 mb-2">
						<AlertTriangle className="w-5 h-5" /> Danger Zone
					</h3>
					<div className="flex items-center justify-between p-4 bg-neon-red/5 border border-neon-red/20 rounded-lg">
						<p className="text-sm text-red-400">
							Permanently delete all your personal data, transactions, and settings. This cannot be undone.
						</p>
						<button
							onClick={() => setShowResetConfirm(true)}
							className="px-4 py-2 bg-neon-red/10 border border-neon-red text-neon-red rounded hover:bg-neon-red hover:text-white transition-all whitespace-nowrap font-bold"
						>
							Delete All Data
						</button>
					</div>
				</div>
			</div>

			<ConfirmModal
				isOpen={showResetConfirm}
				title="FACTORY RESET"
				message="CRITICAL WARNING: You are about to wipe your entire digital existence from MEX OS. All profiles, finances, grades, and habits will be permanently destroyed. Are you absolutely sure?"
				confirmText="DESTROY DATA"
				isDangerous={true}
				onConfirm={handleHardReset}
				onCancel={() => setShowResetConfirm(false)}
			/>
		</div>
	);
}
