/**
 * Job Redirect Service
 * Maps job titles and searches to internal role pages and courses
 */

interface RoleMapping {
  roleName: string
  aliases: string[]
  keywords: string[]
  internalPath: string
  recommendedCourses?: string[]
  skills?: string[]
}

// Comprehensive role mappings
const roleMappings: Record<string, RoleMapping> = {
  frontend: {
    roleName: "Frontend Developer",
    aliases: ["frontend developer", "react developer", "vue developer", "angular developer", "web developer"],
    keywords: ["frontend", "react", "vue", "angular", "html", "css", "javascript", "web"],
    internalPath: "/dashboard/learning-paths/frontend-developer",
    recommendedCourses: ["React Mastery", "Advanced CSS", "Frontend Performance"],
    skills: ["React", "TypeScript", "Tailwind CSS", "Next.js", "Web API"],
  },
  backend: {
    roleName: "Backend Developer",
    aliases: ["backend developer", "python developer", "java developer", "nodejs developer"],
    keywords: ["backend", "python", "java", "nodejs", "node.js", "api", "server", "database"],
    internalPath: "/dashboard/learning-paths/backend-developer",
    recommendedCourses: ["Node.js Masterclass", "Python Advanced", "Database Design"],
    skills: ["Node.js", "Python", "SQL", "PostgreSQL", "API Design"],
  },
  fullstack: {
    roleName: "Full Stack Developer",
    aliases: ["full stack developer", "fullstack developer", "full-stack"],
    keywords: ["fullstack", "full-stack", "full stack", "mern", "mean"],
    internalPath: "/dashboard/learning-paths/fullstack-developer",
    recommendedCourses: ["MERN Stack", "Full Stack JavaScript", "Web Development Complete"],
    skills: ["React", "Node.js", "SQL", "MongoDB", "DevOps Basics"],
  },
  devops: {
    roleName: "DevOps Engineer",
    aliases: ["devops engineer", "devops", "infrastructure engineer", "cloud engineer"],
    keywords: ["devops", "docker", "kubernetes", "aws", "azure", "gcp", "ci/cd", "infrastructure"],
    internalPath: "/dashboard/learning-paths/devops-engineer",
    recommendedCourses: ["Docker & Kubernetes", "AWS Solutions", "CI/CD Pipelines"],
    skills: ["Docker", "Kubernetes", "AWS", "CI/CD", "Linux"],
  },
  data_scientist: {
    roleName: "Data Scientist",
    aliases: ["data scientist", "machine learning engineer", "ml engineer", "data analyst"],
    keywords: ["data scientist", "machine learning", "ml", "data", "python", "tensorflow", "pandas"],
    internalPath: "/dashboard/learning-paths/data-scientist",
    recommendedCourses: ["Machine Learning A-Z", "Deep Learning", "Data Analysis with Python"],
    skills: ["Python", "Machine Learning", "TensorFlow", "Data Analysis", "SQL"],
  },
  mobile: {
    roleName: "Mobile Developer",
    aliases: ["mobile developer", "ios developer", "android developer", "flutter developer", "react native developer"],
    keywords: ["mobile", "ios", "android", "flutter", "react native", "swift", "kotlin"],
    internalPath: "/dashboard/learning-paths/mobile-developer",
    recommendedCourses: ["React Native Complete", "Flutter Masterclass", "iOS Development"],
    skills: ["React Native", "Flutter", "Swift", "Kotlin", "Mobile UI"],
  },
  qa: {
    roleName: "QA Engineer",
    aliases: ["qa engineer", "qe", "test engineer", "automation engineer", "quality assurance"],
    keywords: ["qa", "quality", "test", "selenium", "automation", "testing"],
    internalPath: "/dashboard/learning-paths/qa-engineer",
    recommendedCourses: ["Selenium Mastery", "Test Automation", "QA Best Practices"],
    skills: ["Selenium", "TestNG", "Automation", "Manual Testing", "Python"],
  },
  database: {
    roleName: "Database Administrator",
    aliases: ["database administrator", "dba", "database engineer", "sql specialist"],
    keywords: ["database", "dba", "sql", "postgresql", "mysql", "mongodb", "oracle"],
    internalPath: "/dashboard/learning-paths/database-administrator",
    recommendedCourses: ["Advanced SQL", "Database Design", "PostgreSQL Mastery"],
    skills: ["SQL", "PostgreSQL", "MongoDB", "Database Design", "Performance Tuning"],
  },
  security: {
    roleName: "Cybersecurity Engineer",
    aliases: ["cybersecurity", "security engineer", "infosec", "penetration tester"],
    keywords: ["security", "cybersecurity", "secops", "infosec", "penetration", "hacking"],
    internalPath: "/dashboard/learning-paths/security-engineer",
    recommendedCourses: ["Cybersecurity Fundamentals", "Ethical Hacking", "Security Best Practices"],
    skills: ["Cybersecurity", "Linux", "Network Security", "Cryptography", "Ethical Hacking"],
  },
  ui_ux: {
    roleName: "UI/UX Designer",
    aliases: ["ui designer", "ux designer", "product designer", "interaction designer"],
    keywords: ["ui", "ux", "design", "figma", "sketch", "adobe"],
    internalPath: "/dashboard/learning-paths/ui-ux-designer",
    recommendedCourses: ["Figma Master", "UX Principles", "UI/UX Design Complete"],
    skills: ["Figma", "UI Design", "UX Research", "Prototyping", "CSS"],
  },
  cloud_architect: {
    roleName: "Cloud Architect",
    aliases: ["cloud architect", "solutions architect", "aws architect"],
    keywords: ["architect", "cloud", "aws", "azure", "gcp", "infrastructure"],
    internalPath: "/dashboard/learning-paths/cloud-architect",
    recommendedCourses: ["AWS Solutions Architect", "Cloud Architecture", "Microservices Design"],
    skills: ["AWS", "Cloud Design", "Architecture Patterns", "Scalability", "Security"],
  },
}

