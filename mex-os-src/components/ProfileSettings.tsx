import { useState, useEffect } from 'react';
import { useData } from '../contexts/DataContext';
import { useToast } from '../contexts/ToastContext';
import { User, Save, Building2, GraduationCap, CreditCard, Calendar, Download, Upload, AlertTriangle, FileJson, Database } from 'lucide-react';
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
