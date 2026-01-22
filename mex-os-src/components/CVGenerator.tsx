import { useState, useMemo } from 'react';
import { Document, Page, Text, View, StyleSheet, PDFDownloadLink, Link, Image } from '@react-pdf/renderer';
import { useData } from '../contexts/DataContext';
import { format } from 'date-fns';
import { FileText, Loader2, X, Check, ChevronDown, Briefcase, Code } from 'lucide-react';
import type { CVProfile } from '../lib/seedData';

// --- PRODUCTION-PERFECT STYLES v8: 3-COLUMN GRID & CENTERED HEADERS ---

const styles = StyleSheet.create({
	page: {
		paddingVertical: 24, // Standard A4 margins
		paddingHorizontal: 28,
		fontFamily: 'Helvetica',
		fontSize: 9, // Compact base size
		lineHeight: 1.4,
		color: '#000000',
	},

	// ===== HEADER SECTION =====
	headerContainer: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'flex-start',
		marginBottom: 8,
	},

	headerLeftColumn: {
		flexDirection: 'column',
		maxWidth: '82%',
	},

	nameBlock: {
		flexDirection: 'column',
		marginBottom: 0,
	},

	name: {
		fontSize: 18, // 18pt Name
		fontFamily: 'Helvetica-Bold',
		textTransform: 'uppercase',
		marginBottom: 8, // Increased spacing per feedback (8-10pt)
		letterSpacing: 0.5,
	},

	titleAndLocation: {
		flexDirection: 'row',
		alignItems: 'center',
		marginBottom: 6,
		fontSize: 10,
		color: '#000000',
		gap: 12,
	},

	title: {
		fontFamily: 'Helvetica-Bold',
		textTransform: 'uppercase',
	},

	location: {
		fontFamily: 'Helvetica',
	},

	contactLine: {
		fontSize: 9,
		color: '#000000',
		marginTop: 2,
		lineHeight: 1.3,
	},

	// Photo Style
	photo: {
		width: 60,
		height: 60,
		borderRadius: 30,
		objectFit: 'cover',
	},

	// Clickable link styling
	link: {
		color: '#000000', // Clean look
		textDecoration: 'none',
	},

	// ===== SECTION HEADERS (CENTERED) =====
	sectionHeaderContainer: {
		marginTop: 10,
		marginBottom: 8,
		borderBottomWidth: 1,
		borderBottomColor: '#000000',
		paddingBottom: 2,
	},

	sectionHeaderText: {
		fontSize: 11,
		fontFamily: 'Helvetica-Bold',
		textTransform: 'uppercase',
		letterSpacing: 1,
		textAlign: 'center', // CENTERED per feedback
	},

	// ===== ENTRIES (Experience/Education) =====
	entryContainer: {
		marginBottom: 8,
		flexDirection: 'column',
	},

	headerRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'flex-end',
		marginBottom: 2,
	},

	role: {
		fontSize: 10,
		fontFamily: 'Helvetica-Bold',
		flex: 1,
	},

	date: {
		fontSize: 9,
		fontFamily: 'Helvetica',
		textAlign: 'right',
		minWidth: 80,
	},

	companyRow: {
		fontSize: 9,
		fontFamily: 'Helvetica-Oblique',
		marginBottom: 3,
		color: '#000000',
	},

	// ===== BULLETS =====
	bulletContainer: {
		marginLeft: 0,
	},

	bulletRow: {
		flexDirection: 'row',
		marginBottom: 2,
		paddingLeft: 8,
	},

	bulletDash: {
		width: 6,
		fontSize: 9,
		marginRight: 4,
	},

	bulletText: {
		flex: 1,
		fontSize: 9,
		lineHeight: 1.35,
		textAlign: 'left',
	},

	// Awards/Thesis
	inlineMetadata: {
		flexDirection: 'row',
		fontSize: 9,
		marginBottom: 2,
		paddingLeft: 8,
	},

	metadataLabel: {
		fontFamily: 'Helvetica-Bold',
		marginRight: 4,
	},

	// ===== 3-COLUMN SKILLS GRID =====
	skillsGrid: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		marginTop: 4,
		gap: 12,
	},

	skillColumn: {
		flex: 1,
		flexDirection: 'column',
	},

	skillBlock: {
		marginBottom: 6,
	},

	skillCategoryTitle: {
		fontSize: 9,
		fontFamily: 'Helvetica-Bold',
		textTransform: 'uppercase',
		marginBottom: 2,
	},

	skillText: {
		fontSize: 9,
		fontFamily: 'Helvetica',
		lineHeight: 1.3,
	},
});

