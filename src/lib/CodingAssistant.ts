import { LLMHelper } from "../../electron/LLMHelper"
import {
  DevelopmentStage,
  ProjectType,
  ProgrammingLanguage,
  ProjectContext,
  DevelopmentSession,
  CodingAssistantConfig,
  FileAnalysis,
  ProjectHealth,
  DevelopmentProgress,
  CodingContext,
  CodingSuggestion,
  DocumentGenerationRequest,
  GeneratedDocument
} from "../types/codingAssistant"
import * as fs from 'fs'
import * as path from 'path'
import { glob } from 'glob'

/**
 * Enhanced coding assistant that extends LLMHelper with development-specific capabilities
 */
export class CodingAssistant extends LLMHelper {
  private currentSession: DevelopmentSession | null = null
  private config: CodingAssistantConfig
  private projectContext: ProjectContext | null = null
  private developmentProgress: Map<string, DevelopmentProgress> = new Map()

  constructor(apiKey?: string, useOllama?: boolean, ollamaModel?: string, ollamaUrl?: string) {
    super(apiKey, useOllama, ollamaModel, ollamaUrl)

    this.config = {
      enableActiveMonitoring: true,
      enableAutoSuggestions: true,
      enableProgressTracking: true,
      suggestionFrequency: 'medium',
      maxContextLength: 4000,
      preferredAIProvider: useOllama ? 'ollama' : 'gemini',
      customPrompts: {}
    }
  }

  /**
   * Initialize a new development session for a project
   */
  async initializeSession(projectPath: string): Promise<DevelopmentSession> {
    console.log(`[CodingAssistant] Initializing session for project: ${projectPath}`)

    // Detect project context
    this.projectContext = await this.detectProjectContext(projectPath)

    // Create new session
    const session: DevelopmentSession = {
      id: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      projectContext: this.projectContext,
      currentStage: DevelopmentStage.PLANNING,
      startTime: new Date(),
      lastActivity: new Date(),
      completedTasks: [],
      activeTasks: [],
      notes: [],
      metadata: {}
    }

    this.currentSession = session

    // Initialize progress tracking
    this.initializeProgressTracking(session.id)

    console.log(`[CodingAssistant] Session initialized: ${session.id}`)
    return session
  }

  /**
   * Detect project type and context from file structure
   */
  private async detectProjectContext(projectPath: string): Promise<ProjectContext> {
    console.log(`[CodingAssistant] Detecting project context for: ${projectPath}`)

    const projectName = path.basename(projectPath)
    let detectedType = ProjectType.UNKNOWN
    let primaryLanguage = ProgrammingLanguage.UNKNOWN
    let confidence = 0

    // Check for package.json (Node.js projects)
    const packageJsonPath = path.join(projectPath, 'package.json')
    if (fs.existsSync(packageJsonPath)) {
      try {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'))

        // Detect React
        if (packageJson.dependencies?.react || packageJson.devDependencies?.react) {
          detectedType = ProjectType.REACT
          primaryLanguage = ProgrammingLanguage.TYPESCRIPT
          confidence = 0.9
        }
        // Detect Vue
        else if (packageJson.dependencies?.vue || packageJson.devDependencies?.vue) {
          detectedType = ProjectType.VUE
          primaryLanguage = ProgrammingLanguage.JAVASCRIPT
          confidence = 0.9
        }
        // Detect Angular
        else if (packageJson.dependencies?.['@angular/core']) {
          detectedType = ProjectType.ANGULAR
          primaryLanguage = ProgrammingLanguage.TYPESCRIPT
          confidence = 0.9
        }
        // Detect Express
        else if (packageJson.dependencies?.express) {
          detectedType = ProjectType.EXPRESS
          primaryLanguage = ProgrammingLanguage.JAVASCRIPT
          confidence = 0.8
        }
        // Generic Node.js
        else {
          detectedType = ProjectType.NODE_JS
          primaryLanguage = ProgrammingLanguage.JAVASCRIPT
          confidence = 0.7
        }

        return {
          name: projectName,
          type: detectedType,
          primaryLanguage,
          framework: detectedType === ProjectType.REACT ? 'React' :
                   detectedType === ProjectType.VUE ? 'Vue' :
                   detectedType === ProjectType.ANGULAR ? 'Angular' : undefined,
          dependencies: Object.keys(packageJson.dependencies || {}),
          devDependencies: Object.keys(packageJson.devDependencies || {}),
          scripts: packageJson.scripts || {},
          rootDirectory: projectPath,
          detectedAt: new Date(),
          confidence
        }
      } catch (error) {
        console.error('[CodingAssistant] Error parsing package.json:', error)
      }
    }

    // Check for Python projects
    const requirementsPath = path.join(projectPath, 'requirements.txt')
    const setupPath = path.join(projectPath, 'setup.py')
    const pyprojectPath = path.join(projectPath, 'pyproject.toml')

    if (fs.existsSync(requirementsPath) || fs.existsSync(setupPath) || fs.existsSync(pyprojectPath)) {
      detectedType = ProjectType.PYTHON
      primaryLanguage = ProgrammingLanguage.PYTHON
      confidence = 0.8

      // Check for Django
      if (fs.existsSync(path.join(projectPath, 'manage.py'))) {
        detectedType = ProjectType.DJANGO
        confidence = 0.9
      }
      // Check for Flask
      else if (fs.existsSync(path.join(projectPath, 'app.py'))) {
        detectedType = ProjectType.FLASK
        confidence = 0.85
      }
    }

    // Check for other project types...
    // (Go, Rust, PHP, etc. can be added here)

    return {
      name: projectName,
      type: detectedType,
      primaryLanguage,
      dependencies: [],
      devDependencies: [],
      scripts: {},
      rootDirectory: projectPath,
      detectedAt: new Date(),
      confidence
    }
  }

