import { Document, Page, Text, View, StyleSheet, PDFDownloadLink } from '@react-pdf/renderer';
import { useData } from '../contexts/DataContext';
import { format } from 'date-fns';
import { FileText, Loader2 } from 'lucide-react';

// Register Helvetica as a standard font (already built-in for @react-pdf/renderer)
// Using default fonts for maximum ATS compatibility

// PDF Styles - ATS-friendly: single column, no tables, standard fonts
const styles = StyleSheet.create({
	page: {
		padding: 40,
		fontSize: 10,
		fontFamily: 'Helvetica',
		color: '#333333',
	},
	// Header section
	header: {
		marginBottom: 16,
		borderBottomWidth: 1,
		borderBottomColor: '#cccccc',
		paddingBottom: 12,
	},
	name: {
		fontSize: 22,
		fontFamily: 'Helvetica-Bold',
		color: '#1a1a1a',
		marginBottom: 4,
	},
	title: {
		fontSize: 12,
		color: '#555555',
		marginBottom: 8,
	},
	contactRow: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		gap: 8,
	},
	contactItem: {
		fontSize: 9,
		color: '#666666',
	},
	contactSeparator: {
		fontSize: 9,
		color: '#999999',
		marginHorizontal: 4,
	},
	// Section styles
	section: {
		marginBottom: 14,
	},
	sectionTitle: {
		fontSize: 12,
		fontFamily: 'Helvetica-Bold',
		color: '#1a1a1a',
		marginBottom: 8,
		textTransform: 'uppercase',
		letterSpacing: 0.5,
	},
	// Summary
	summary: {
		fontSize: 10,
		lineHeight: 1.5,
		color: '#444444',
		textAlign: 'justify',
	},
	// Experience & Education entries
	entryHeader: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		marginBottom: 2,
	},
	entryTitle: {
		fontSize: 11,
		fontFamily: 'Helvetica-Bold',
		color: '#1a1a1a',
	},
	entryDate: {
		fontSize: 9,
		color: '#666666',
	},
	entrySubtitle: {
		fontSize: 10,
		color: '#555555',
		marginBottom: 4,
	},
	entryLocation: {
		fontSize: 9,
		color: '#777777',
		fontStyle: 'italic',
	},
	bulletList: {
		marginTop: 4,
		marginLeft: 12,
	},
	bulletItem: {
		fontSize: 9,
		marginBottom: 2,
		lineHeight: 1.4,
		color: '#444444',
	},
	// Skills section
	skillCategory: {
		marginBottom: 6,
	},
	skillCategoryTitle: {
		fontSize: 10,
		fontFamily: 'Helvetica-Bold',
		color: '#333333',
		marginBottom: 2,
	},
	skillList: {
		fontSize: 9,
		color: '#555555',
		lineHeight: 1.4,
	},
	// Entry spacing
	entry: {
		marginBottom: 10,
	},
	// Thesis
	thesis: {
		marginTop: 2,
		fontSize: 9,
		fontStyle: 'italic',
		color: '#666666',
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
		frontend: 'Frontend',
		backend: 'Backend',
		devops: 'DevOps & Cloud',
		database: 'Databases',
		tools: 'Tools & Frameworks',
		'soft-skill': 'Soft Skills',
		other: 'Other',
	};

	// Build contact line
	const contactItems = [
		profile.location,
		profile.email,
		profile.phone,
		profile.linkedin_url ? profile.linkedin_url.replace('https://', '').replace('www.', '') : null,
		profile.github_url ? profile.github_url.replace('https://', '').replace('www.', '') : null,
	].filter(Boolean);

	return (
		<Document>
			<Page size="A4" style={styles.page}>
				{/* Header */}
				<View style={styles.header}>
					<Text style={styles.name}>{profile.name || 'Your Name'}</Text>
					{profile.professional_title && (
						<Text style={styles.title}>{profile.professional_title}</Text>
					)}
					<View style={styles.contactRow}>
						{contactItems.map((item, idx) => (
							<Text key={idx} style={styles.contactItem}>
								{item}{idx < contactItems.length - 1 ? '  |  ' : ''}
							</Text>
						))}
					</View>
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
							<View key={idx} style={styles.entry}>
								<View style={styles.entryHeader}>
									<Text style={styles.entryTitle}>{job.role}</Text>
									<Text style={styles.entryDate}>
										{formatDateRange(job.startDate, job.endDate)}
									</Text>
								</View>
								<Text style={styles.entrySubtitle}>
									{job.company}{job.work_mode ? ` (${job.work_mode})` : ''}
								</Text>
								{job.location && (
									<Text style={styles.entryLocation}>{job.location}</Text>
								)}
								{job.achievements && job.achievements.length > 0 && (
									<View style={styles.bulletList}>
										{job.achievements.map((ach, i) => (
											<Text key={i} style={styles.bulletItem}>• {ach}</Text>
										))}
									</View>
								)}
								{job.tech_stack && job.tech_stack.length > 0 && (
									<Text style={{ ...styles.bulletItem, marginTop: 4, marginLeft: 12 }}>
										Tech: {job.tech_stack.join(', ')}
									</Text>
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
							<View key={idx} style={styles.entry}>
								<View style={styles.entryHeader}>
									<Text style={styles.entryTitle}>{edu.degree}</Text>
									<Text style={styles.entryDate}>
										{formatDateRange(edu.startDate, edu.endDate)}
									</Text>
								</View>
								<Text style={styles.entrySubtitle}>{edu.institution}</Text>
								{edu.location && (
									<Text style={styles.entryLocation}>{edu.location}</Text>
								)}
								{edu.scholarship_name && (
									<Text style={styles.thesis}>🏆 {edu.scholarship_name}</Text>
								)}
								{edu.thesis_title && (
									<Text style={styles.thesis}>
										Thesis: "{edu.thesis_title}"
										{edu.thesis_description ? ` — ${edu.thesis_description}` : ''}
									</Text>
								)}
							</View>
						))}
					</View>
				)}

				{/* Technical Skills */}
				{Object.keys(skillsByCategory).length > 0 && (
					<View style={styles.section}>
						<Text style={styles.sectionTitle}>Technical Skills</Text>
						{Object.entries(skillsByCategory).map(([category, skillNames]) => (
							<View key={category} style={styles.skillCategory}>
								<Text style={styles.skillCategoryTitle}>
									{categoryLabels[category] || category}:
								</Text>
								<Text style={styles.skillList}>{skillNames.join(', ')}</Text>
							</View>
						))}
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
