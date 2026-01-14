import { Document, Page, Text, View, StyleSheet, PDFDownloadLink, Link } from '@react-pdf/renderer';
import { useData } from '../contexts/DataContext';
import { format } from 'date-fns';
import { FileText, Loader2 } from 'lucide-react';

// PDF Styles - Matching the reference CV (ForSEJob.pdf) structure
const styles = StyleSheet.create({
	page: {
		padding: 40,
		paddingTop: 35,
		paddingBottom: 35,
		fontSize: 10,
		fontFamily: 'Helvetica',
		color: '#222222',
		lineHeight: 1.3,
	},
	// Header section - Name centered, large
	header: {
		alignItems: 'center',
		marginBottom: 12,
	},
	name: {
		fontSize: 24,
		fontFamily: 'Helvetica-Bold',
		color: '#000000',
		marginBottom: 2,
	},
	title: {
		fontSize: 11,
		color: '#444444',
		marginBottom: 8,
	},
	contactLine: {
		fontSize: 9,
		color: '#333333',
		textAlign: 'center',
	},
	link: {
		color: '#0066cc',
		textDecoration: 'none',
	},
	// Section styles - Centered, uppercase headings
	section: {
		marginTop: 14,
		marginBottom: 6,
	},
	sectionTitle: {
		fontSize: 11,
		fontFamily: 'Helvetica-Bold',
		color: '#000000',
		textAlign: 'center',
		textTransform: 'uppercase',
		letterSpacing: 1,
		marginBottom: 8,
		paddingBottom: 2,
	},
	// Professional Summary
	summary: {
		fontSize: 10,
		lineHeight: 1.4,
		color: '#333333',
		textAlign: 'justify',
	},
	// Experience & Education entries
	entryContainer: {
		marginBottom: 10,
	},
	entryHeader: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'flex-start',
		marginBottom: 1,
	},
	entryRole: {
		fontSize: 10,
		fontFamily: 'Helvetica-Bold',
		color: '#000000',
	},
	entryDate: {
		fontSize: 10,
		color: '#333333',
	},
	entryCompany: {
		fontSize: 10,
		fontStyle: 'italic',
		color: '#333333',
		marginBottom: 3,
	},
	bulletContainer: {
		flexDirection: 'row',
		marginBottom: 2,
		paddingLeft: 12,
	},
	bulletPoint: {
		width: 12,
		fontSize: 10,
		color: '#333333',
	},
	bulletText: {
		flex: 1,
		fontSize: 9.5,
		lineHeight: 1.35,
		color: '#333333',
		textAlign: 'justify',
	},
	// Skills section - Multi-column
	skillsGrid: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		gap: 8,
	},
	skillColumn: {
		width: '32%',
		marginBottom: 6,
	},
	skillCategory: {
		fontSize: 9,
		fontFamily: 'Helvetica-Bold',
		color: '#000000',
		marginBottom: 2,
	},
	skillList: {
		fontSize: 9,
		color: '#333333',
		lineHeight: 1.3,
	},
	// Award/Thesis styling
	awardText: {
		fontSize: 9.5,
		color: '#333333',
		marginTop: 2,
	},
	awardLabel: {
		fontFamily: 'Helvetica-Bold',
	},
});

