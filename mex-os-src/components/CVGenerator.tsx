import { Document, Page, Text, View, StyleSheet, PDFDownloadLink, Image } from '@react-pdf/renderer';
import { useData } from '../contexts/DataContext';
import { format } from 'date-fns';
import { FileText, Loader2 } from 'lucide-react';

// PDF Styles - Exact match to ForSEJob.pdf structure as analyzed by Gemini
const styles = StyleSheet.create({
	page: {
		flexDirection: 'column',
		backgroundColor: '#FFFFFF',
		padding: 30, // 30pt margins
		fontFamily: 'Helvetica',
		fontSize: 10,
		lineHeight: 1.5,
	},
	// Header Section - Row layout for text + photo
	headerContainer: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'flex-start',
		marginBottom: 20,
		borderBottomWidth: 1,
		borderBottomColor: '#EEEEEE',
		paddingBottom: 10,
	},
	// Text column in header (left side)
	headerTextColumn: {
		flexDirection: 'column',
		maxWidth: '70%',
	},
	name: {
		fontSize: 24,
		fontFamily: 'Helvetica-Bold',
		textTransform: 'uppercase',
		marginBottom: 4,
		color: '#000000',
	},
	professionalTitle: {
		fontSize: 14,
		color: '#444444',
		marginBottom: 4,
	},
	contactInfo: {
		fontSize: 10,
		color: '#000000',
		marginBottom: 2,
	},
	// Profile Photo - Circular, passport size
	profilePhoto: {
		width: 70,
		height: 70,
		borderRadius: 35, // Makes it circular
		objectFit: 'cover',
	},
	// Section Headers
	sectionHeader: {
		fontSize: 12,
		fontFamily: 'Helvetica-Bold',
		textTransform: 'uppercase',
		letterSpacing: 1,
		borderBottomWidth: 1,
		borderBottomColor: '#000000',
		marginBottom: 10,
		marginTop: 15,
		paddingBottom: 2,
	},
	// Work Experience & Education Blocks
	entryContainer: {
		marginBottom: 10,
	},
	entryHeaderRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'flex-end',
		marginBottom: 2,
	},
	roleTitle: {
		fontSize: 11,
		fontFamily: 'Helvetica-Bold',
	},
	dateText: {
		fontSize: 10,
		textAlign: 'right',
	},
	companyLocation: {
		fontSize: 10,
		fontFamily: 'Helvetica-Oblique',
		marginBottom: 5,
		color: '#444444',
	},
	// Bullet Points
	bulletPoint: {
		flexDirection: 'row',
		marginBottom: 2,
	},
	bulletDot: {
		width: 10,
		fontSize: 10,
	},
	bulletContent: {
		flex: 1,
		fontSize: 10,
		lineHeight: 1.4,
	},
	// Skills Grid
	skillsContainer: {
		flexDirection: 'row',
		flexWrap: 'wrap',
	},
	skillColumn: {
		width: '50%',
		marginBottom: 5,
	},
	skillLabel: {
		fontFamily: 'Helvetica-Bold',
	},
	// Summary text
	summaryText: {
		fontSize: 10,
		lineHeight: 1.5,
		marginBottom: 10,
		textAlign: 'justify',
	},
	// Award/Thesis label
	labelText: {
		fontSize: 10,
		marginBottom: 2,
	},
	boldLabel: {
		fontFamily: 'Helvetica-Bold',
	},
});

// Helper to format date range
const formatDateRange = (startDate: string, endDate: string | null): string => {
	const start = format(new Date(startDate), 'MMMM yyyy');
	const end = endDate ? format(new Date(endDate), 'MMMM yyyy') : 'Present';
	return `${start} – ${end}`;
};

