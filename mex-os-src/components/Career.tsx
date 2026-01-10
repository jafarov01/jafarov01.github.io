import { useState } from 'react';
import { useData } from '../contexts/DataContext';
import {
	Briefcase,
	GraduationCap,
	MapPin,
	Calendar,
	Plus,
	Trash2,
	Edit2,
	X,
	Save,
	Code,
	Building2,
	Trophy,
	Star,
	Clock,
	ChevronDown,
	ChevronUp,
	DollarSign
} from 'lucide-react';
import { format, differenceInMonths } from 'date-fns';
import { type Job, type Education, type JobType, type EducationStatus } from '../lib/seedData';

const jobTypes: JobType[] = ['full-time', 'contract', 'freelance', 'internship'];
const educationStatuses: EducationStatus[] = ['enrolled', 'graduated', 'paused'];

export function Career() {
	const {
		jobs, education, skillDefinitions,
		addJob, updateJob, deleteJob,
		addEducation, updateEducation, deleteEducation,
		profile
	} = useData();

	const [activeTab, setActiveTab] = useState<'jobs' | 'education' | 'skills'>('jobs');
	const [isJobModalOpen, setIsJobModalOpen] = useState(false);
	const [isEduModalOpen, setIsEduModalOpen] = useState(false);
	const [editingJob, setEditingJob] = useState<Job | null>(null);
	const [editingEdu, setEditingEdu] = useState<Education | null>(null);
	const [expandedJobId, setExpandedJobId] = useState<string | null>(null);

	const [jobForm, setJobForm] = useState({
		company: '',
		role: '',
		location: '',
		type: 'full-time' as JobType,
		startDate: '',
		endDate: '',
		salary_gross_yr: 0,
		currency: 'EUR',
		tech_stack: '',
		achievements: '',
		is_current: false
	});

	const [eduForm, setEduForm] = useState({
		institution: '',
		degree: '',
		status: 'enrolled' as EducationStatus,
		startDate: '',
		endDate: '',
		scholarship_name: '',
		thesis_title: ''
	});

	const resetJobForm = () => {
		setJobForm({
			company: '',
			role: '',
			location: '',
			type: 'full-time',
			startDate: '',
			endDate: '',
			salary_gross_yr: 0,
			currency: 'EUR',
			tech_stack: '',
			achievements: '',
			is_current: false
		});
		setEditingJob(null);
	};

	const resetEduForm = () => {
		setEduForm({
			institution: '',
			degree: '',
			status: 'enrolled',
			startDate: '',
			endDate: '',
			scholarship_name: '',
			thesis_title: ''
		});
		setEditingEdu(null);
	};

	const openEditJob = (job: Job) => {
		setEditingJob(job);
		setJobForm({
			company: job.company,
			role: job.role,
			location: job.location,
			type: job.type,
			startDate: job.startDate,
			endDate: job.endDate || '',
			salary_gross_yr: job.salary_gross_yr || 0,
			currency: job.currency || 'EUR',
			tech_stack: job.tech_stack.join(', '),
			achievements: job.achievements?.join('\n') || '',
			is_current: job.is_current
		});
		setIsJobModalOpen(true);
	};

	const openEditEdu = (edu: Education) => {
		setEditingEdu(edu);
		setEduForm({
			institution: edu.institution,
			degree: edu.degree,
			status: edu.status,
			startDate: edu.startDate,
			endDate: edu.endDate || '',
			scholarship_name: edu.scholarship_name || '',
			thesis_title: edu.thesis_title || ''
		});
		setIsEduModalOpen(true);
	};

	const handleSaveJob = async () => {
		if (!jobForm.company.trim() || !jobForm.role.trim()) return;

		const jobData: Omit<Job, 'id'> = {
			company: jobForm.company,
			role: jobForm.role,
			location: jobForm.location,
			type: jobForm.type,
			startDate: jobForm.startDate,
			endDate: jobForm.is_current ? null : (jobForm.endDate || null),
			salary_gross_yr: jobForm.salary_gross_yr || undefined,
			currency: jobForm.currency,
			tech_stack: jobForm.tech_stack.split(',').map(s => s.trim()).filter(Boolean),
			achievements: jobForm.achievements.split('\n').map(s => s.trim()).filter(Boolean),
			is_current: jobForm.is_current
		};

		if (editingJob) {
			await updateJob(editingJob.id, jobData);
		} else {
			await addJob(jobData);
		}

		setIsJobModalOpen(false);
		resetJobForm();
	};

	const handleSaveEdu = async () => {
		if (!eduForm.institution.trim() || !eduForm.degree.trim()) return;

		const eduData: Omit<Education, 'id'> = {
			institution: eduForm.institution,
			degree: eduForm.degree,
			status: eduForm.status,
			startDate: eduForm.startDate,
			endDate: eduForm.endDate || null,
			scholarship_name: eduForm.scholarship_name || undefined,
			thesis_title: eduForm.thesis_title || undefined
		};

		if (editingEdu) {
			await updateEducation(editingEdu.id, eduData);
		} else {
			await addEducation(eduData);
		}

		setIsEduModalOpen(false);
		resetEduForm();
	};

	const calculateDuration = (startDate: string, endDate: string | null) => {
		const start = new Date(startDate);
		const end = endDate ? new Date(endDate) : new Date();
		const months = differenceInMonths(end, start);
		const years = Math.floor(months / 12);
		const remainingMonths = months % 12;

		if (years === 0) return `${remainingMonths} mo`;
		if (remainingMonths === 0) return `${years} yr`;
		return `${years} yr ${remainingMonths} mo`;
	};

	const getJobTypeColor = (type: JobType) => {
		switch (type) {
			case 'full-time': return 'bg-neon-green/10 text-neon-green border-neon-green/30';
			case 'contract': return 'bg-neon-cyan/10 text-neon-cyan border-neon-cyan/30';
			case 'freelance': return 'bg-neon-purple/10 text-neon-purple border-neon-purple/30';
			case 'internship': return 'bg-neon-yellow/10 text-neon-yellow border-neon-yellow/30';
		}
	};

	const getEduStatusColor = (status: EducationStatus) => {
		switch (status) {
			case 'enrolled': return 'bg-neon-cyan/10 text-neon-cyan border-neon-cyan/30';
			case 'graduated': return 'bg-neon-green/10 text-neon-green border-neon-green/30';
			case 'paused': return 'bg-neon-yellow/10 text-neon-yellow border-neon-yellow/30';
		}
	};

	// Calculate total experience
	const totalExperience = jobs.reduce((acc, job) => {
		const start = new Date(job.startDate);
		const end = job.endDate ? new Date(job.endDate) : new Date();
		return acc + differenceInMonths(end, start);
	}, 0);

	const totalYears = Math.floor(totalExperience / 12);
	const totalMonths = totalExperience % 12;

	// Get unique tech stack across all jobs
	const allTechStack = [...new Set(jobs.flatMap(j => j.tech_stack))];

	// CV-ready skills
	const cvSkills = skillDefinitions.filter(s => s.show_on_cv);

	return (
		<div className="p-6 max-w-7xl mx-auto space-y-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-3xl font-bold text-white flex items-center gap-3">
						<Briefcase className="w-8 h-8 text-neon-purple" />
						Career Hub
					</h1>
					<p className="text-gray-500 mt-1">
						{profile?.name || 'Your'} Professional Timeline & CV Manager
					</p>
				</div>
				<div className="flex items-center gap-4 text-sm">
					<div className="card-cyber px-4 py-2">
						<span className="text-gray-400">Experience:</span>
						<span className="text-white font-bold ml-2">
							{totalYears > 0 ? `${totalYears}y ` : ''}{totalMonths}m
						</span>
					</div>
					<div className="card-cyber px-4 py-2">
						<span className="text-gray-400">Technologies:</span>
						<span className="text-neon-cyan font-bold ml-2">{allTechStack.length}</span>
					</div>
				</div>
			</div>

			{/* Tabs */}
			<div className="flex gap-2 border-b border-dark-600 pb-2">
				<button
					onClick={() => setActiveTab('jobs')}
					className={`px-4 py-2 rounded-t-lg transition-all ${
						activeTab === 'jobs'
							? 'bg-dark-700 text-neon-green border-b-2 border-neon-green'
							: 'text-gray-400 hover:text-white'
					}`}
				>
					<Briefcase className="w-4 h-4 inline mr-2" />
					Work History ({jobs.length})
				</button>
				<button
					onClick={() => setActiveTab('education')}
					className={`px-4 py-2 rounded-t-lg transition-all ${
						activeTab === 'education'
							? 'bg-dark-700 text-neon-cyan border-b-2 border-neon-cyan'
							: 'text-gray-400 hover:text-white'
					}`}
				>
					<GraduationCap className="w-4 h-4 inline mr-2" />
					Education ({education.length})
				</button>
				<button
					onClick={() => setActiveTab('skills')}
					className={`px-4 py-2 rounded-t-lg transition-all ${
						activeTab === 'skills'
							? 'bg-dark-700 text-neon-purple border-b-2 border-neon-purple'
							: 'text-gray-400 hover:text-white'
					}`}
				>
					<Code className="w-4 h-4 inline mr-2" />
					Tech Stack ({cvSkills.length})
				</button>
			</div>

			{/* Jobs Tab */}
			{activeTab === 'jobs' && (
				<div className="space-y-4">
					<div className="flex justify-end">
						<button
							onClick={() => { resetJobForm(); setIsJobModalOpen(true); }}
							className="btn-cyber px-4 py-2 flex items-center gap-2"
						>
							<Plus className="w-4 h-4" />
							Add Position
						</button>
					</div>

					{/* Timeline */}
					<div className="relative">
						{/* Timeline line */}
						<div className="absolute left-8 top-0 bottom-0 w-0.5 bg-dark-600" />

						{jobs.length === 0 ? (
							<div className="text-center py-12 card-cyber">
								<Briefcase className="w-12 h-12 text-gray-600 mx-auto mb-4" />
								<p className="text-gray-500">No work history yet. Add your first position!</p>
							</div>
						) : (
							<div className="space-y-6">
								{jobs.map((job) => (
									<div key={job.id} className="relative pl-20">
										{/* Timeline dot */}
										<div className={`absolute left-6 w-5 h-5 rounded-full border-2 ${
											job.is_current
												? 'bg-neon-green border-neon-green animate-pulse'
												: 'bg-dark-700 border-dark-500'
										}`} />

										{/* Card */}
										<div className="card-cyber p-5 hover:border-neon-purple/30 transition-all">
											<div className="flex items-start justify-between">
												<div className="flex-1">
													<div className="flex items-center gap-3 mb-2">
														<h3 className="text-xl font-bold text-white">{job.role}</h3>
														{job.is_current && (
															<span className="px-2 py-0.5 bg-neon-green/20 text-neon-green text-xs rounded-full border border-neon-green/30">
																CURRENT
															</span>
														)}
														<span className={`px-2 py-0.5 text-xs rounded-full border ${getJobTypeColor(job.type)}`}>
															{job.type}
														</span>
													</div>

													<div className="flex items-center gap-4 text-gray-400 text-sm mb-3">
														<span className="flex items-center gap-1">
															<Building2 className="w-4 h-4" />
															{job.company}
														</span>
														<span className="flex items-center gap-1">
															<MapPin className="w-4 h-4" />
															{job.location}
														</span>
														<span className="flex items-center gap-1">
															<Clock className="w-4 h-4" />
															{calculateDuration(job.startDate, job.endDate)}
														</span>
													</div>

													<div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
														<Calendar className="w-4 h-4" />
														{format(new Date(job.startDate), 'MMM yyyy')} — {job.endDate ? format(new Date(job.endDate), 'MMM yyyy') : 'Present'}
													</div>

													{/* Tech Stack */}
													<div className="flex flex-wrap gap-2 mb-3">
														{job.tech_stack.map(tech => (
															<span
																key={tech}
																className="px-2 py-1 bg-dark-600 text-neon-cyan text-xs rounded border border-dark-500"
															>
																{tech}
															</span>
														))}
													</div>

													{/* Expandable Achievements */}
													{job.achievements && job.achievements.length > 0 && (
														<div>
															<button
																onClick={() => setExpandedJobId(expandedJobId === job.id ? null : job.id)}
																className="flex items-center gap-1 text-sm text-gray-400 hover:text-white transition-colors"
															>
																<Trophy className="w-4 h-4" />
																{job.achievements.length} Achievement{job.achievements.length > 1 ? 's' : ''}
																{expandedJobId === job.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
															</button>

															{expandedJobId === job.id && (
																<ul className="mt-2 space-y-1 pl-4 border-l-2 border-dark-600">
																	{job.achievements.map((ach, i) => (
																		<li key={i} className="text-sm text-gray-300">• {ach}</li>
																	))}
																</ul>
															)}
														</div>
													)}
												</div>

												{/* Actions */}
												<div className="flex items-center gap-2">
													{job.salary_gross_yr && (
														<span className="text-sm text-gray-500 flex items-center gap-1">
															<DollarSign className="w-3 h-3" />
															{job.salary_gross_yr.toLocaleString()} {job.currency}/yr
														</span>
													)}
													<button
														onClick={() => openEditJob(job)}
														className="p-2 text-gray-400 hover:text-neon-cyan transition-colors"
													>
														<Edit2 className="w-4 h-4" />
													</button>
													<button
														onClick={() => deleteJob(job.id)}
														className="p-2 text-gray-400 hover:text-neon-red transition-colors"
													>
														<Trash2 className="w-4 h-4" />
													</button>
												</div>
											</div>
										</div>
									</div>
								))}
							</div>
						)}
					</div>
				</div>
			)}

			{/* Education Tab */}
			{activeTab === 'education' && (
				<div className="space-y-4">
					<div className="flex justify-end">
						<button
							onClick={() => { resetEduForm(); setIsEduModalOpen(true); }}
							className="btn-cyber px-4 py-2 flex items-center gap-2"
						>
							<Plus className="w-4 h-4" />
							Add Education
						</button>
					</div>

					{education.length === 0 ? (
						<div className="text-center py-12 card-cyber">
							<GraduationCap className="w-12 h-12 text-gray-600 mx-auto mb-4" />
							<p className="text-gray-500">No education history yet. Add your first degree!</p>
						</div>
					) : (
						<div className="grid gap-4">
							{education.map(edu => (
								<div key={edu.id} className="card-cyber p-5 hover:border-neon-cyan/30 transition-all">
									<div className="flex items-start justify-between">
										<div>
											<div className="flex items-center gap-3 mb-2">
												<h3 className="text-xl font-bold text-white">{edu.degree}</h3>
												<span className={`px-2 py-0.5 text-xs rounded-full border ${getEduStatusColor(edu.status)}`}>
													{edu.status}
												</span>
											</div>

											<div className="flex items-center gap-4 text-gray-400 text-sm mb-2">
												<span className="flex items-center gap-1">
													<Building2 className="w-4 h-4" />
													{edu.institution}
												</span>
												<span className="flex items-center gap-1">
													<Calendar className="w-4 h-4" />
													{format(new Date(edu.startDate), 'MMM yyyy')} — {edu.endDate ? format(new Date(edu.endDate), 'MMM yyyy') : 'Present'}
												</span>
											</div>

											{edu.scholarship_name && (
												<div className="flex items-center gap-1 text-sm text-neon-yellow mb-2">
													<Star className="w-4 h-4" />
													{edu.scholarship_name}
												</div>
											)}

											{edu.thesis_title && (
												<p className="text-sm text-gray-400 italic">
													Thesis: "{edu.thesis_title}"
												</p>
											)}
										</div>

										<div className="flex items-center gap-2">
											<button
												onClick={() => openEditEdu(edu)}
												className="p-2 text-gray-400 hover:text-neon-cyan transition-colors"
											>
												<Edit2 className="w-4 h-4" />
											</button>
											<button
												onClick={() => deleteEducation(edu.id)}
												className="p-2 text-gray-400 hover:text-neon-red transition-colors"
											>
												<Trash2 className="w-4 h-4" />
											</button>
										</div>
									</div>
								</div>
							))}
						</div>
					)}
				</div>
			)}

			{/* Skills Tab */}
			{activeTab === 'skills' && (
				<div className="space-y-6">
					<div className="card-cyber p-6">
						<h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
							<Code className="w-5 h-5 text-neon-purple" />
							CV-Ready Skills Matrix
						</h3>
						<p className="text-sm text-gray-500 mb-4">
							Skills marked as "Show on CV" from your Protocol settings will appear here.
							Go to Protocol → Manage Skills to update proficiency levels.
						</p>

						{cvSkills.length === 0 ? (
							<div className="text-center py-8 text-gray-500">
								No skills configured for CV. Add skills in the Protocol section and enable "Show on CV".
							</div>
						) : (
							<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
								{cvSkills.map(skill => (
									<div
										key={skill.id}
										className="p-4 bg-dark-700 rounded-lg border border-dark-600 hover:border-neon-purple/30 transition-all"
									>
										<div className="flex items-center justify-between mb-2">
											<span className="font-medium text-white">{skill.name}</span>
											<span className={`text-xs px-2 py-0.5 rounded ${
												skill.category === 'language' ? 'bg-neon-cyan/20 text-neon-cyan' :
												skill.category === 'frontend' ? 'bg-neon-purple/20 text-neon-purple' :
												skill.category === 'backend' ? 'bg-neon-green/20 text-neon-green' :
												skill.category === 'devops' ? 'bg-neon-yellow/20 text-neon-yellow' :
												'bg-dark-600 text-gray-400'
											}`}>
												{skill.category || 'other'}
											</span>
										</div>

										{/* Proficiency bar */}
										<div className="flex items-center gap-2 mb-2">
											<span className="text-xs text-gray-500">Proficiency:</span>
											<div className="flex gap-1">
												{[1, 2, 3, 4, 5].map(level => (
													<div
														key={level}
														className={`w-4 h-2 rounded ${
															level <= (skill.proficiency_level || 1)
																? 'bg-neon-green'
																: 'bg-dark-600'
														}`}
													/>
												))}
											</div>
										</div>

										{skill.years_experience !== undefined && (
											<span className="text-xs text-gray-500">
												{skill.years_experience} year{skill.years_experience !== 1 ? 's' : ''} experience
											</span>
										)}
									</div>
								))}
							</div>
						)}
					</div>

					{/* Tech Stack from Jobs */}
					<div className="card-cyber p-6">
						<h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
							<Briefcase className="w-5 h-5 text-neon-cyan" />
							Technologies from Work History
						</h3>
						<div className="flex flex-wrap gap-2">
							{allTechStack.map(tech => (
								<span
									key={tech}
									className="px-3 py-1.5 bg-dark-700 text-neon-cyan text-sm rounded-lg border border-dark-600"
								>
									{tech}
								</span>
							))}
							{allTechStack.length === 0 && (
								<span className="text-gray-500">No technologies listed in work history yet.</span>
							)}
						</div>
					</div>
				</div>
			)}

			{/* Job Modal */}
			{isJobModalOpen && (
				<div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
					<div className="card-cyber p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
						<div className="flex items-center justify-between mb-6">
							<h2 className="text-xl font-bold text-white flex items-center gap-2">
								<Briefcase className="w-5 h-5 text-neon-purple" />
								{editingJob ? 'Edit Position' : 'Add New Position'}
							</h2>
							<button
								onClick={() => { setIsJobModalOpen(false); resetJobForm(); }}
								className="p-2 text-gray-400 hover:text-white"
							>
								<X className="w-5 h-5" />
							</button>
						</div>

						<div className="space-y-4">
							<div className="grid grid-cols-2 gap-4">
								<div>
									<label className="block text-sm text-gray-400 mb-1">Company *</label>
									<input
										type="text"
										value={jobForm.company}
										onChange={e => setJobForm({ ...jobForm, company: e.target.value })}
										className="w-full bg-dark-700 border border-dark-600 rounded p-2 text-white focus:border-neon-purple focus:outline-none"
										placeholder="e.g. Google"
									/>
								</div>
								<div>
									<label className="block text-sm text-gray-400 mb-1">Role *</label>
									<input
										type="text"
										value={jobForm.role}
										onChange={e => setJobForm({ ...jobForm, role: e.target.value })}
										className="w-full bg-dark-700 border border-dark-600 rounded p-2 text-white focus:border-neon-purple focus:outline-none"
										placeholder="e.g. Software Engineer"
									/>
								</div>
							</div>

							<div className="grid grid-cols-2 gap-4">
								<div>
									<label className="block text-sm text-gray-400 mb-1">Location</label>
									<input
										type="text"
										value={jobForm.location}
										onChange={e => setJobForm({ ...jobForm, location: e.target.value })}
										className="w-full bg-dark-700 border border-dark-600 rounded p-2 text-white focus:border-neon-purple focus:outline-none"
										placeholder="e.g. Milan, Italy (Remote)"
									/>
								</div>
								<div>
									<label className="block text-sm text-gray-400 mb-1">Type</label>
									<select
										value={jobForm.type}
										onChange={e => setJobForm({ ...jobForm, type: e.target.value as JobType })}
										className="w-full bg-dark-700 border border-dark-600 rounded p-2 text-white focus:border-neon-purple focus:outline-none"
									>
										{jobTypes.map(t => (
											<option key={t} value={t}>{t}</option>
										))}
									</select>
								</div>
							</div>

							<div className="grid grid-cols-3 gap-4">
								<div>
									<label className="block text-sm text-gray-400 mb-1">Start Date</label>
									<input
										type="date"
										value={jobForm.startDate}
										onChange={e => setJobForm({ ...jobForm, startDate: e.target.value })}
										className="w-full bg-dark-700 border border-dark-600 rounded p-2 text-white focus:border-neon-purple focus:outline-none"
									/>
								</div>
								<div>
									<label className="block text-sm text-gray-400 mb-1">End Date</label>
									<input
										type="date"
										value={jobForm.endDate}
										onChange={e => setJobForm({ ...jobForm, endDate: e.target.value })}
										disabled={jobForm.is_current}
										className="w-full bg-dark-700 border border-dark-600 rounded p-2 text-white focus:border-neon-purple focus:outline-none disabled:opacity-50"
									/>
								</div>
								<div className="flex items-end">
									<label className="flex items-center gap-2 cursor-pointer">
										<input
											type="checkbox"
											checked={jobForm.is_current}
											onChange={e => setJobForm({ ...jobForm, is_current: e.target.checked, endDate: '' })}
											className="w-4 h-4 accent-neon-green"
										/>
										<span className="text-sm text-gray-400">Current Position</span>
									</label>
								</div>
							</div>

							<div className="grid grid-cols-2 gap-4">
								<div>
									<label className="block text-sm text-gray-400 mb-1">Salary (Gross/Year)</label>
									<input
										type="number"
										value={jobForm.salary_gross_yr || ''}
										onChange={e => setJobForm({ ...jobForm, salary_gross_yr: Number(e.target.value) })}
										className="w-full bg-dark-700 border border-dark-600 rounded p-2 text-white focus:border-neon-purple focus:outline-none"
										placeholder="Private - for your records"
									/>
								</div>
								<div>
									<label className="block text-sm text-gray-400 mb-1">Currency</label>
									<select
										value={jobForm.currency}
										onChange={e => setJobForm({ ...jobForm, currency: e.target.value })}
										className="w-full bg-dark-700 border border-dark-600 rounded p-2 text-white focus:border-neon-purple focus:outline-none"
									>
										<option value="EUR">EUR</option>
										<option value="USD">USD</option>
										<option value="GBP">GBP</option>
										<option value="HUF">HUF</option>
									</select>
								</div>
							</div>

							<div>
								<label className="block text-sm text-gray-400 mb-1">Tech Stack (comma-separated)</label>
								<input
									type="text"
									value={jobForm.tech_stack}
									onChange={e => setJobForm({ ...jobForm, tech_stack: e.target.value })}
									className="w-full bg-dark-700 border border-dark-600 rounded p-2 text-white focus:border-neon-purple focus:outline-none"
									placeholder="e.g. React, TypeScript, Node.js, AWS"
								/>
							</div>

							<div>
								<label className="block text-sm text-gray-400 mb-1">Achievements (one per line)</label>
								<textarea
									value={jobForm.achievements}
									onChange={e => setJobForm({ ...jobForm, achievements: e.target.value })}
									className="w-full bg-dark-700 border border-dark-600 rounded p-2 text-white focus:border-neon-purple focus:outline-none min-h-[100px]"
									placeholder="• Improved system performance by 40%&#10;• Led migration to microservices"
								/>
							</div>
						</div>

						<div className="flex justify-end gap-3 mt-6 pt-4 border-t border-dark-600">
							<button
								onClick={() => { setIsJobModalOpen(false); resetJobForm(); }}
								className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
							>
								Cancel
							</button>
							<button
								onClick={handleSaveJob}
								disabled={!jobForm.company.trim() || !jobForm.role.trim()}
								className="btn-cyber px-6 py-2 flex items-center gap-2 disabled:opacity-50"
							>
								<Save className="w-4 h-4" />
								{editingJob ? 'Update' : 'Add'} Position
							</button>
						</div>
					</div>
				</div>
			)}

			{/* Education Modal */}
			{isEduModalOpen && (
				<div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
					<div className="card-cyber p-6 w-full max-w-xl max-h-[90vh] overflow-y-auto">
						<div className="flex items-center justify-between mb-6">
							<h2 className="text-xl font-bold text-white flex items-center gap-2">
								<GraduationCap className="w-5 h-5 text-neon-cyan" />
								{editingEdu ? 'Edit Education' : 'Add Education'}
							</h2>
							<button
								onClick={() => { setIsEduModalOpen(false); resetEduForm(); }}
								className="p-2 text-gray-400 hover:text-white"
							>
								<X className="w-5 h-5" />
							</button>
						</div>

						<div className="space-y-4">
							<div>
								<label className="block text-sm text-gray-400 mb-1">Institution *</label>
								<input
									type="text"
									value={eduForm.institution}
									onChange={e => setEduForm({ ...eduForm, institution: e.target.value })}
									className="w-full bg-dark-700 border border-dark-600 rounded p-2 text-white focus:border-neon-cyan focus:outline-none"
									placeholder="e.g. University of Padova"
								/>
							</div>

							<div>
								<label className="block text-sm text-gray-400 mb-1">Degree *</label>
								<input
									type="text"
									value={eduForm.degree}
									onChange={e => setEduForm({ ...eduForm, degree: e.target.value })}
									className="w-full bg-dark-700 border border-dark-600 rounded p-2 text-white focus:border-neon-cyan focus:outline-none"
									placeholder="e.g. MSc Computer Science"
								/>
							</div>

							<div>
								<label className="block text-sm text-gray-400 mb-1">Status</label>
								<select
									value={eduForm.status}
									onChange={e => setEduForm({ ...eduForm, status: e.target.value as EducationStatus })}
									className="w-full bg-dark-700 border border-dark-600 rounded p-2 text-white focus:border-neon-cyan focus:outline-none"
								>
									{educationStatuses.map(s => (
										<option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
									))}
								</select>
							</div>

							<div className="grid grid-cols-2 gap-4">
								<div>
									<label className="block text-sm text-gray-400 mb-1">Start Date</label>
									<input
										type="date"
										value={eduForm.startDate}
										onChange={e => setEduForm({ ...eduForm, startDate: e.target.value })}
										className="w-full bg-dark-700 border border-dark-600 rounded p-2 text-white focus:border-neon-cyan focus:outline-none"
									/>
								</div>
								<div>
									<label className="block text-sm text-gray-400 mb-1">End Date (Expected)</label>
									<input
										type="date"
										value={eduForm.endDate}
										onChange={e => setEduForm({ ...eduForm, endDate: e.target.value })}
										className="w-full bg-dark-700 border border-dark-600 rounded p-2 text-white focus:border-neon-cyan focus:outline-none"
									/>
								</div>
							</div>

							<div>
								<label className="block text-sm text-gray-400 mb-1">Scholarship (optional)</label>
								<input
									type="text"
									value={eduForm.scholarship_name}
									onChange={e => setEduForm({ ...eduForm, scholarship_name: e.target.value })}
									className="w-full bg-dark-700 border border-dark-600 rounded p-2 text-white focus:border-neon-cyan focus:outline-none"
									placeholder="e.g. Regional Scholarship (7k)"
								/>
							</div>

							<div>
								<label className="block text-sm text-gray-400 mb-1">Thesis Title (optional)</label>
								<input
									type="text"
									value={eduForm.thesis_title}
									onChange={e => setEduForm({ ...eduForm, thesis_title: e.target.value })}
									className="w-full bg-dark-700 border border-dark-600 rounded p-2 text-white focus:border-neon-cyan focus:outline-none"
									placeholder="e.g. Machine Learning for Edge Computing"
								/>
							</div>
						</div>

						<div className="flex justify-end gap-3 mt-6 pt-4 border-t border-dark-600">
							<button
								onClick={() => { setIsEduModalOpen(false); resetEduForm(); }}
								className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
							>
								Cancel
							</button>
							<button
								onClick={handleSaveEdu}
								disabled={!eduForm.institution.trim() || !eduForm.degree.trim()}
								className="btn-cyber px-6 py-2 flex items-center gap-2 disabled:opacity-50"
							>
								<Save className="w-4 h-4" />
								{editingEdu ? 'Update' : 'Add'} Education
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
