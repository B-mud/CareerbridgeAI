/**
 * Session Manager for handling user data persistence with Supabase
 */

import { createClient } from '@/lib/supabase/client'

export interface UserProfile {
  name: string
  age: string
  profession: string
  experience: string
  interests: string[]
  created_at: string
  session_id: string
}

export interface ResumeAnalysis {
  personal_info: {
    name: string
    email?: string
    phone?: string
  }
  detected_skills: string[]
  missing_skills: string[]
  skill_scores: Record<string, number>
  recommendations: string[]
  experience: Array<{
    title: string
    company: string
  }>
  education: {
    level: string
    institutions: string[]
  }
  ai_analysis: {
    experience_years: number
    experience_level: string
    overall_match_score: number
  }
}

export class SessionManager {
  private static readonly USER_PROFILE_KEY = 'user_profile'
  private static readonly RESUME_ANALYSIS_KEY = 'resume_analysis'
  private static readonly RESUME_FILE_ID_KEY = 'resume_file_id'
  private static readonly SESSION_TIMEOUT = 24 * 60 * 60 * 1000 // 24 hours

  // ==================== Supabase Methods ====================

  /**
   * Save user profile to Supabase
   */
  static async saveProfileToSupabase(userId: string, profile: Partial<UserProfile>): Promise<void> {
    const supabase = createClient()
    
    const { error } = await supabase
      .from('profiles')
      .upsert({
        user_id: userId,
        name: profile.name || null,
        age: profile.age || null,
        profession: profile.profession || null,
        experience: profile.experience || null,
        interests: profile.interests || null,
        updated_at: new Date().toISOString()
      })

    if (error) {
      console.error('Error saving profile to Supabase:', error)
      throw error
    }
  }

  /**
   * Get user profile from Supabase
   */
  static async getProfileFromSupabase(userId: string) {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 is "not found" error
      console.error('Error fetching profile from Supabase:', error)
      return null
    }

