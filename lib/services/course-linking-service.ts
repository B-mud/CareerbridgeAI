/**
 * Course Linking Service
 * Maps skills and courses to external learning platform URLs
 */

interface CourseMappingConfig {
  skill: string
  courseKeywords: string[]
  platforms: Record<string, string>
}

// Platform URL builders
const platformBuilders: Record<string, (skill: string, course: string) => string> = {
  udemy: (skill, course) => {
    const query = `${course} ${skill}`.replace(/\s+/g, "+")
    return `https://www.udemy.com/courses/search/?src=ukd&q=${query}`
  },
  coursera: (skill, course) => {
    const query = `${course} ${skill}`.replace(/\s+/g, "%20")
    return `https://www.coursera.org/search?query=${query}`
  },
  linkedin_learning: (skill, course) => {
    const query = `${course} ${skill}`.replace(/\s+/g, "-")
    return `https://www.linkedin.com/learning/search?keywords=${query}`
  },
  freecodecamp: (skill, course) => {
    return `https://www.freecodecamp.org/learn/${skill.toLowerCase().replace(/\s+/g, "-")}/`
  },
  youtube: (skill, course) => {
    const query = `${course} ${skill} tutorial`.replace(/\s+/g, "+")
    return `https://www.youtube.com/results?search_query=${query}`
  },
  w3schools: () => {
    return `https://www.w3schools.com/`
  },
  mdn: (skill, course) => {
    const query = skill.replace(/\s+/g, "+")
    return `https://developer.mozilla.org/en-US/search?q=${query}`
  },
  geeksforgeeks: (skill, course) => {
    const query = skill.replace(/\s+/g, "+")
    return `https://www.geeksforgeeks.org/search/?q=${query}`
  },
  roadmap_sh: (skill) => {
    const skillPath = skill.toLowerCase().replace(/\s+/g, "-")
    return `https://roadmap.sh/${skillPath}`
  },
}

// Skill to platform default mappings
const skillPlatformDefaults: Record<string, string[]> = {
  javascript: ["freecodecamp", "youtube", "udemy", "coursera"],
  python: ["freecodecamp", "youtube", "udemy", "coursera"],
  react: ["freecodecamp", "udemy", "coursera", "youtube"],
  "node.js": ["udemy", "coursera", "linkedin_learning", "youtube"],
  sql: ["udemy", "coursera", "w3schools", "geeksforgeeks"],
  "data structures": ["geeksforgeeks", "youtube", "udemy", "coursera"],
  algorithms: ["geeksforgeeks", "youtube", "udemy", "coursera"],
  web_design: ["freecodecamp", "udemy", "coursera", "youtube"],
  typescript: ["freecodecamp", "udemy", "coursera", "mdn"],
  devops: ["udemy", "coursera", "linux_academy"],
  aws: ["udemy", "coursera", "aws_training"],
  docker: ["udemy", "coursera", "youtube"],
  kubernetes: ["udemy", "coursera", "linux_foundation"],
  machine_learning: ["coursera", "udemy", "youtube"],
  "deep learning": ["coursera", "udemy", "youtube"],
}

interface CourseLinkResult {
  skill: string
  platform: string
  url: string
  courseName?: string
}

/**
 * Generate direct links to course platforms for a given skill
 */
export function generateCourseLinks(
  skill: string,
  courseName?: string
): CourseLinkResult[] {
  const skillLower = skill.toLowerCase()
  const platforms = skillPlatformDefaults[skillLower] || ["udemy", "youtube", "coursera"]

  const results: CourseLinkResult[] = []
  
  for (const platform of platforms) {
    const builder = platformBuilders[platform]
    if (!builder) continue

    const url = builder(skill, courseName || skill)
    results.push({
      skill,
      platform,
      url,
      courseName,
    })
  }

  return results
}

/**
 * Get the primary (best) course link for a skill
 */
export function getPrimaryCourseLink(
  skill: string,
  courseName?: string
): CourseLinkResult | null {
  const links = generateCourseLinks(skill, courseName)
  return links.length > 0 ? links[0] : null
}

/**
 * Generate Roadmap.sh link for learning path
 */
export function getRoadmapLink(skill: string): string {
  const skillPath = skill
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]/g, "")

  return `https://roadmap.sh/${skillPath}`
}

/**
 * Generate YouTube search link for a topic
 */
export function getYouTubeLink(topic: string): string {
  const query = `${topic} tutorial`.replace(/\s+/g, "+")
  return `https://www.youtube.com/results?search_query=${query}`
}

/**
 * Get all available learning resources for a skill
 */
export function getAllSkillResources(
  skill: string,
  courseName?: string
): Record<string, string> {
  const resources: Record<string, string> = {}

  // Add course platform links
  const courseLinks = generateCourseLinks(skill, courseName)
  courseLinks.forEach((link) => {
    resources[link.platform] = link.url
  })

  // Add Roadmap.sh
  resources["roadmap.sh"] = getRoadmapLink(skill)

  // Add YouTube
  resources["youtube"] = getYouTubeLink(courseName || skill)

  return resources
}

/**
 * Format a list of skills to their learning resources
 */
export interface SkillLearningPath {
  skill: string
  resources: Record<string, string>
  primaryResource: CourseLinkResult | null
}

export function buildSkillLearningPaths(skills: string[]): SkillLearningPath[] {
  return skills.map((skill) => ({
    skill,
    resources: getAllSkillResources(skill),
    primaryResource: getPrimaryCourseLink(skill),
  }))
}

/**
 * Detect platform from skill or course name
 */
export function detectBestPlatform(skill: string): string {
  const skillLower = skill.toLowerCase()

  if (
    skillLower.includes("javascript") ||
    skillLower.includes("js") ||
    skillLower.includes("web")
  ) {
    return "freecodecamp"
  }

  if (
    skillLower.includes("python") ||
    skillLower.includes("machine learning") ||
    skillLower.includes("data")
  ) {
    return "coursera"
  }

  if (skillLower.includes("devops") || skillLower.includes("cloud")) {
    return "udemy"
  }

  if (skillLower.includes("roadmap")) {
    return "roadmap_sh"
  }

  return "udemy"
}

/**
 * Create a direct learning path redirect object
 */
export interface LearningPathRedirect {
  skillName: string
  skill: string
  primaryLink: string
  allLinks: Record<string, string>
  redirectDelay?: number
}

export function createLearningPathRedirect(
  skill: string,
  courseName?: string,
  autoRedirectDelay?: number
): LearningPathRedirect {
  const primaryLink = getPrimaryCourseLink(skill, courseName)

  return {
    skillName: courseName || skill,
    skill,
    primaryLink: primaryLink?.url || generateCourseLinks(skill)[0]?.url || "https://udemy.com",
    allLinks: getAllSkillResources(skill, courseName),
    redirectDelay: autoRedirectDelay,
  }
}