  /**
   * Initialize progress tracking for a session
   */
  private initializeProgressTracking(sessionId: string): void {
    const progress: DevelopmentProgress = {
      sessionId,
      stage: DevelopmentStage.PLANNING,
      completedSteps: 0,
      totalSteps: 5, // Default for planning stage
      currentTask: 'Project analysis and planning',
      blockers: [],
      achievements: [],
      timeSpent: 0,
      lastUpdated: new Date()
    }

    this.developmentProgress.set(sessionId, progress)
  }

  /**
   * Update development stage
   */
  async updateStage(newStage: DevelopmentStage): Promise<void> {
    if (!this.currentSession) {
      throw new Error('No active session')
    }

    console.log(`[CodingAssistant] Updating stage from ${this.currentSession.currentStage} to ${newStage}`)

    this.currentSession.currentStage = newStage
    this.currentSession.lastActivity = new Date()

    // Update progress tracking
    const progress = this.developmentProgress.get(this.currentSession.id)
    if (progress) {
      progress.stage = newStage
      progress.lastUpdated = new Date()
    }
  }

  /**
   * Get current session information
   */
  getCurrentSession(): DevelopmentSession | null {
    return this.currentSession
  }

  /**
   * Get project context
   */
  getProjectContext(): ProjectContext | null {
    return this.projectContext
  }

