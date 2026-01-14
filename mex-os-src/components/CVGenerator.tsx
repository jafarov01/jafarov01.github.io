import { Document, Page, Text, View, StyleSheet, PDFDownloadLink, Link, Image } from '@react-pdf/renderer';
import { useData } from '../contexts/DataContext';
import { format } from 'date-fns';
import { FileText, Loader2 } from 'lucide-react';

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

// Main Export
export function CVGenerator() {
	const { profile, jobs, education, skillDefinitions } = useData();
	const cvSkills = skillDefinitions.filter(s => s.show_on_cv);
	const fileName = profile?.name ? `${profile.name.replace(/\s+/g, '_')}_CV.pdf` : 'My_CV.pdf';

	return (
		<PDFDownloadLink
			document={<CVDocument profile={profile || { name: 'Your Name' }} jobs={jobs} education={education} skills={cvSkills} />}
			fileName={fileName}
			className="btn-cyber px-4 py-2 flex items-center gap-2 no-underline"
		>
			{({ loading }) => (
				loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Preparing...</> : <><FileText className="w-4 h-4" /> Download CV (PDF)</>
			)}
		</PDFDownloadLink>
	);
}