// Helper to format date range
const formatDateRange = (startDate: string, endDate: string | null): string => {
	const start = format(new Date(startDate), 'MMMM yyyy');
	const end = endDate ? format(new Date(endDate), 'MMMM yyyy') : 'Present';
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

	// Category display names (matching reference CV structure)
	const categoryLabels: Record<string, string> = {
		language: 'Programming Languages',
		frontend: 'Frameworks & Libraries',
		backend: 'Frameworks & Libraries',
		devops: 'DevOps & Tools',
		database: 'Databases',
		tools: 'DevOps & Tools',
		'soft-skill': 'Methodologies & Concepts',
		other: 'Other Skills',
	};

	// Build contact line parts
	const contactParts: string[] = [];
	if (profile.location) contactParts.push(profile.location);

	// Build the contact line text
	const buildContactLine = () => {
		const parts: React.ReactNode[] = [];

		if (profile.email) {
			parts.push(<Text key="email">{profile.email}</Text>);
		}
		if (profile.linkedin_url) {
			const linkedinDisplay = 'LinkedIn';
			if (parts.length > 0) parts.push(<Text key="sep1"> | </Text>);
			parts.push(
				<Link key="linkedin" src={profile.linkedin_url} style={styles.link}>
					{linkedinDisplay}
				</Link>
			);
		}
		if (profile.github_url) {
			const githubDisplay = 'GitHub';
			if (parts.length > 0) parts.push(<Text key="sep2"> | </Text>);
			parts.push(
				<Link key="github" src={profile.github_url} style={styles.link}>
					{githubDisplay}
				</Link>
			);
		}
		if (profile.phone) {
			if (parts.length > 0) parts.push(<Text key="sep3"> | </Text>);
			parts.push(<Text key="phone">{profile.phone}</Text>);
		}

		return parts;
	};

	// Organize skills for multi-column display
	const skillCategories = Object.entries(skillsByCategory);

	return (
		<Document>
			<Page size="A4" style={styles.page}>
				{/* Header - Centered name and title */}
				<View style={styles.header}>
					<Text style={styles.name}>{profile.name || 'Your Name'}</Text>
					{profile.professional_title && (
						<Text style={styles.title}>{profile.professional_title}</Text>
					)}
					{profile.location && (
						<Text style={styles.contactLine}>{profile.location}</Text>
					)}
					<Text style={styles.contactLine}>
						{buildContactLine()}
					</Text>
				</View>

				{/* Professional Summary */}
				{profile.professional_summary && (
					<View style={styles.section}>
						<Text style={styles.sectionTitle}>Professional Summary</Text>
						<Text style={styles.summary}>{profile.professional_summary}</Text>
					</View>
				)}

				{/* Work Experience */}
				{sortedJobs.length > 0 && (
					<View style={styles.section}>
						<Text style={styles.sectionTitle}>Work Experience</Text>
						{sortedJobs.map((job, idx) => (
							<View key={idx} style={styles.entryContainer}>
								<View style={styles.entryHeader}>
									<Text style={styles.entryRole}>{job.role}</Text>
									<Text style={styles.entryDate}>
										{formatDateRange(job.startDate, job.endDate)}
									</Text>
								</View>
								<Text style={styles.entryCompany}>
									{job.company} - {job.location}{job.work_mode ? ` (${job.work_mode.charAt(0).toUpperCase() + job.work_mode.slice(1)})` : ''}
								</Text>
								{job.achievements && job.achievements.length > 0 && (
									<View>
										{job.achievements.map((achievement, i) => (
											<View key={i} style={styles.bulletContainer}>
												<Text style={styles.bulletPoint}>-</Text>
												<Text style={styles.bulletText}>{achievement}</Text>
											</View>
										))}
									</View>
								)}
							</View>
						))}
					</View>
				)}

				{/* Education */}
				{sortedEducation.length > 0 && (
					<View style={styles.section}>
						<Text style={styles.sectionTitle}>Education</Text>
						{sortedEducation.map((edu, idx) => (
							<View key={idx} style={styles.entryContainer}>
								<View style={styles.entryHeader}>
									<Text style={styles.entryRole}>{edu.degree}</Text>
									<Text style={styles.entryDate}>
										{formatDateRange(edu.startDate, edu.endDate)}
									</Text>
								</View>
								<Text style={styles.entryCompany}>
									{edu.institution}{edu.location ? ` - ${edu.location}` : ''}
								</Text>
								{edu.scholarship_name && (
									<View style={styles.bulletContainer}>
										<Text style={styles.bulletPoint}>-</Text>
										<Text style={styles.bulletText}>
											<Text style={styles.awardLabel}>Award: </Text>
											{edu.scholarship_name}
										</Text>
									</View>
								)}
								{edu.thesis_title && (
									<View style={styles.bulletContainer}>
										<Text style={styles.bulletPoint}>-</Text>
										<Text style={styles.bulletText}>
											<Text style={styles.awardLabel}>Thesis Project: </Text>
											{edu.thesis_title}
											{edu.thesis_description ? ` ${edu.thesis_description}` : ''}
										</Text>
									</View>
								)}
							</View>
						))}
					</View>
				)}

				{/* Skills - Multi-column layout */}
				{skillCategories.length > 0 && (
					<View style={styles.section}>
						<Text style={styles.sectionTitle}>Skills</Text>
						<View style={styles.skillsGrid}>
							{skillCategories.map(([category, skillNames]) => (
								<View key={category} style={styles.skillColumn}>
									<Text style={styles.skillCategory}>
										{categoryLabels[category] || category}:
									</Text>
									<Text style={styles.skillList}>
										{skillNames.join(', ')}
									</Text>
								</View>
							))}
						</View>
					</View>
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