  /**
   * Analyze a specific file for coding suggestions
   */
  async analyzeFile(filePath: string): Promise<FileAnalysis> {
    console.log(`[CodingAssistant] Analyzing file: ${filePath}`)

    const content = fs.readFileSync(filePath, 'utf-8')
    const ext = path.extname(filePath)
    const lines = content.split('\n').length

    // Basic language detection from file extension
    let language = ProgrammingLanguage.UNKNOWN
    switch (ext) {
      case '.ts':
      case '.tsx':
        language = ProgrammingLanguage.TYPESCRIPT
        break
      case '.js':
      case '.jsx':
        language = ProgrammingLanguage.JAVASCRIPT
        break
      case '.py':
        language = ProgrammingLanguage.PYTHON
        break
      case '.java':
        language = ProgrammingLanguage.JAVA
        break
      case '.cs':
        language = ProgrammingLanguage.CSHARP
        break
      case '.go':
        language = ProgrammingLanguage.GO
        break
      case '.rs':
        language = ProgrammingLanguage.RUST
        break
      case '.php':
        language = ProgrammingLanguage.PHP
        break
    }

    // Calculate basic complexity (simple heuristic)
    const complexity = Math.min(content.length / 1000, 10) // Rough complexity score

    // Extract imports (basic regex patterns)
    const importPatterns: Record<string, RegExp> = {
      [ProgrammingLanguage.TYPESCRIPT]: /import\s+.*from\s+['"](.+?)['"]/g,
      [ProgrammingLanguage.JAVASCRIPT]: /import\s+.*from\s+['"](.+?)['"]/g,
      [ProgrammingLanguage.PYTHON]: /from\s+(.+?)\s+import|import\s+(.+)/g,
      [ProgrammingLanguage.JAVA]: /import\s+(.+?);/g,
    }

    const imports: string[] = []
    const pattern = importPatterns[language]
    if (pattern) {
      let match
      while ((match = pattern.exec(content)) !== null) {
        imports.push(match[1] || match[2])
      }
    }

    return {
      filePath,
      language,
      complexity,
      linesOfCode: lines,
      functions: (content.match(/function\s+\w+|const\s+\w+\s*=\s*\(|def\s+\w+\s*\(/g) || []).length,
      classes: (content.match(/class\s+\w+/g) || []).length,
      imports,
      exports: [],
      errors: [],
      warnings: [],
      suggestions: []
    }
  }

  /**
   * Generate coding suggestions based on context
   */
  async generateSuggestions(context: CodingContext): Promise<CodingSuggestion[]> {
    if (!this.currentSession) {
      throw new Error('No active session')
    }

    console.log(`[CodingAssistant] Generating suggestions for stage: ${context.currentStage}`)

    const suggestions: CodingSuggestion[] = []

    // Stage-specific suggestions
    switch (context.currentStage) {
      case DevelopmentStage.PLANNING:
        suggestions.push(...await this.generatePlanningSuggestions(context))
        break
      case DevelopmentStage.CODING:
        suggestions.push(...await this.generateCodingSuggestions(context))
        break
      case DevelopmentStage.TESTING:
        suggestions.push(...await this.generateTestingSuggestions(context))
        break
      case DevelopmentStage.DEBUGGING:
        suggestions.push(...await this.generateDebuggingSuggestions(context))
        break
      case DevelopmentStage.DEPLOYMENT:
        suggestions.push(...await this.generateDeploymentSuggestions(context))
        break
    }

    return suggestions
  }

  /**
   * Generate planning stage suggestions
   */
  private async generatePlanningSuggestions(_context: CodingContext): Promise<CodingSuggestion[]> {
    const suggestions: CodingSuggestion[] = []

    // Suggest creating documentation
    suggestions.push({
      id: `planning_${Date.now()}_1`,
      type: 'enhance',
      title: 'Create Project Documentation',
      description: 'Generate comprehensive project documentation including PRD, technical specifications, and API documentation.',
      confidence: 0.9,
      impact: 'high',
      effort: 'medium',
      explanation: 'Good documentation ensures project clarity and helps team collaboration.',
      alternatives: [
        'Start with a simple README',
        'Create detailed technical specifications',
        'Generate user stories and acceptance criteria'
      ]
    })

    // Suggest project structure
    if (this.projectContext) {
      suggestions.push({
        id: `planning_${Date.now()}_2`,
        type: 'pattern',
        title: 'Optimize Project Structure',
        description: `Implement best practices for ${this.projectContext.type} project structure.`,
        confidence: 0.8,
        impact: 'medium',
        effort: 'low',
        explanation: 'Following established patterns improves maintainability and scalability.',
        alternatives: [
          'Follow official framework conventions',
          'Implement feature-based organization',
          'Use domain-driven design principles'
        ]
      })
    }

    return suggestions
  }

  /**
   * Generate coding stage suggestions
   */
  private async generateCodingSuggestions(_context: CodingContext): Promise<CodingSuggestion[]> {
    const suggestions: CodingSuggestion[] = []

    // Suggest code quality improvements
    suggestions.push({
      id: `coding_${Date.now()}_1`,
      type: 'refactor',
      title: 'Improve Code Quality',
      description: 'Apply coding best practices including proper error handling, type safety, and documentation.',
      confidence: 0.8,
      impact: 'high',
      effort: 'medium',
      explanation: 'High-quality code reduces bugs and improves maintainability.',
      alternatives: [
        'Add comprehensive error handling',
        'Implement proper TypeScript types',
        'Add JSDoc documentation'
      ]
    })

    return suggestions
  }

  /**
   * Generate testing stage suggestions
   */
  private async generateTestingSuggestions(_context: CodingContext): Promise<CodingSuggestion[]> {
    const suggestions: CodingSuggestion[] = []

    suggestions.push({
      id: `testing_${Date.now()}_1`,
      type: 'enhance',
      title: 'Implement Comprehensive Testing',
      description: 'Add unit tests, integration tests, and end-to-end tests for better code reliability.',
      confidence: 0.9,
      impact: 'high',
      effort: 'high',
      explanation: 'Testing ensures code reliability and makes refactoring safer.',
      alternatives: [
        'Start with unit tests for critical functions',
        'Add integration tests for API endpoints',
        'Implement end-to-end testing with Cypress'
      ]
    })

    return suggestions
  }

  /**
   * Generate debugging stage suggestions
   */
  private async generateDebuggingSuggestions(_context: CodingContext): Promise<CodingSuggestion[]> {
    const suggestions: CodingSuggestion[] = []

    suggestions.push({
      id: `debugging_${Date.now()}_1`,
      type: 'fix',
      title: 'Systematic Debugging Approach',
      description: 'Use systematic debugging techniques including logging, error tracking, and root cause analysis.',
      confidence: 0.9,
      impact: 'high',
      effort: 'medium',
      explanation: 'Systematic debugging is more efficient than random trial and error.',
      alternatives: [
        'Add comprehensive logging',
        'Use debugging tools and breakpoints',
        'Implement error monitoring and alerting'
      ]
    })

    return suggestions
  }

  /**
   * Generate deployment stage suggestions
   */
  private async generateDeploymentSuggestions(_context: CodingContext): Promise<CodingSuggestion[]> {
    const suggestions: CodingSuggestion[] = []

    suggestions.push({
      id: `deployment_${Date.now()}_1`,
      type: 'enhance',
      title: 'Implement Deployment Best Practices',
      description: 'Set up CI/CD pipelines, monitoring, and rollback strategies for reliable deployments.',
      confidence: 0.8,
      impact: 'high',
      effort: 'high',
      explanation: 'Proper deployment practices ensure reliability and quick recovery from issues.',
      alternatives: [
        'Set up automated testing in CI/CD',
        'Implement blue-green deployments',
        'Add comprehensive monitoring and alerting'
      ]
    })

    return suggestions
  }

  /**
   * Generate development progress report
   */
  getProgressReport(): DevelopmentProgress | null {
    if (!this.currentSession) return null

    const progress = this.developmentProgress.get(this.currentSession.id)
    if (!progress) return null

    // Update time spent
    const now = new Date()
    const timeDiff = now.getTime() - progress.lastUpdated.getTime()
    progress.timeSpent += Math.floor(timeDiff / 60000) // Convert to minutes
    progress.lastUpdated = now

    return progress
  }

  /**
   * Add a completed task to the session
   */
  addCompletedTask(task: string): void {
    if (!this.currentSession) return

    this.currentSession.completedTasks.push(task)
    this.currentSession.lastActivity = new Date()

    // Update progress
    const progress = this.developmentProgress.get(this.currentSession.id)
    if (progress) {
      progress.completedSteps++
      progress.lastUpdated = new Date()
    }
  }

  /**
   * Add an active task to the session
   */
  addActiveTask(task: string): void {
    if (!this.currentSession) return

    if (!this.currentSession.activeTasks.includes(task)) {
      this.currentSession.activeTasks.push(task)
      this.currentSession.lastActivity = new Date()
    }
  }

  /**
   * Complete an active task
   */
  completeActiveTask(task: string): void {
    if (!this.currentSession) return

    const index = this.currentSession.activeTasks.indexOf(task)
    if (index > -1) {
      this.currentSession.activeTasks.splice(index, 1)
      this.currentSession.completedTasks.push(task)
      this.currentSession.lastActivity = new Date()
    }
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<CodingAssistantConfig>): void {
    this.config = { ...this.config, ...newConfig }
  }

  /**
   * Get current configuration
   */
  getConfig(): CodingAssistantConfig {
    return { ...this.config }
  }
}
