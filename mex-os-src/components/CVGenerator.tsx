import { Document, Page, Text, View, StyleSheet, PDFDownloadLink } from '@react-pdf/renderer';
import { useData } from '../contexts/DataContext';
import { format } from 'date-fns';
import { FileText, Loader2 } from 'lucide-react';

// --- STYLES: PIXEL-PERFECT REFERENCE ALIGNMENT ---

const styles = StyleSheet.create({

	page: {
		paddingVertical: 16, // Corrected padding
		paddingHorizontal: 14, // Corrected padding
		fontFamily: 'Helvetica',
		fontSize: 9.5, // Baseline for body text
		lineHeight: 1.35, // Tighter leading
		color: '#000000',
	},

	// Header Container
	headerContainer: {
		flexDirection: 'column',
		marginBottom: 8,
		borderBottomWidth: 0.5,
		borderBottomColor: '#CCCCCC',
		paddingBottom: 6,
	},

	// Name & Title Stack
	nameBlock: {
		flexDirection: 'column',
	},

	name: {
		fontSize: 13,
		fontFamily: 'Helvetica-Bold',
		textTransform: 'uppercase',
		marginBottom: 1,
		letterSpacing: 0.5,
	},

	titleAndLocation: {
		flexDirection: 'row',
		marginBottom: 3,
		fontSize: 9.5,
		color: '#333333',
	},

	title: {
		fontFamily: 'Helvetica-Bold',
		marginRight: 8,
	},

	location: {
		fontFamily: 'Helvetica',
	},

	contactLine: {
		fontSize: 8.5,
		color: '#000000',
		marginBottom: 2,
		lineHeight: 1.3,
	},

	// Sections
	sectionHeader: {
		fontSize: 9.5,
		fontFamily: 'Helvetica-Bold',
		textTransform: 'uppercase',
		borderBottomWidth: 0.5,
		borderBottomColor: '#000000',
		marginBottom: 4,
		marginTop: 6,
		paddingBottom: 1.5,
		letterSpacing: 0.3,
	},

	// Professional Summary
	summaryText: {
		fontSize: 9,
		lineHeight: 1.4,
		marginBottom: 4,
		color: '#000000',
	},

	// Entries (Experience/Education)
	entryContainer: {
		marginBottom: 4,
		// wrap property removed from style object
	},

	// Role/Degree + Date Header
	headerRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'baseline',
		marginBottom: 0.5,
		gap: 8,
	},

	role: {
		fontSize: 9.5,
		fontFamily: 'Helvetica-Bold',
		flex: 1,
	},

	date: {
		fontSize: 8.5,
		color: '#555555',
		textAlign: 'right',
		// whiteSpace removed
	},

	// Company/Institution + Location
	companyRow: {
		fontSize: 9,
		fontFamily: 'Helvetica-Oblique',
		marginBottom: 2,
		color: '#333333',
		lineHeight: 1.3,
	},

	// Bullet Points - Em-dash style (–)
	bulletRow: {
		flexDirection: 'row',
		marginBottom: 1.5,
		marginLeft: 8,
	},

	bulletDash: {
		width: 8,
		fontSize: 8.5,
		marginRight: 4,
	},

	bulletText: {
		flex: 1,
		fontSize: 9,
		lineHeight: 1.35,
	},

	// Award/Thesis inline styling
	awardRow: {
		flexDirection: 'row',
		fontSize: 9,
		marginBottom: 1,
		marginLeft: 8,
		lineHeight: 1.3,
	},

	awardLabel: {
		fontFamily: 'Helvetica-Bold',
		marginRight: 4,
	},

	awardValue: {
		flex: 1,
	},

	// Skills - Grid layout (Category: Skill1, Skill2, Skill3)
	skillsContainer: {
		flexDirection: 'column',
	},

	skillRow: {
		flexDirection: 'row',
		marginBottom: 1.5,
		fontSize: 9,
		lineHeight: 1.3,
		flexWrap: 'wrap',
	},

	skillCategory: {
		fontFamily: 'Helvetica-Bold',
		marginRight: 4,
		minWidth: 70,
	},

	skillValues: {
		flex: 1,
	},

});

