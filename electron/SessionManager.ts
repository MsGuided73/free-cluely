import * as fs from 'fs'
import * as path from 'path'
import {
  DevelopmentSession,
  DevelopmentProgress,
  DevelopmentStage
} from "../src/types/codingAssistant"

/**
 * Session management system for tracking development progress and state
 */
export class SessionManager {
  private sessionsFile: string
  private activeSessions: Map<string, DevelopmentSession> = new Map()
  private progressData: Map<string, DevelopmentProgress> = new Map()

  constructor(sessionsDir?: string) {
    // Default to user's home directory for session storage
    const defaultDir = sessionsDir || path.join(require('os').homedir(), '.cluely-sessions')
    this.sessionsFile = path.join(defaultDir, 'sessions.json')

    this.ensureStorageDirectory()
    this.loadExistingSessions()
  }

  /**
   * Ensure the storage directory exists
   */
  private ensureStorageDirectory(): void {
    const dir = path.dirname(this.sessionsFile)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
      console.log(`[SessionManager] Created sessions directory: ${dir}`)
    }
  }

  /**
   * Load existing sessions from storage
   */
  private loadExistingSessions(): void {
    try {
      if (fs.existsSync(this.sessionsFile)) {
        const data = fs.readFileSync(this.sessionsFile, 'utf-8')
        const sessionsObj = JSON.parse(data)

        // Convert stored sessions back to Map
        for (const [sessionId, sessionData] of Object.entries(sessionsObj.sessions || {})) {
          this.activeSessions.set(sessionId, sessionData as DevelopmentSession)
        }

        // Load progress data
        for (const [sessionId, progressData] of Object.entries(sessionsObj.progress || {})) {
          this.progressData.set(sessionId, progressData as DevelopmentProgress)
        }

        console.log(`[SessionManager] Loaded ${this.activeSessions.size} existing sessions`)
      }
    } catch (error) {
      console.error('[SessionManager] Error loading existing sessions:', error)
    }
  }

  /**
   * Save sessions to persistent storage
   */
  private saveSessions(): void {
    try {
      const sessionsObj = {
        sessions: Object.fromEntries(this.activeSessions),
        progress: Object.fromEntries(this.progressData),
        lastSaved: new Date().toISOString()
      }

      fs.writeFileSync(this.sessionsFile, JSON.stringify(sessionsObj, null, 2))
    } catch (error) {
      console.error('[SessionManager] Error saving sessions:', error)
    }
  }

  /**
   * Create a new development session
   */
  async createSession(session: DevelopmentSession): Promise<string> {
    console.log(`[SessionManager] Creating new session: ${session.id}`)

    this.activeSessions.set(session.id, session)

    // Initialize progress tracking
    const progress: DevelopmentProgress = {
      sessionId: session.id,
      stage: session.currentStage,
      completedSteps: 0,
      totalSteps: this.getDefaultStepsForStage(session.currentStage),
      currentTask: 'Session initialization',
      blockers: [],
      achievements: [],
      timeSpent: 0,
      lastUpdated: new Date()
    }

    this.progressData.set(session.id, progress)
    this.saveSessions()

    return session.id
  }

  /**
   * Get a session by ID
   */
  getSession(sessionId: string): DevelopmentSession | null {
    return this.activeSessions.get(sessionId) || null
  }

  /**
   * Get all active sessions
   */
  getAllSessions(): DevelopmentSession[] {
    return Array.from(this.activeSessions.values())
  }

  /**
   * Update session stage
   */
  async updateSessionStage(sessionId: string, newStage: DevelopmentStage): Promise<boolean> {
    const session = this.activeSessions.get(sessionId)
    if (!session) {
      console.error(`[SessionManager] Session not found: ${sessionId}`)
      return false
    }

    console.log(`[SessionManager] Updating session ${sessionId} stage: ${session.currentStage} -> ${newStage}`)

    session.currentStage = newStage
    session.lastActivity = new Date()

    // Update progress
    const progress = this.progressData.get(sessionId)
    if (progress) {
      progress.stage = newStage
      progress.totalSteps = this.getDefaultStepsForStage(newStage)
      progress.lastUpdated = new Date()
    }

    this.saveSessions()
    return true
  }

  /**
   * Add a completed task to a session
   */
  async addCompletedTask(sessionId: string, task: string): Promise<boolean> {
    const session = this.activeSessions.get(sessionId)
    if (!session) {
      console.error(`[SessionManager] Session not found: ${sessionId}`)
      return false
    }

    if (!session.completedTasks.includes(task)) {
      session.completedTasks.push(task)
      session.lastActivity = new Date()

      // Update progress
      const progress = this.progressData.get(sessionId)
      if (progress) {
        progress.completedSteps++
        progress.lastUpdated = new Date()
      }

      this.saveSessions()
    }

    return true
  }

  /**
   * Add an active task to a session
   */
  async addActiveTask(sessionId: string, task: string): Promise<boolean> {
    const session = this.activeSessions.get(sessionId)
    if (!session) {
      console.error(`[SessionManager] Session not found: ${sessionId}`)
      return false
    }

    if (!session.activeTasks.includes(task)) {
      session.activeTasks.push(task)
      session.lastActivity = new Date()

      // Update current task in progress
      const progress = this.progressData.get(sessionId)
      if (progress) {
        progress.currentTask = task
        progress.lastUpdated = new Date()
      }

      this.saveSessions()
    }

    return true
  }

  /**
   * Complete an active task
   */
  async completeActiveTask(sessionId: string, task: string): Promise<boolean> {
    const session = this.activeSessions.get(sessionId)
    if (!session) {
      console.error(`[SessionManager] Session not found: ${sessionId}`)
      return false
    }

    const taskIndex = session.activeTasks.indexOf(task)
    if (taskIndex > -1) {
      session.activeTasks.splice(taskIndex, 1)
      session.completedTasks.push(task)
      session.lastActivity = new Date()

      // Update progress
      const progress = this.progressData.get(sessionId)
      if (progress) {
        progress.completedSteps++
        progress.lastUpdated = new Date()
      }

      this.saveSessions()
      return true
    }

    return false
  }

  /**
   * Get progress for a session
   */
  getSessionProgress(sessionId: string): DevelopmentProgress | null {
    return this.progressData.get(sessionId) || null
  }

  /**
   * Update session progress
   */
  async updateSessionProgress(sessionId: string, updates: Partial<DevelopmentProgress>): Promise<boolean> {
    const progress = this.progressData.get(sessionId)
    if (!progress) {
      console.error(`[SessionManager] Progress not found for session: ${sessionId}`)
      return false
    }

    Object.assign(progress, updates, { lastUpdated: new Date() })

    // Update corresponding session's last activity
    const session = this.activeSessions.get(sessionId)
    if (session) {
      session.lastActivity = new Date()
    }

    this.saveSessions()
    return true
  }

  /**
   * Delete a session and its progress data
   */
  async deleteSession(sessionId: string): Promise<boolean> {
    console.log(`[SessionManager] Deleting session: ${sessionId}`)

    const deleted = this.activeSessions.delete(sessionId)
    this.progressData.delete(sessionId)

    if (deleted) {
      this.saveSessions()
    }

    return deleted
  }

  /**
   * Clean up old sessions (older than specified days)
   */
  async cleanupOldSessions(daysOld: number = 30): Promise<number> {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - daysOld)

    let cleanedCount = 0
    for (const [sessionId, session] of this.activeSessions.entries()) {
      if (session.lastActivity < cutoffDate) {
        this.deleteSession(sessionId)
        cleanedCount++
      }
    }

    if (cleanedCount > 0) {
      console.log(`[SessionManager] Cleaned up ${cleanedCount} old sessions`)
      this.saveSessions()
    }

    return cleanedCount
  }

  /**
   * Get session statistics
   */
  getSessionStats(): {
    totalSessions: number
    activeSessions: number
    sessionsByStage: Record<DevelopmentStage, number>
    averageSessionAge: number
  } {
    const now = new Date()
    const sessionsByStage: Record<DevelopmentStage, number> = {
      [DevelopmentStage.PLANNING]: 0,
      [DevelopmentStage.CODING]: 0,
      [DevelopmentStage.TESTING]: 0,
      [DevelopmentStage.DEBUGGING]: 0,
      [DevelopmentStage.DEPLOYMENT]: 0,
      [DevelopmentStage.REVIEW]: 0
    }

    let totalAge = 0

    for (const session of this.activeSessions.values()) {
      sessionsByStage[session.currentStage]++

      const age = now.getTime() - session.startTime.getTime()
      totalAge += age
    }

    return {
      totalSessions: this.activeSessions.size,
      activeSessions: this.activeSessions.size,
      sessionsByStage,
      averageSessionAge: this.activeSessions.size > 0 ? totalAge / this.activeSessions.size : 0
    }
  }

  /**
   * Export session data for backup or analysis
   */
  async exportSessionData(sessionId?: string): Promise<string> {
    if (sessionId) {
      const session = this.activeSessions.get(sessionId)
      const progress = this.progressData.get(sessionId)

      if (!session) {
        throw new Error(`Session not found: ${sessionId}`)
      }

      return JSON.stringify({
        session,
        progress,
        exportedAt: new Date().toISOString()
      }, null, 2)
    } else {
      // Export all sessions
      return JSON.stringify({
        sessions: Object.fromEntries(this.activeSessions),
        progress: Object.fromEntries(this.progressData),
        exportedAt: new Date().toISOString()
      }, null, 2)
    }
  }

  /**
   * Import session data from backup
   */
  async importSessionData(jsonData: string): Promise<number> {
    try {
      const data = JSON.parse(jsonData)
      let importedCount = 0

      if (data.sessions) {
        for (const [sessionId, sessionData] of Object.entries(data.sessions)) {
          this.activeSessions.set(sessionId, sessionData as DevelopmentSession)
          importedCount++
        }
      }

      if (data.progress) {
        for (const [sessionId, progressData] of Object.entries(data.progress)) {
          this.progressData.set(sessionId, progressData as DevelopmentProgress)
        }
      }

      if (importedCount > 0) {
        this.saveSessions()
        console.log(`[SessionManager] Imported ${importedCount} sessions`)
      }

      return importedCount
    } catch (error) {
      console.error('[SessionManager] Error importing session data:', error)
      throw new Error('Invalid session data format')
    }
  }

  /**
   * Get default steps for each development stage
   */
  private getDefaultStepsForStage(stage: DevelopmentStage): number {
    switch (stage) {
      case DevelopmentStage.PLANNING:
        return 5 // Analysis, Documentation, Architecture, Planning, Review
      case DevelopmentStage.CODING:
        return 8 // Setup, Core Features, Components, Integration, Polish, Review
      case DevelopmentStage.TESTING:
        return 6 // Unit Tests, Integration Tests, E2E Tests, Performance, Security, Review
      case DevelopmentStage.DEBUGGING:
        return 4 // Analysis, Fix, Test, Verify
      case DevelopmentStage.DEPLOYMENT:
        return 5 // Build, Test, Deploy, Monitor, Rollback Plan
      case DevelopmentStage.REVIEW:
        return 3 // Code Review, Documentation, Handoff
      default:
        return 5
    }
  }

  /**
   * Add a note to a session
   */
  async addSessionNote(sessionId: string, note: string): Promise<boolean> {
    const session = this.activeSessions.get(sessionId)
    if (!session) {
      console.error(`[SessionManager] Session not found: ${sessionId}`)
      return false
    }

    session.notes.push(note)
    session.lastActivity = new Date()
    this.saveSessions()

    return true
  }

  /**
   * Update session metadata
   */
  async updateSessionMetadata(sessionId: string, metadata: Record<string, any>): Promise<boolean> {
    const session = this.activeSessions.get(sessionId)
    if (!session) {
      console.error(`[SessionManager] Session not found: ${sessionId}`)
      return false
    }

    session.metadata = { ...session.metadata, ...metadata }
    session.lastActivity = new Date()
    this.saveSessions()

    return true
  }
}
