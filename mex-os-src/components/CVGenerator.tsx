import { Document, Page, Text, View, StyleSheet, PDFDownloadLink, Image } from '@react-pdf/renderer';
import { useData } from '../contexts/DataContext';
import { format } from 'date-fns';
import { FileText, Loader2 } from 'lucide-react';

// --- STYLES: COMPACT / SINGLE PAGE OPTIMIZED ---
const styles = StyleSheet.create({
	page: {
		padding: 20, // Reduced padding to maximize space
		fontFamily: 'Helvetica',
		fontSize: 9, // Reduced font size for compactness
		lineHeight: 1.3,
		color: '#000000',
	},
	// Header
	headerContainer: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'flex-start',
		marginBottom: 10,
		borderBottomWidth: 1,
		borderBottomColor: '#EEEEEE',
		paddingBottom: 5,
	},
	headerLeft: {
		flexDirection: 'column',
		maxWidth: '75%',
	},
	name: {
		fontSize: 20, // Slightly smaller to prevent wrapping
		fontFamily: 'Helvetica-Bold',
		textTransform: 'uppercase',
		marginBottom: 2,
	},
	title: {
		fontSize: 12,
		color: '#444444',
		marginBottom: 2,
	},
	contactLine: {
		fontSize: 9,
		color: '#000000',
	},
	photo: {
		width: 60,
		height: 60,
		borderRadius: 30, // Makes it circular
		objectFit: 'cover',
	},
	// Sections
	sectionHeader: {
		fontSize: 11,
		fontFamily: 'Helvetica-Bold',
		textTransform: 'uppercase',
		borderBottomWidth: 1,
		borderBottomColor: '#000000',
		marginBottom: 6,
		marginTop: 10,
		paddingBottom: 2,
	},
	// Entries (Experience/Education)
	entryContainer: {
		marginBottom: 6, // Tight spacing
	},
	headerRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'flex-end',
		marginBottom: 1,
	},
	role: {
		fontSize: 10,
		fontFamily: 'Helvetica-Bold',
	},
	date: {
		fontSize: 9,
		textAlign: 'right',
	},
	company: {
		fontSize: 9,
		fontFamily: 'Helvetica-Oblique',
		marginBottom: 2,
		color: '#333333',
	},
	// Bullet Points
	bulletRow: {
		flexDirection: 'row',
		marginBottom: 1,
	},
	bulletDot: {
		width: 10,
		fontSize: 10,
		marginLeft: 2,
	},
	bulletText: {
		flex: 1,
		fontSize: 9,
	},
	// Skills - List View Rows
	skillRow: {
		flexDirection: 'row',
		marginBottom: 2,
	},
	skillLabel: {
		fontFamily: 'Helvetica-Bold',
		width: 130, // Fixed width for labels to align nicely
	},
	skillValue: {
		flex: 1,
	},
	// Thesis/Award labels
	labelText: {
		fontSize: 9,
		marginBottom: 1,
	},
	boldLabel: {
		fontFamily: 'Helvetica-Bold',
	},
});

// Helper to format date range
const formatDateRange = (startDate: string, endDate: string | null): string => {
	const start = format(new Date(startDate), 'MMM yyyy'); // Compact date format: "Sep 2021"
	const end = endDate ? format(new Date(endDate), 'MMM yyyy') : 'Present';
	return `${start} – ${end}`;
};