    return data
  }

  /**
   * Save resume to Supabase
   */
  static async saveResumeToSupabase(
    userId: string,
    fileName: string,
    fileUrl: string,
    fileId?: string
  ): Promise<string | null> {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('resumes')
      .insert({
        user_id: userId,
        file_name: fileName,
        file_url: fileUrl,
        file_id: fileId || null
      })
      .select()
      .single()

    if (error) {
      console.error('Error saving resume to Supabase:', error)
      throw error
    }

    return data?.id || null
  }

  /**
   * Save resume analysis to Supabase
   */
  static async saveResumeAnalysisToSupabase(
    userId: string,
    resumeId: string,
    analysis: ResumeAnalysis
  ): Promise<void> {
    const supabase = createClient()
    
    const { error } = await supabase
      .from('resume_analysis')
      .insert({
        user_id: userId,
        resume_id: resumeId,
        personal_info: analysis.personal_info as any,
        detected_skills: analysis.detected_skills,
        missing_skills: analysis.missing_skills,
        skill_scores: analysis.skill_scores as any,
        experience: analysis.experience as any,
        education: analysis.education as any,
        ai_analysis: analysis.ai_analysis as any
      })

    if (error) {
      console.error('Error saving resume analysis to Supabase:', error)
      throw error
    }

    // Also save detected skills to skills table
    if (analysis.detected_skills.length > 0) {
      await this.saveSkillsToSupabase(userId, analysis.detected_skills, true)
    }
  }

  /**
   * Get resume analysis from Supabase
   */
  static async getResumeAnalysisFromSupabase(userId: string) {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('resume_analysis')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching resume analysis from Supabase:', error)
      return null
    }

    return data
  }

  /**
   * Save skills to Supabase
   */
  static async saveSkillsToSupabase(
    userId: string,
    skills: string[],
    isDetected: boolean = false
  ): Promise<void> {
    const supabase = createClient()
    
    const skillsData = skills.map(skill => ({
      user_id: userId,
      skill_name: skill,
      is_detected: isDetected,
      source: isDetected ? 'resume' : 'manual'
    }))

    const { error } = await supabase
      .from('skills')
      .upsert(skillsData, {
        onConflict: 'user_id,skill_name',
        ignoreDuplicates: false
      })

    if (error) {
      console.error('Error saving skills to Supabase:', error)
      throw error
    }
  }

  /**
   * Save recommendations to Supabase
   */
  static async saveRecommendationsToSupabase(
    userId: string,
    analysisId: string,
    recommendations: Array<{
      type: string
      title: string
      description: string
      priority?: string
    }>
  ): Promise<void> {
    const supabase = createClient()
    
    const recsData = recommendations.map(rec => ({
      user_id: userId,
      resume_analysis_id: analysisId,
      recommendation_type: rec.type,
      title: rec.title,
      description: rec.description,
      priority: rec.priority || 'medium'
    }))

    const { error } = await supabase
      .from('recommendations')
      .insert(recsData)

    if (error) {
      console.error('Error saving recommendations to Supabase:', error)
      throw error
    }
  }

  /**
   * Get recommendations from Supabase
   */
  static async getRecommendationsFromSupabase(userId: string) {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('recommendations')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching recommendations from Supabase:', error)
      return []
    }

    return data || []
  }

  // ==================== LocalStorage Methods (Backward Compatibility) ====================

  static saveUserProfile(profile: UserProfile): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(this.USER_PROFILE_KEY, JSON.stringify(profile))
    }
  }

  static getUserProfile(): UserProfile | null {
    if (typeof window === 'undefined') return null
    
    try {
      const stored = localStorage.getItem(this.USER_PROFILE_KEY)
      if (!stored) return null

      const profile = JSON.parse(stored) as UserProfile
      
      // Check if session is expired
      if (this.isSessionExpired(profile.created_at)) {
        this.clearUserData()
        return null
      }

      return profile
    } catch (error) {
      console.error('Error retrieving user profile:', error)
      return null
    }
  }

  static saveResumeAnalysis(analysis: ResumeAnalysis): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(this.RESUME_ANALYSIS_KEY, JSON.stringify(analysis))
    }
  }

  static getResumeAnalysis(): ResumeAnalysis | null {
    if (typeof window === 'undefined') return null
    
    try {
      const stored = localStorage.getItem(this.RESUME_ANALYSIS_KEY)
      return stored ? JSON.parse(stored) : null
    } catch (error) {
      console.error('Error retrieving resume analysis:', error)
      return null
    }
  }

  static saveFileId(fileId: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(this.RESUME_FILE_ID_KEY, fileId)
    }
  }

  static getFileId(): string | null {
    if (typeof window === 'undefined') return null
    return localStorage.getItem(this.RESUME_FILE_ID_KEY)
  }

  static clearUserData(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(this.USER_PROFILE_KEY)
      localStorage.removeItem(this.RESUME_ANALYSIS_KEY)
      localStorage.removeItem(this.RESUME_FILE_ID_KEY)
    }
  }

  static isSessionExpired(createdAt: string): boolean {
    const created = new Date(createdAt).getTime()
    const now = Date.now()
    return (now - created) > this.SESSION_TIMEOUT
  }

  static getSessionStatus(): {
    hasProfile: boolean
    hasAnalysis: boolean
    hasFileId: boolean
    isExpired: boolean
  } {
    const profile = this.getUserProfile()
    const analysis = this.getResumeAnalysis()
    const fileId = this.getFileId()
    
    return {
      hasProfile: !!profile,
      hasAnalysis: !!analysis,
      hasFileId: !!fileId,
      isExpired: profile ? this.isSessionExpired(profile.created_at) : false
    }
  }

  static refreshSession(): void {
    const profile = this.getUserProfile()
    if (profile) {
      profile.created_at = new Date().toISOString()
      this.saveUserProfile(profile)
    }
  }
}