// Helper: Format Date Range
const formatDateRange = (startDate: string, endDate: string | null): string => {
	const start = format(new Date(startDate), 'MMM yyyy');
	const end = endDate ? format(new Date(endDate), 'MMM yyyy') : 'Present';
	return `${start} – ${end}`;
};

// CV Props
interface CVDocumentProps {
	profile: {
		name: string;
		professional_title?: string;
		location?: string;
		email?: string;
		phone?: string;
		linkedin_url?: string;
		github_url?: string;
		professional_summary?: string;
		photo_url?: string;
	};
	jobs: Array<{
		company: string;
		role: string;
		location: string;
		work_mode?: string;
		startDate: string;
		endDate: string | null;
		achievements?: string[];
	}>;
	education: Array<{
		institution: string;
		degree: string;
		startDate: string;
		endDate: string | null;
		location?: string;
		scholarship_name?: string;
		thesis_title?: string;
		thesis_description?: string;
	}>;
	skills: Array<{
		name: string;
		category?: string;
	}>;
}

const CVDocument = ({ profile, jobs, education, skills }: CVDocumentProps) => {

	// --- PREPARE DATA ---

	// Sort jobs & education
	const sortedJobs = [...jobs].sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
	const sortedEducation = [...education].sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());

	// Group Skills
	const skillsMap = skills.reduce((acc, skill) => {
		const cat = skill.category || 'other';
		if (!acc[cat]) acc[cat] = [];
		acc[cat].push(skill.name);
		return acc;
	}, {} as Record<string, string[]>);

	// MAPPING: Categories -> 3 COLUMNS (Reference CV)
	// Col 1: Programming Languages, Frameworks
	// Col 2: API & Protocols, Cloud Platforms, DevOps
	// Col 3: Methodologies, Spoken Languages
	// + Mappings for Frontend/Backend/Database into these buckets based on likely user intent or explicit keys.

	// Category Keys to Display Name
	const labels: Record<string, string> = {
		'language': 'Programming Languages',
		'frameworks-libraries': 'Frameworks & Libraries',
		'frontend': 'Frontend Development',
		'backend': 'Backend Development',
		'database': 'Databases',
		'api-protocols': 'API & Protocols',
		'cloud-platforms': 'Cloud Platforms',
		'devops': 'DevOps',
		'tools': 'Tools',
		'methodologies': 'Methodologies',
		'soft-skill': 'Spoken Languages',
		'other': 'Other Skills'
	};

	// Define Column Buckets using raw category keys
	// Note: We include standard keys to catch any data using them.
	const col1Keys = ['language', 'frameworks-libraries', 'frontend', 'backend'];
	const col2Keys = ['api-protocols', 'cloud-platforms', 'devops', 'database', 'tools'];
	const col3Keys = ['methodologies', 'soft-skill', 'other'];

	const getCategorizedSkills = (keys: string[]) => {
		return keys
			.filter(key => skillsMap[key] && skillsMap[key].length > 0)
			.map(key => ({
				label: labels[key] || key,
				items: skillsMap[key]
			}));
	};

	const col1Data = getCategorizedSkills(col1Keys);
	const col2Data = getCategorizedSkills(col2Keys);
	const col3Data = getCategorizedSkills(col3Keys);

	// Helper: Contact Line
	const buildContactLine = () => {
		const parts = [];
		if (profile.email) parts.push(<Text key="email">{profile.email}</Text>);
		if (profile.linkedin_url) parts.push(<Link key="li" src={profile.linkedin_url} style={styles.link}>LinkedIn</Link>);
		if (profile.github_url) parts.push(<Link key="gh" src={profile.github_url} style={styles.link}>GitHub</Link>);
		if (profile.phone) parts.push(<Text key="ph">{profile.phone}</Text>);

		// Join with separator
		const joined: React.ReactNode[] = []; // Explicit type definition
		parts.forEach((p, i) => {
			joined.push(p);
			if (i < parts.length - 1) joined.push(<Text key={`s${i}`}>   |   </Text>);
		});
		return joined;
	};

	// Helper: Clean Location (Remove duplicate Remote)
	const formatLocation = (job: any) => {
		let loc = job.location || '';
		const mode = job.work_mode || '';

		// Remove existing "(Remote)" variations to start fresh
		loc = loc.replace(/\s*\(?Remote\)?/gi, '').trim();

		let companyRow = job.company;
		if (loc) companyRow += ` - ${loc}`;

		if (mode && mode.toLowerCase() === 'remote') {
			companyRow += ' (Remote)';
		} else if (mode) {
			companyRow += ` (${mode.charAt(0).toUpperCase() + mode.slice(1)})`;
		}
		return companyRow;
	};

	return (
		<Document>
			<Page size="A4" style={styles.page}>

				{/* HEADER */}
				<View style={styles.headerContainer}>
					<View style={styles.headerLeftColumn}>
						<View style={styles.nameBlock}>
							<Text style={styles.name}>{profile.name || 'Your Name'}</Text>
							<View style={styles.titleAndLocation}>
								{profile.professional_title && <Text style={styles.title}>{profile.professional_title}</Text>}
								{profile.professional_title && profile.location && <Text> | </Text>}
								{profile.location && <Text style={styles.location}>{profile.location}</Text>}
							</View>
						</View>
						<View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
							{buildContactLine()}
						</View>
					</View>

					{profile.photo_url && (
						<Image src={profile.photo_url} style={styles.photo} />
					)}
				</View>

				{/* SUMMARY */}
				{profile.professional_summary && (
					<View wrap={false}>
						<View style={styles.sectionHeaderContainer}>
							<Text style={styles.sectionHeaderText}>Professional Summary</Text>
						</View>
						<Text style={{ fontSize: 9, lineHeight: 1.4, textAlign: 'justify' }}>
							{profile.professional_summary}
						</Text>
					</View>
				)}

				{/* EXPERIENCE */}
				{sortedJobs.length > 0 && (
					<View>
						<View style={styles.sectionHeaderContainer}>
							<Text style={styles.sectionHeaderText}>Work Experience</Text>
						</View>
						{sortedJobs.map((job, idx) => (
							<View key={idx} style={styles.entryContainer} wrap={false}>
								<View style={styles.headerRow}>
									<Text style={styles.role}>{job.role}</Text>
									<Text style={styles.date}>{formatDateRange(job.startDate, job.endDate)}</Text>
								</View>
								<Text style={styles.companyRow}>{formatLocation(job)}</Text>
								{job.achievements && (
									<View style={styles.bulletContainer}>
										{job.achievements.map((ach, i) => (
											<View key={i} style={styles.bulletRow}>
												<Text style={styles.bulletDash}>-</Text>
												<Text style={styles.bulletText}>{ach}</Text>
											</View>
										))}
									</View>
								)}
							</View>
						))}
					</View>
				)}

				{/* EDUCATION */}
				{sortedEducation.length > 0 && (
					<View>
						<View style={styles.sectionHeaderContainer}>
							<Text style={styles.sectionHeaderText}>Education</Text>
						</View>
						{sortedEducation.map((edu, idx) => (
							<View key={idx} style={styles.entryContainer} wrap={false}>
								<View style={styles.headerRow}>
									<Text style={styles.role}>{edu.degree}</Text>
									<Text style={styles.date}>{formatDateRange(edu.startDate, edu.endDate)}</Text>
								</View>
								<Text style={styles.companyRow}>
									{edu.institution}{edu.location ? ` - ${edu.location}` : ''}
								</Text>
								{edu.scholarship_name && (
									<View style={styles.inlineMetadata}>
										<Text style={styles.metadataLabel}>Award:</Text>
										<Text>{edu.scholarship_name}</Text>
									</View>
								)}
								{edu.thesis_title && (
									<View style={styles.inlineMetadata}>
										<Text style={styles.metadataLabel}>Thesis:</Text>
										<Text>{edu.thesis_title}</Text>
									</View>
								)}
							</View>
						))}
					</View>
				)}

				{/* SKILLS - 3 COLUMN GRID */}
				{(col1Data.length > 0 || col2Data.length > 0 || col3Data.length > 0) && (
					<View wrap={false}>
						<View style={styles.sectionHeaderContainer}>
							<Text style={styles.sectionHeaderText}>Skills</Text>
						</View>
						<View style={styles.skillsGrid}>

							{/* Column 1 */}
							<View style={styles.skillColumn}>
								{col1Data.map(group => (
									<View key={group.label} style={styles.skillBlock}>
										<Text style={styles.skillCategoryTitle}>{group.label}</Text>
										<Text style={styles.skillText}>{group.items.join(', ')}</Text>
									</View>
								))}
							</View>

							{/* Column 2 */}
							<View style={styles.skillColumn}>
								{col2Data.map(group => (
									<View key={group.label} style={styles.skillBlock}>
										<Text style={styles.skillCategoryTitle}>{group.label}</Text>
										<Text style={styles.skillText}>{group.items.join(', ')}</Text>
									</View>
								))}
							</View>

							{/* Column 3 */}
							<View style={styles.skillColumn}>
								{col3Data.map(group => (
									<View key={group.label} style={styles.skillBlock}>
										<Text style={styles.skillCategoryTitle}>{group.label}</Text>
										<Text style={styles.skillText}>{group.items.join(', ')}</Text>
									</View>
								))}
							</View>

						</View>
					</View>
				)}

			</Page>
		</Document>
	);
};