// Helper component for bullet points
const Bullet = ({ children }: { children: string }) => (
	<View style={styles.bulletRow}>
		<Text style={styles.bulletDot}>•</Text>
		<Text style={styles.bulletText}>{children}</Text>
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

	// Category display names and order
	const categoryLabels: Record<string, string> = {
		language: 'Languages',
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
		'Languages',
		'Frontend',
		'Backend',
		'Databases',
		'DevOps & Tools',
		'Tools',
		'Spoken Languages',
		'Other'
	];

	// Build contact line (compact single line)
	const contactParts: string[] = [];
	if (profile.email) contactParts.push(profile.email);
	if (profile.linkedin_url) contactParts.push('LinkedIn');
	if (profile.github_url) contactParts.push('GitHub');
	if (profile.phone) contactParts.push(profile.phone);
	const contactLine = contactParts.join(' | ');

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
		// If both are found in the list, sort by index
		if (indexA !== -1 && indexB !== -1) return indexA - indexB;
		// If only A is found, it comes first
		if (indexA !== -1) return -1;
		// If only B is found, it comes first
		if (indexB !== -1) return 1;
		// If neither found, sort alphabetically
		return labelA.localeCompare(labelB);
	});

	return (
		<Document>
			<Page size="A4" style={styles.page}>
				{/* --- HEADER --- */}
				<View style={styles.headerContainer}>
					<View style={styles.headerLeft}>
						<Text style={styles.name}>{profile.name || 'Your Name'}</Text>
						{profile.professional_title && (
							<Text style={styles.title}>{profile.professional_title}</Text>
						)}
						{profile.location && (
							<Text style={styles.contactLine}>{profile.location}</Text>
						)}
						{contactLine && (
							<Text style={styles.contactLine}>{contactLine}</Text>
						)}
					</View>

					{/* Photo */}
					{profile.photo_url && (
						<Image
							style={styles.photo}
							src={profile.photo_url}
						/>
					)}
				</View>

				{/* --- PROFESSIONAL SUMMARY --- */}
				{profile.professional_summary && (
					<>
						<Text style={styles.sectionHeader}>Professional Summary</Text>
						<Text style={{ marginBottom: 5 }}>{profile.professional_summary}</Text>
					</>
				)}

				{/* --- WORK EXPERIENCE --- */}
				{sortedJobs.length > 0 && (
					<>
						<Text style={styles.sectionHeader}>Work Experience</Text>
						{sortedJobs.map((job, idx) => (
							// wrap={false} implements the "Ericsson Rule" - prevents splitting component across pages
							<View key={idx} style={styles.entryContainer} wrap={false}>
								<View style={styles.headerRow}>
									<Text style={styles.role}>{job.role}</Text>
									<Text style={styles.date}>
										{formatDateRange(job.startDate, job.endDate)}
									</Text>
								</View>

								{/* Sanitized Location String - avoids double (Remote) */}
								<Text style={styles.company}>
									{job.company}
									{job.location ? ` - ${job.location}` : ''}
									{/* Only append work_mode if it's NOT already in location string */}
									{job.work_mode && !job.location.toLowerCase().includes(job.work_mode.toLowerCase())
										? ` (${job.work_mode.charAt(0).toUpperCase() + job.work_mode.slice(1)})`
										: ''}
								</Text>

								{job.achievements && job.achievements.length > 0 && (
									<>
										{job.achievements.map((achievement, i) => (
											<Bullet key={i}>{achievement}</Bullet>
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
								<View style={styles.headerRow}>
									<Text style={styles.role}>{edu.degree}</Text>
									<Text style={styles.date}>
										{formatDateRange(edu.startDate, edu.endDate)}
									</Text>
								</View>
								<Text style={styles.company}>
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
										<Text style={styles.boldLabel}>Thesis: </Text>
										{edu.thesis_title}
										{edu.thesis_description ? `. ${edu.thesis_description}` : ''}
									</Text>
								)}
							</View>
						))}
					</>
				)}

				{/* --- SKILLS - Refactored to List View --- */}
				{sortedSkillCategories.length > 0 && (
					<>
						<Text style={styles.sectionHeader}>Skills</Text>
						<View style={styles.entryContainer} wrap={false}>
							{sortedSkillCategories.map(([label, skillNames]) => (
								<View key={label} style={styles.skillRow}>
									<Text style={styles.skillLabel}>{label}:</Text>
									<Text style={styles.skillValue}>{skillNames.join(', ')}</Text>
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
