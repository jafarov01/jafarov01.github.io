import { Document, Page, Text, View, StyleSheet, PDFDownloadLink, Link } from '@react-pdf/renderer';
import { useData } from '../contexts/DataContext';
import { format } from 'date-fns';
import { FileText, Loader2 } from 'lucide-react';

// --- PRODUCTION-PERFECT STYLES: PIXEL-PERFECT REFERENCE ALIGNMENT ---

const styles = StyleSheet.create({
	page: {
		paddingVertical: 16,
		paddingHorizontal: 14,
		fontFamily: 'Helvetica',
		fontSize: 9.5,
		lineHeight: 1.35,
		color: '#000000',
	},

	// ===== HEADER SECTION =====
	headerContainer: {
		flexDirection: 'column',
		marginBottom: 12,
		paddingBottom: 8,
	},

	nameBlock: {
		flexDirection: 'column',
		marginBottom: 3,
	},

	name: {
		fontSize: 13,
		fontFamily: 'Helvetica-Bold',
		textTransform: 'uppercase',
		marginBottom: 2,
		letterSpacing: 0.5,
	},

	titleAndLocation: {
		flexDirection: 'row',
		marginBottom: 4,
		fontSize: 9.5,
		color: '#333333',
		gap: 12,
	},

	title: {
		fontFamily: 'Helvetica-Bold',
	},

	location: {
		fontFamily: 'Helvetica',
	},

	contactLine: {
		fontSize: 8.5,
		color: '#000000',
		marginBottom: 0,
		lineHeight: 1.3,
	},

	// Clickable link styling for PDF
	link: {
		color: '#0066CC',
		textDecoration: 'underline',
	},

	// ===== SECTION HEADERS WITH CENTERED DIVIDER =====
	sectionHeaderContainer: {
		flexDirection: 'column',
		marginTop: 8,
		marginBottom: 6,
	},

	sectionHeaderText: {
		fontSize: 9.5,
		fontFamily: 'Helvetica-Bold',
		textTransform: 'uppercase',
		letterSpacing: 0.3,
		marginBottom: 2,
		textAlign: 'left',
	},

	sectionDivider: {
		borderBottomWidth: 1,
		borderBottomColor: '#000000',
		marginBottom: 4,
	},

	// ===== PROFESSIONAL SUMMARY =====
	summaryText: {
		fontSize: 9,
		lineHeight: 1.4,
		marginBottom: 4,
		color: '#000000',
		textAlign: 'justify',
	},

	// ===== WORK EXPERIENCE ENTRY =====
	entryContainer: {
		marginBottom: 6,
		flexDirection: 'column',
	},

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
		minWidth: 80,
	},

	companyRow: {
		fontSize: 9,
		fontFamily: 'Helvetica-Oblique',
		marginBottom: 2.5,
		color: '#333333',
		lineHeight: 1.3,
	},

	// ===== BULLET POINTS =====
	bulletRow: {
		flexDirection: 'row',
		marginBottom: 1.5,
		marginLeft: 8,
	},

	bulletDash: {
		width: 7,
		fontSize: 8.5,
		marginRight: 5,
	},

	bulletText: {
		flex: 1,
		fontSize: 9,
		lineHeight: 1.35,
		textAlign: 'justify',
	},

	// ===== AWARD/THESIS ROWS =====
	awardRow: {
		flexDirection: 'row',
		fontSize: 9,
		marginBottom: 1.5,
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

	// ===== SKILLS SECTION - 2-COLUMN GRID =====
	skillsContainer: {
		flexDirection: 'column',
	},

	skillRowWrapper: {
		flexDirection: 'row',
		marginBottom: 2,
		gap: 16,
	},

	skillCategoryColumn: {
		width: '30%',
		flexDirection: 'column',
	},

	skillCategory: {
		fontFamily: 'Helvetica-Bold',
		fontSize: 9,
		marginBottom: 1,
		color: '#000000',
	},

	skillValuesColumn: {
		width: '70%',
		flexDirection: 'column',
	},

	skillValue: {
		fontSize: 9,
		lineHeight: 1.3,
		color: '#000000',
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
		work_mode?: string; // Removed incorrect 'type' property
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
		'frameworks-libraries': 'Frameworks & Libraries',
		'api-protocols': 'API & Protocols',
		'cloud-platforms': 'Cloud Platforms',
		'methodologies': 'Methodologies & Concepts',
		other: 'Other'
	};

	// Define the desired display order (matches reference CV exactly)
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

	// Build contact line with links
	const buildContactLine = () => {
		const parts = [];

		if (profile.email) {
			parts.push(
				<Text key="email">{profile.email}</Text>
			);
		}

		if (profile.linkedin_url) {
			parts.push(
				<Link key="linkedin" src={profile.linkedin_url} style={styles.link}>
					LinkedIn
				</Link>
			);
		}

		if (profile.github_url) {
			parts.push(
				<Link key="github" src={profile.github_url} style={styles.link}>
					GitHub
				</Link>
			);
		}

		if (profile.phone) {
			parts.push(
				<Text key="phone">{profile.phone}</Text>
			);
		}

		// Intersperse separators
		const result: React.ReactNode[] = [];
		parts.forEach((part, idx) => {
			result.push(part);
			if (idx < parts.length - 1) {
				result.push(<Text key={`sep-${idx}`}>   |   </Text>);
			}
		});

		return result;
	};

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

		if (job.work_mode && !job.location.toLowerCase().includes(job.work_mode.toLowerCase())) {
			result += ` (${job.work_mode.charAt(0).toUpperCase() + job.work_mode.slice(1)})`;
		}

		return result;
	};

	return (
		<Document>
			<Page size="A4" style={styles.page}>

				{/* ===== HEADER ===== */}
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

					<View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 2 }}>
						{buildContactLine()}
					</View>
				</View>

				{/* ===== PROFESSIONAL SUMMARY ===== */}
				{profile.professional_summary && (
					<>
						<View style={styles.sectionHeaderContainer}>
							<Text style={styles.sectionHeaderText}>Professional Summary</Text>
							<View style={styles.sectionDivider} />
						</View>
						<Text style={styles.summaryText}>
							{profile.professional_summary}
						</Text>
					</>
				)}

				{/* ===== WORK EXPERIENCE ===== */}
				{sortedJobs.length > 0 && (
					<>
						<View style={styles.sectionHeaderContainer}>
							<Text style={styles.sectionHeaderText}>Work Experience</Text>
							<View style={styles.sectionDivider} />
						</View>

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

				{/* ===== EDUCATION ===== */}
				{sortedEducation.length > 0 && (
					<>
						<View style={styles.sectionHeaderContainer}>
							<Text style={styles.sectionHeaderText}>Education</Text>
							<View style={styles.sectionDivider} />
						</View>

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

				{/* ===== SKILLS - 2-COLUMN GRID LAYOUT ===== */}
				{sortedSkillCategories.length > 0 && (
					<>
						<View style={styles.sectionHeaderContainer}>
							<Text style={styles.sectionHeaderText}>Skills</Text>
							<View style={styles.sectionDivider} />
						</View>

						<View style={styles.skillsContainer}>
							{sortedSkillCategories.map(([label, skillNames], idx) => (
								<View key={idx} style={styles.skillRowWrapper} wrap={false}>
									<View style={styles.skillCategoryColumn}>
										<Text style={styles.skillCategory}>{label}:</Text>
									</View>
									<View style={styles.skillValuesColumn}>
										<Text style={styles.skillValue}>
											{skillNames.join(', ')}
										</Text>
									</View>
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