// Helper component for bullet points
const BulletItem = ({ text }: { text: string }) => (
	<View style={styles.bulletPoint}>
		<Text style={styles.bulletDot}>•</Text>
		<Text style={styles.bulletContent}>{text}</Text>
	</View>
);

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

	// Category display names
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

	// Build contact lines (split for cleaner layout next to photo)
	const contactLine1Parts: string[] = [];
	const contactLine2Parts: string[] = [];
	if (profile.email) contactLine1Parts.push(profile.email);
	if (profile.linkedin_url) contactLine1Parts.push('LinkedIn');
	if (profile.github_url) contactLine2Parts.push('GitHub');
	if (profile.phone) contactLine2Parts.push(profile.phone);

	// Merge skills with same display category
	const mergedSkillCategories: Record<string, string[]> = {};
	Object.entries(skillsByCategory).forEach(([cat, skillNames]) => {
		const displayLabel = categoryLabels[cat] || cat;
		if (!mergedSkillCategories[displayLabel]) {
			mergedSkillCategories[displayLabel] = [];
		}
		mergedSkillCategories[displayLabel].push(...skillNames);
	});

	return (
		<Document>
			<Page size="A4" style={styles.page}>
				{/* --- HEADER WITH PHOTO --- */}
				<View style={styles.headerContainer}>
					{/* Left Column: Text Info */}
					<View style={styles.headerTextColumn}>
						<Text style={styles.name}>{profile.name || 'Your Name'}</Text>
						{profile.professional_title && (
							<Text style={styles.professionalTitle}>{profile.professional_title}</Text>
						)}
						{profile.location && (
							<Text style={styles.contactInfo}>{profile.location}</Text>
						)}
						{contactLine1Parts.length > 0 && (
							<Text style={styles.contactInfo}>{contactLine1Parts.join(' | ')}</Text>
						)}
						{contactLine2Parts.length > 0 && (
							<Text style={styles.contactInfo}>{contactLine2Parts.join(' | ')}</Text>
						)}
					</View>

					{/* Right Column: Photo */}
					{profile.photo_url && (
						<Image
							style={styles.profilePhoto}
							src={profile.photo_url}
						/>
					)}
				</View>

				{/* --- PROFESSIONAL SUMMARY --- */}
				{profile.professional_summary && (
					<>
						<Text style={styles.sectionHeader}>Professional Summary</Text>
						<Text style={styles.summaryText}>{profile.professional_summary}</Text>
					</>
				)}

				{/* --- WORK EXPERIENCE --- */}
				{sortedJobs.length > 0 && (
					<>
						<Text style={styles.sectionHeader}>Work Experience</Text>
						{sortedJobs.map((job, idx) => (
							<View key={idx} style={styles.entryContainer}>
								<View style={styles.entryHeaderRow}>
									<Text style={styles.roleTitle}>{job.role}</Text>
									<Text style={styles.dateText}>
										{formatDateRange(job.startDate, job.endDate)}
									</Text>
								</View>
								<Text style={styles.companyLocation}>
									{job.company} - {job.location}
									{job.work_mode ? ` (${job.work_mode.charAt(0).toUpperCase() + job.work_mode.slice(1)})` : ''}
								</Text>
								{job.achievements && job.achievements.length > 0 && (
									<>
										{job.achievements.map((achievement, i) => (
											<BulletItem key={i} text={achievement} />
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
							<View key={idx} style={styles.entryContainer}>
								<View style={styles.entryHeaderRow}>
									<Text style={styles.roleTitle}>{edu.degree}</Text>
									<Text style={styles.dateText}>
										{formatDateRange(edu.startDate, edu.endDate)}
									</Text>
								</View>
								<Text style={styles.companyLocation}>
									{edu.institution}{edu.location ? ` - ${edu.location}` : ''}
								</Text>
								{edu.scholarship_name && (
									<Text style={styles.labelText}>
										<Text style={styles.boldLabel}>Award: </Text>
										{edu.scholarship_name}
									</Text>
								)}
								{edu.thesis_title && (
									<Text style={styles.labelText}>
										<Text style={styles.boldLabel}>Thesis Project: </Text>
										{edu.thesis_title}
										{edu.thesis_description ? `. ${edu.thesis_description}` : ''}
									</Text>
								)}
							</View>
						))}
					</>
				)}

				{/* --- SKILLS --- */}
				{Object.keys(mergedSkillCategories).length > 0 && (
					<>
						<Text style={styles.sectionHeader}>Skills</Text>
						<View style={styles.skillsContainer}>
							{Object.entries(mergedSkillCategories).map(([label, skillNames]) => (
								<View key={label} style={styles.skillColumn}>
									<Text style={{ fontSize: 10 }}>
										<Text style={styles.skillLabel}>{label}: </Text>
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