// Helper to format date range
const formatDateRange = (startDate: string, endDate: string | null): string => {
	const start = format(new Date(startDate), 'MMM yyyy');
	const end = endDate ? format(new Date(endDate), 'MMM yyyy') : 'Present';
	return `${start} – ${end}`;
};

// CV Document Component
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
		type: string;
		work_mode?: string;
		startDate: string;
		endDate: string | null;
		tech_stack: string[];
		achievements?: string[];
		is_current: boolean;
	}>;
	education: Array<{
		institution: string;
		degree: string;
		status: string;
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
	// Group skills by category
	const skillsByCategory = skills.reduce((acc, skill) => {
		const category = skill.category || 'other';
		if (!acc[category]) acc[category] = [];
		acc[category].push(skill.name);
		return acc;
	}, {} as Record<string, string[]>);

	// Sort jobs by date (most recent first)
	const sortedJobs = [...jobs].sort((a, b) =>
		new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
	);

	// Sort education by date (most recent first)
	const sortedEducation = [...education].sort((a, b) =>
		new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
	);

	// Category display names and order (matching reference CV)
	const categoryLabels: Record<string, string> = {
		language: 'Programming Languages',
		frontend: 'Frontend',
		backend: 'Backend',
		devops: 'DevOps & Tools',
		database: 'Databases',
		tools: 'Tools',
		'soft-skill': 'Spoken Languages',
		other: 'Other'
	};

	// Define the desired display order
	const labelOrder = [
		'Programming Languages',
		'Frameworks & Libraries',
		'Databases',
		'API & Protocols',
		'Cloud Platforms',
		'DevOps & Tools',
		'Methodologies & Concepts',
		'Spoken Languages',
		'Other'
	];

	// Build contact line (compact single line: email | LinkedIn | GitHub | phone)
	const contactParts: string[] = [];
	if (profile.email) contactParts.push(profile.email);
	if (profile.linkedin_url) contactParts.push('LinkedIn');
	if (profile.github_url) contactParts.push('GitHub');
	if (profile.phone) contactParts.push(profile.phone);
	const contactLine = contactParts.join('   |   ');

	// Merge skills with same display category
	const mergedSkillCategories: Record<string, string[]> = {};
	Object.entries(skillsByCategory).forEach(([cat, skillNames]) => {
		const displayLabel = categoryLabels[cat] || cat;
		if (!mergedSkillCategories[displayLabel]) {
			mergedSkillCategories[displayLabel] = [];
		}
		mergedSkillCategories[displayLabel].push(...skillNames);
	});

	// Sort categories for display
	const sortedSkillCategories = Object.entries(mergedSkillCategories).sort(([labelA], [labelB]) => {
		const indexA = labelOrder.indexOf(labelA);
		const indexB = labelOrder.indexOf(labelB);
		if (indexA !== -1 && indexB !== -1) return indexA - indexB;
		if (indexA !== -1) return -1;
		if (indexB !== -1) return 1;
		return labelA.localeCompare(labelB);
	});

	// Build location string - avoid duplication of (Remote)
	const buildLocationString = (job: { company: string; location: string; work_mode?: string }): string => {
		let result = job.company;

		if (job.location) {
			result += ` - ${job.location}`;
		}

		// Only append work_mode if it's NOT already in location string
		if (job.work_mode && !job.location.toLowerCase().includes(job.work_mode.toLowerCase())) {
			result += ` (${job.work_mode.charAt(0).toUpperCase() + job.work_mode.slice(1)})`;
		}

		return result;
	};

	return (
		<Document>
			<Page size="A4" style={styles.page}>
				{/* --- HEADER --- */}
				<View style={styles.headerContainer}>
					<View style={styles.nameBlock}>
						<Text style={styles.name}>{profile.name || 'Your Name'}</Text>

						<View style={styles.titleAndLocation}>
							{profile.professional_title && (
								<Text style={styles.title}>{profile.professional_title}</Text>
							)}
							{profile.location && (
								<Text style={styles.location}>{profile.location}</Text>
							)}
						</View>
					</View>

					{contactLine && (
						<Text style={styles.contactLine}>{contactLine}</Text>
					)}
				</View>

				{/* --- PROFESSIONAL SUMMARY --- */}
				{profile.professional_summary && (
					<>
						<Text style={styles.sectionHeader}>Professional Summary</Text>
						<Text style={styles.summaryText}>
							{profile.professional_summary}
						</Text>
					</>
				)}

				{/* --- WORK EXPERIENCE --- */}
				{sortedJobs.length > 0 && (
					<>
						<Text style={styles.sectionHeader}>Work Experience</Text>

						{sortedJobs.map((job, idx) => (
							<View key={idx} style={styles.entryContainer} wrap={false}>
								{/* Role + Date */}
								<View style={styles.headerRow}>
									<Text style={styles.role}>{job.role}</Text>
									<Text style={styles.date}>{formatDateRange(job.startDate, job.endDate)}</Text>
								</View>

								{/* Company - Location */}
								<Text style={styles.companyRow}>
									{buildLocationString(job)}
								</Text>

								{/* Achievements/Bullets */}
								{job.achievements && job.achievements.length > 0 && (
									<>
										{job.achievements.map((achievement, i) => (
											<View key={i} style={styles.bulletRow}>
												<Text style={styles.bulletDash}>-</Text>
												<Text style={styles.bulletText}>{achievement}</Text>
											</View>
										))}
									</>
								)}
							</View>
						))}
					</>
				)}

				{/* --- EDUCATION --- */}
				{sortedEducation.length > 0 && (
					<>
						<Text style={styles.sectionHeader}>Education</Text>

						{sortedEducation.map((edu, idx) => (
							<View key={idx} style={styles.entryContainer} wrap={false}>
								{/* Degree + Date */}
								<View style={styles.headerRow}>
									<Text style={styles.role}>{edu.degree}</Text>
									<Text style={styles.date}>{formatDateRange(edu.startDate, edu.endDate)}</Text>
								</View>

								{/* Institution - Location */}
								<Text style={styles.companyRow}>
									{edu.institution}{edu.location ? ` - ${edu.location}` : ''}
								</Text>

								{/* Award - inline */}
								{edu.scholarship_name && (
									<View style={styles.awardRow}>
										<Text style={styles.awardLabel}>Award:</Text>
										<Text style={styles.awardValue}>{edu.scholarship_name}</Text>
									</View>
								)}

								{/* Thesis - inline */}
								{edu.thesis_title && (
									<View style={styles.awardRow}>
										<Text style={styles.awardLabel}>Thesis:</Text>
										<Text style={styles.awardValue}>
											{edu.thesis_title}
											{edu.thesis_description ? `. ${edu.thesis_description}` : ''}
										</Text>
									</View>
								)}
							</View>
						))}
					</>
				)}

				{/* --- SKILLS - Grid Layout (Reference Style) --- */}
				{sortedSkillCategories.length > 0 && (
					<>
						<Text style={styles.sectionHeader}>Skills</Text>

						<View style={styles.skillsContainer}>
							{sortedSkillCategories.map(([label, skillNames], idx) => (
								<View key={idx} style={styles.skillRow}>
									<Text style={styles.skillCategory}>{label}:</Text>
									<Text style={styles.skillValues}>
										{skillNames.join(', ')}
									</Text>
								</View>
							))}
						</View>
					</>
				)}
			</Page>
		</Document>
	);
};

// Main CVGenerator component with download button
export function CVGenerator() {
	const { profile, jobs, education, skillDefinitions } = useData();

	// Filter skills marked for CV
	const cvSkills = skillDefinitions.filter(s => s.show_on_cv);

	// Prepare filename
	const fileName = profile?.name
		? `${profile.name.replace(/\s+/g, '_')}_CV.pdf`
		: 'My_CV.pdf';

	// Data for PDF
	const cvData: CVDocumentProps = {
		profile: profile || { name: 'Your Name' },
		jobs: jobs,
		education: education,
		skills: cvSkills,
	};

	return (
		<PDFDownloadLink
			document={<CVDocument {...cvData} />}
			fileName={fileName}
			className="btn-cyber px-4 py-2 flex items-center gap-2 no-underline"
		>
			{({ loading }) =>
				loading ? (
					<>
						<Loader2 className="w-4 h-4 animate-spin" />
						Preparing PDF...
					</>
				) : (
					<>
						<FileText className="w-4 h-4" />
						Download CV (PDF)
					</>
				)
			}
		</PDFDownloadLink>
	);
}
