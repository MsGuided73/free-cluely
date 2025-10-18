/**
 * Development stages for the coding assistant
 */
export enum DevelopmentStage {
  PLANNING = 'planning',
  CODING = 'coding',
  TESTING = 'testing',
  DEBUGGING = 'debugging',
  DEPLOYMENT = 'deployment',
  REVIEW = 'review'
}

/**
 * Project types that can be detected
 */
export enum ProjectType {
  REACT = 'react',
  VUE = 'vue',
  ANGULAR = 'angular',
  NODE_JS = 'nodejs',
  PYTHON = 'python',
  DJANGO = 'django',
  FLASK = 'flask',
  EXPRESS = 'express',
  NEST_JS = 'nestjs',
  SPRING_BOOT = 'springboot',
  DOTNET = 'dotnet',
  GO = 'go',
  RUST = 'rust',
  PHP = 'php',
  RUBY = 'ruby',
  UNKNOWN = 'unknown'
}

/**
 * Programming languages detected in projects
 */
export enum ProgrammingLanguage {
  TYPESCRIPT = 'typescript',
  JAVASCRIPT = 'javascript',
  PYTHON = 'python',
  JAVA = 'java',
  CSHARP = 'csharp',
  GO = 'go',
  RUST = 'rust',
  PHP = 'php',
  RUBY = 'ruby',
  SWIFT = 'swift',
  KOTLIN = 'kotlin',
  SCALA = 'scala',
  CLOJURE = 'clojure',
  UNKNOWN = 'unknown'
}

/**
 * Project context information
 */
export interface ProjectContext {
  name: string
  type: ProjectType
  primaryLanguage: ProgrammingLanguage
  framework?: string
  dependencies: string[]
  devDependencies: string[]
  scripts: Record<string, string>
  rootDirectory: string
  detectedAt: Date
  confidence: number // 0-1 score of how confident we are in the detection
}

/**
 * Development session information
 */
export interface DevelopmentSession {
  id: string
  projectContext: ProjectContext
  currentStage: DevelopmentStage
  startTime: Date
  lastActivity: Date
  completedTasks: string[]
  activeTasks: string[]
  notes: string[]
  metadata: Record<string, any>
}

/**
 * Coding assistant configuration
 */
export interface CodingAssistantConfig {
  enableActiveMonitoring: boolean
  enableAutoSuggestions: boolean
  enableProgressTracking: boolean
  suggestionFrequency: 'low' | 'medium' | 'high'
  maxContextLength: number
  preferredAIProvider: 'gemini' | 'ollama' | 'openai'
  customPrompts: Record<string, string>
}

/**
 * File analysis result
 */
export interface FileAnalysis {
  filePath: string
  language: ProgrammingLanguage
  complexity: number
  linesOfCode: number
  functions: number
  classes: number
  imports: string[]
  exports: string[]
  errors: string[]
  warnings: string[]
  suggestions: string[]
}

/**
 * Project health metrics
 */
export interface ProjectHealth {
  overall: 'excellent' | 'good' | 'fair' | 'poor'
  codeQuality: number // 0-100
  testCoverage: number // 0-100
  documentation: number // 0-100
  dependencies: number // 0-100
  security: number // 0-100
  performance: number // 0-100
  issues: string[]
  recommendations: string[]
}

/**
 * Development progress tracking
 */
export interface DevelopmentProgress {
  sessionId: string
  stage: DevelopmentStage
  completedSteps: number
  totalSteps: number
  currentTask?: string
  blockers: string[]
  achievements: string[]
  timeSpent: number // in minutes
  lastUpdated: Date
}

/**
 * AI interaction context for coding assistance
 */
export interface CodingContext {
  currentFile?: string
  cursorPosition?: { line: number; column: number }
  selectedCode?: string
  recentChanges: string[]
  currentStage: DevelopmentStage
  projectContext: ProjectContext
  userIntent?: string
  relatedFiles: string[]
}

/**
 * Coding suggestion types
 */
export interface CodingSuggestion {
  id: string
  type: 'refactor' | 'optimize' | 'fix' | 'enhance' | 'security' | 'pattern'
  title: string
  description: string
  confidence: number // 0-1
  impact: 'low' | 'medium' | 'high'
  effort: 'low' | 'medium' | 'high'
  codeSnippet?: string
  explanation: string
  alternatives?: string[]
}

/**
 * Document generation request
 */
export interface DocumentGenerationRequest {
  type: 'prd' | 'technical-spec' | 'user-story' | 'api-doc' | 'architecture'
  projectContext: ProjectContext
  requirements: string[]
  targetAudience: string
  additionalContext?: string
}

/**
 * Generated document structure
 */
export interface GeneratedDocument {
  id: string
  type: string
  title: string
  content: string
  metadata: {
    generatedAt: Date
    projectContext: ProjectContext
    aiProvider: string
    tokensUsed: number
    generationTime: number
  }
  sections: Array<{
    title: string
    content: string
    order: number
  }>
}