/**
 * Extract role from job title or search query
 */
export function detectRoleFromJobTitle(jobTitle: string): RoleMapping | null {
  const titleLower = jobTitle.toLowerCase().trim()

  // Direct keyword matching
  for (const [roleKey, roleMapping] of Object.entries(roleMappings)) {
    // Check if any alias matches
    if (roleMapping.aliases.some((alias) => titleLower.includes(alias))) {
      return roleMapping
    }

    // Check if multiple keywords match
    const matchedKeywords = roleMapping.keywords.filter((keyword) =>
      titleLower.includes(keyword)
    )
    if (matchedKeywords.length >= 2) {
      return roleMapping
    }
  }

  // Fall back to fuzzy matching on single keywords
  for (const [roleKey, roleMapping] of Object.entries(roleMappings)) {
    if (roleMapping.keywords.some((keyword) => titleLower.includes(keyword))) {
      return roleMapping
    }
  }

  return null
}

/**
 * Get redirect path for a job
 */
export function getRoleRedirectPath(jobTitle: string): string | null {
  const role = detectRoleFromJobTitle(jobTitle)
  return role ? role.internalPath : null
}

/**
 * Get recommended courses for a role
 */
export function getRoleRecommendedCourses(jobTitle: string): string[] {
  const role = detectRoleFromJobTitle(jobTitle)
  return role?.recommendedCourses || []
}

/**
 * Get required skills for a role
 */
export function getRoleRequiredSkills(jobTitle: string): string[] {
  const role = detectRoleFromJobTitle(jobTitle)
  return role?.skills || []
}

/**
 * Parse job search query to extract role and potential location
 */
export interface ParsedJobSearch {
  role: string | null
  location: string | null
  roleMapping: RoleMapping | null
  searchQuery: string
}

export function parseJobSearchQuery(query: string): ParsedJobSearch {
  const parts = query.split(/\s+in\s+|\s+at\s+|\s+@\s+/i)
  const roleQuery = parts[0].trim()
  const location = parts[1]?.trim() || null

  const roleMapping = detectRoleFromJobTitle(roleQuery)

  return {
    role: roleMapping?.roleName || roleQuery,
    location,
    roleMapping,
    searchQuery: query,
  }
}

/**
 * Generate a role-specific learning path URL
 */
export function generateRolePathURL(jobTitle: string): string {
  const role = detectRoleFromJobTitle(jobTitle)
  if (!role) return "/dashboard/learning-paths"

  // Generate base path from role name
  const roleSlug = role.roleName
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")

  return `/dashboard/learning-paths/${roleSlug}`
}

/**
 * Generate course recommendations URL for a role
 */
export function generateRoleCourseRecommendationsURL(jobTitle: string): string {
  const courses = getRoleRecommendedCourses(jobTitle)
  if (courses.length === 0) return "/dashboard/recommendations"

  // Add course filter to recommendations page
  return `/dashboard/recommendations?role=${encodeURIComponent(jobTitle)}`
}

/**
 * Check if a job title matches a target role
 */
export function isJobTitleMatchingRole(jobTitle: string, targetRole: string): boolean {
  const detected = detectRoleFromJobTitle(jobTitle)
  const target = detectRoleFromJobTitle(targetRole)

  if (!detected || !target) return false
  return detected.roleName === target.roleName
}

/**
 * Get all available roles
 */
export function getAllAvailableRoles(): RoleMapping[] {
  return Object.values(roleMappings)
}

/**
 * Get role by name
 */
export function getRoleByName(roleName: string): RoleMapping | null {
  const roleLower = roleName.toLowerCase()
  for (const roleMapping of Object.values(roleMappings)) {
    if (
      roleMapping.roleName.toLowerCase() === roleLower ||
      roleMapping.aliases.some((a) => a.toLowerCase() === roleLower)
    ) {
      return roleMapping
    }
  }
  return null
}