// Profile options
const CV_PROFILES: { value: CVProfile | 'full'; label: string; description: string }[] = [
	{ value: 'se', label: 'Software Engineering', description: 'Engineering & Developer roles' },
	{ value: 'cs', label: 'Customer Support', description: 'Support & Help Desk roles' },
	{ value: 'full', label: 'Full CV', description: 'Include all experiences' },
];

// Helper: Check if item matches profile
const matchesProfile = (itemProfiles: CVProfile[] | undefined, selectedProfile: CVProfile | 'full'): boolean => {
	if (selectedProfile === 'full') return true;
	if (!itemProfiles || itemProfiles.length === 0) return false;
	return itemProfiles.includes(selectedProfile) || itemProfiles.includes('all');
};

// Main Export - CV Generator with Modal
export function CVGenerator() {
	const { profile, jobs, education, skillDefinitions } = useData();
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [selectedProfile, setSelectedProfile] = useState<CVProfile | 'full'>('full');
	const [selectedJobIds, setSelectedJobIds] = useState<Set<string>>(new Set());
	const [selectedSkillIds, setSelectedSkillIds] = useState<Set<string>>(new Set());
	const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);

	// Get CV-ready skills
	const cvSkills = useMemo(() => skillDefinitions.filter(s => s.show_on_cv), [skillDefinitions]);

	// Initialize selections when modal opens
	const openModal = () => {
		// Auto-select items based on default profile
		const jobIds = new Set(jobs.filter(j => matchesProfile(j.cv_profiles, selectedProfile)).map(j => j.id));
		const skillIds = new Set(cvSkills.filter(s => matchesProfile(s.cv_profiles, selectedProfile)).map(s => s.id));
		setSelectedJobIds(jobIds);
		setSelectedSkillIds(skillIds);
		setIsModalOpen(true);
	};

	// Update selections when profile changes
	const handleProfileChange = (newProfile: CVProfile | 'full') => {
		setSelectedProfile(newProfile);
		const jobIds = new Set(jobs.filter(j => matchesProfile(j.cv_profiles, newProfile)).map(j => j.id));
		const skillIds = new Set(cvSkills.filter(s => matchesProfile(s.cv_profiles, newProfile)).map(s => s.id));
		setSelectedJobIds(jobIds);
		setSelectedSkillIds(skillIds);
		setIsProfileDropdownOpen(false);
	};

	// Toggle job selection
	const toggleJob = (jobId: string) => {
		const newSet = new Set(selectedJobIds);
		if (newSet.has(jobId)) {
			newSet.delete(jobId);
		} else {
			newSet.add(jobId);
		}
		setSelectedJobIds(newSet);
	};

	// Toggle skill selection
	const toggleSkill = (skillId: string) => {
		const newSet = new Set(selectedSkillIds);
		if (newSet.has(skillId)) {
			newSet.delete(skillId);
		} else {
			newSet.add(skillId);
		}
		setSelectedSkillIds(newSet);
	};

	// Get title based on profile
	const getTitle = (): string => {
		if (selectedProfile === 'se' && profile?.cv_titles?.se) {
			return profile.cv_titles.se;
		}
		if (selectedProfile === 'cs' && profile?.cv_titles?.cs) {
			return profile.cv_titles.cs;
		}
		return profile?.professional_title || 'Software Developer';
	};

	// Prepare filtered data for CV
	const filteredJobs = jobs.filter(j => selectedJobIds.has(j.id));
	const filteredSkills = cvSkills.filter(s => selectedSkillIds.has(s.id));

	// Build CV profile for document
	const cvProfile = {
		...profile,
		professional_title: getTitle(),
	};

	const fileName = profile?.name
		? `${profile.name.replace(/\s+/g, '_')}_CV${selectedProfile !== 'full' ? `_${selectedProfile.toUpperCase()}` : ''}.pdf`
		: 'My_CV.pdf';

	const selectedProfileLabel = CV_PROFILES.find(p => p.value === selectedProfile)?.label || 'Full CV';

	return (
		<>
			<button
				onClick={openModal}
				className="btn-cyber px-4 py-2 flex items-center gap-2"
			>
				<FileText className="w-4 h-4" />
				Download CV (PDF)
			</button>

			{isModalOpen && (
				<div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
					<div className="card-cyber p-0 w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
						{/* Header */}
						<div className="flex items-center justify-between p-6 pb-4 border-b border-dark-600">
							<h2 className="text-xl font-bold text-white flex items-center gap-2">
								<FileText className="w-5 h-5 text-neon-purple" />
								Generate CV
							</h2>
							<button
								onClick={() => setIsModalOpen(false)}
								className="p-2 text-gray-400 hover:text-white"
							>
								<X className="w-5 h-5" />
							</button>
						</div>

						{/* Content */}
						<div className="flex-1 overflow-y-auto p-6 space-y-6">
							{/* Profile Selector */}
							<div>
								<label className="block text-sm text-gray-400 mb-2">CV Profile</label>
								<div className="relative">
									<button
										onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
										className="w-full bg-dark-700 border border-dark-600 rounded p-3 text-white text-left flex items-center justify-between hover:border-neon-purple transition-colors"
									>
										<span>{selectedProfileLabel}</span>
										<ChevronDown className={`w-4 h-4 transition-transform ${isProfileDropdownOpen ? 'rotate-180' : ''}`} />
									</button>
									{isProfileDropdownOpen && (
										<div className="absolute top-full left-0 right-0 mt-1 bg-dark-700 border border-dark-600 rounded shadow-lg z-10">
											{CV_PROFILES.map(p => (
												<button
													key={p.value}
													onClick={() => handleProfileChange(p.value)}
													className={`w-full p-3 text-left hover:bg-dark-600 transition-colors flex items-center justify-between ${selectedProfile === p.value ? 'bg-dark-600' : ''
														}`}
												>
													<div>
														<div className="text-white font-medium">{p.label}</div>
														<div className="text-xs text-gray-500">{p.description}</div>
													</div>
													{selectedProfile === p.value && <Check className="w-4 h-4 text-neon-green" />}
												</button>
											))}
										</div>
									)}
								</div>
								<p className="text-xs text-gray-500 mt-2">
									Title: <span className="text-neon-cyan">{getTitle()}</span>
								</p>
							</div>

							{/* Jobs Selection */}
							<div>
								<div className="flex items-center gap-2 mb-3">
									<Briefcase className="w-4 h-4 text-neon-green" />
									<span className="text-sm text-gray-400">Work Experience ({selectedJobIds.size}/{jobs.length})</span>
								</div>
								<div className="space-y-2 max-h-48 overflow-y-auto">
									{jobs.map(job => (
										<label
											key={job.id}
											className={`flex items-center gap-3 p-3 rounded border cursor-pointer transition-all ${selectedJobIds.has(job.id)
												? 'bg-neon-green/10 border-neon-green/30'
												: 'bg-dark-700 border-dark-600 hover:border-dark-500'
												}`}
										>
											<input
												type="checkbox"
												checked={selectedJobIds.has(job.id)}
												onChange={() => toggleJob(job.id)}
												className="sr-only"
											/>
											<div className={`w-5 h-5 rounded border flex items-center justify-center ${selectedJobIds.has(job.id)
												? 'bg-neon-green border-neon-green'
												: 'border-dark-500'
												}`}>
												{selectedJobIds.has(job.id) && <Check className="w-3 h-3 text-dark-900" />}
											</div>
											<div className="flex-1">
												<div className="text-white font-medium">{job.role}</div>
												<div className="text-xs text-gray-500">{job.company}</div>
											</div>
											{job.cv_profiles && job.cv_profiles.length > 0 && (
												<div className="flex gap-1">
													{job.cv_profiles.map(p => (
														<span key={p} className="text-xs px-1.5 py-0.5 rounded bg-dark-600 text-gray-400">
															{p.toUpperCase()}
														</span>
													))}
												</div>
											)}
										</label>
									))}
								</div>
							</div>

							{/* Skills Selection */}
							<div>
								<div className="flex items-center gap-2 mb-3">
									<Code className="w-4 h-4 text-neon-purple" />
									<span className="text-sm text-gray-400">Skills ({selectedSkillIds.size}/{cvSkills.length})</span>
								</div>
								<div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
									{cvSkills.map(skill => (
										<button
											key={skill.id}
											onClick={() => toggleSkill(skill.id)}
											className={`px-3 py-1.5 rounded text-sm transition-all ${selectedSkillIds.has(skill.id)
												? 'bg-neon-purple/20 text-neon-purple border border-neon-purple/30'
												: 'bg-dark-700 text-gray-400 border border-dark-600 hover:border-dark-500'
												}`}
										>
											{skill.name}
										</button>
									))}
								</div>
							</div>
						</div>

						{/* Footer */}
						<div className="p-6 pt-4 border-t border-dark-600 flex items-center justify-between">
							<p className="text-sm text-gray-500">
								{filteredJobs.length} jobs, {filteredSkills.length} skills selected
							</p>
							<PDFDownloadLink
								document={<CVDocument profile={{ ...cvProfile, name: cvProfile?.name || 'Your Name' }} jobs={filteredJobs} education={education} skills={filteredSkills} />}
								fileName={fileName}
								className="btn-cyber px-4 py-2 flex items-center gap-2 no-underline"
							>
								{({ loading }) => (
									loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Preparing...</> : <><FileText className="w-4 h-4" /> Download PDF</>
								)}
							</PDFDownloadLink>
						</div>
					</div>
				</div>
			)}
		</>
	);
}
