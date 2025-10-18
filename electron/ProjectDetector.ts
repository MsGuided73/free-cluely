import * as fs from 'fs'
import * as path from 'path'
import {
  ProjectType,
  ProgrammingLanguage,
  ProjectContext
} from "../src/types/codingAssistant"

/**
 * Advanced project detection system for identifying project types and structures
 */
export class ProjectDetector {
  private detectionRules: DetectionRule[] = []

  constructor() {
    this.initializeDetectionRules()
  }

  /**
   * Initialize detection rules for different project types
   */
  private initializeDetectionRules(): void {
    this.detectionRules = [
      // React Projects
      new DetectionRule(
        ProjectType.REACT,
        ProgrammingLanguage.TYPESCRIPT,
        0.9,
        [
          { file: 'package.json', content: /"react"/ },
          { file: 'src/App.tsx', exists: true },
          { file: 'src/index.tsx', exists: true }
        ]
      ),

      // Vue Projects
      new DetectionRule(
        ProjectType.VUE,
        ProgrammingLanguage.JAVASCRIPT,
        0.9,
        [
          { file: 'package.json', content: /"vue"/ },
          { file: 'src/App.vue', exists: true }
        ]
      ),

      // Angular Projects
      new DetectionRule(
        ProjectType.ANGULAR,
        ProgrammingLanguage.TYPESCRIPT,
        0.9,
        [
          { file: 'package.json', content: /"@angular\/core"/ },
          { file: 'src/main.ts', exists: true },
          { file: 'angular.json', exists: true }
        ]
      ),

      // Node.js Express Projects
      new DetectionRule(
        ProjectType.EXPRESS,
        ProgrammingLanguage.JAVASCRIPT,
        0.8,
        [
          { file: 'package.json', content: /"express"/ },
          { file: 'app.js', exists: true },
          { file: 'server.js', exists: true }
        ]
      ),

      // Python Django Projects
      new DetectionRule(
        ProjectType.DJANGO,
        ProgrammingLanguage.PYTHON,
        0.9,
        [
          { file: 'requirements.txt', content: /Django/ },
          { file: 'manage.py', exists: true },
          { file: 'settings.py', exists: true }
        ]
      ),

      // Python Flask Projects
      new DetectionRule(
        ProjectType.FLASK,
        ProgrammingLanguage.PYTHON,
        0.85,
        [
          { file: 'requirements.txt', content: /Flask/ },
          { file: 'app.py', exists: true }
        ]
      ),

      // Go Projects
      new DetectionRule(
        ProjectType.GO,
        ProgrammingLanguage.GO,
        0.9,
        [
          { file: 'go.mod', exists: true },
          { file: 'main.go', exists: true }
        ]
      ),

      // Rust Projects
      new DetectionRule(
        ProjectType.RUST,
        ProgrammingLanguage.RUST,
        0.9,
        [
          { file: 'Cargo.toml', exists: true },
          { file: 'src/main.rs', exists: true }
        ]
      ),

      // PHP Projects
      new DetectionRule(
        ProjectType.PHP,
        ProgrammingLanguage.PHP,
        0.8,
        [
          { file: 'composer.json', exists: true },
          { file: 'index.php', exists: true }
        ]
      )
    ]
  }

  /**
   * Detect project context from a given directory
   */
  async detectProject(projectPath: string): Promise<ProjectContext> {
    console.log(`[ProjectDetector] Analyzing project at: ${projectPath}`)

    const projectName = path.basename(projectPath)
    let bestMatch: { rule: DetectionRule; score: number } | null = null

    // Test each detection rule
    for (const rule of this.detectionRules) {
      const score = await this.testRule(rule, projectPath)
      if (score > 0 && (!bestMatch || score > bestMatch.score)) {
        bestMatch = { rule, score }
      }
    }

    // If no specific project type detected, fall back to language detection
    if (!bestMatch || bestMatch.score < 0.5) {
      const fallbackContext = await this.detectByLanguage(projectPath)
      return {
        name: projectName,
        type: ProjectType.UNKNOWN,
        primaryLanguage: fallbackContext.primaryLanguage,
        dependencies: fallbackContext.dependencies,
        devDependencies: fallbackContext.devDependencies,
        scripts: fallbackContext.scripts,
        rootDirectory: projectPath,
        detectedAt: new Date(),
        confidence: 0.3
      }
    }

    // Extract package information
    const packageInfo = await this.extractPackageInfo(projectPath)

    return {
      name: projectName,
      type: bestMatch.rule.projectType,
      primaryLanguage: bestMatch.rule.primaryLanguage,
      framework: this.getFrameworkName(bestMatch.rule.projectType),
      dependencies: packageInfo.dependencies,
      devDependencies: packageInfo.devDependencies,
      scripts: packageInfo.scripts,
      rootDirectory: projectPath,
      detectedAt: new Date(),
      confidence: bestMatch.score
    }
  }

  /**
   * Test a detection rule against a project directory
   */
  private async testRule(rule: DetectionRule, projectPath: string): Promise<number> {
    let score = 0
    let totalCriteria = rule.criteria.length

    for (const criterion of rule.criteria) {
      if (await this.testCriterion(criterion, projectPath)) {
        score++
      }
    }

    return totalCriteria > 0 ? score / totalCriteria : 0
  }

  /**
   * Test a single detection criterion
   */
  private async testCriterion(criterion: DetectionCriterion, projectPath: string): Promise<boolean> {
    const filePath = path.join(projectPath, criterion.file)

    if (criterion.exists) {
      return fs.existsSync(filePath)
    }

    if (criterion.content && fs.existsSync(filePath)) {
      try {
        const content = fs.readFileSync(filePath, 'utf-8')
        return criterion.content.test(content)
      } catch {
        return false
      }
    }

    return false
  }

  /**
   * Fallback language detection when project type is unclear
   */
  private async detectByLanguage(projectPath: string): Promise<Partial<ProjectContext>> {
    const files = await this.getAllFiles(projectPath)
    const languageScores: Record<ProgrammingLanguage, number> = {
      [ProgrammingLanguage.TYPESCRIPT]: 0,
      [ProgrammingLanguage.JAVASCRIPT]: 0,
      [ProgrammingLanguage.PYTHON]: 0,
      [ProgrammingLanguage.JAVA]: 0,
      [ProgrammingLanguage.CSHARP]: 0,
      [ProgrammingLanguage.GO]: 0,
      [ProgrammingLanguage.RUST]: 0,
      [ProgrammingLanguage.PHP]: 0,
      [ProgrammingLanguage.RUBY]: 0,
      [ProgrammingLanguage.SWIFT]: 0,
      [ProgrammingLanguage.KOTLIN]: 0,
      [ProgrammingLanguage.SCALA]: 0,
      [ProgrammingLanguage.CLOJURE]: 0,
      [ProgrammingLanguage.UNKNOWN]: 0
    }

    // Score based on file extensions
    for (const file of files) {
      const ext = path.extname(file).toLowerCase()
      switch (ext) {
        case '.ts':
        case '.tsx':
          languageScores[ProgrammingLanguage.TYPESCRIPT] += 2
          break
        case '.js':
        case '.jsx':
        case '.mjs':
          languageScores[ProgrammingLanguage.JAVASCRIPT] += 1
          break
        case '.py':
        case '.pyw':
          languageScores[ProgrammingLanguage.PYTHON] += 2
          break
        case '.java':
          languageScores[ProgrammingLanguage.JAVA] += 2
          break
        case '.cs':
          languageScores[ProgrammingLanguage.CSHARP] += 2
          break
        case '.go':
          languageScores[ProgrammingLanguage.GO] += 2
          break
        case '.rs':
          languageScores[ProgrammingLanguage.RUST] += 2
          break
        case '.php':
          languageScores[ProgrammingLanguage.PHP] += 1
          break
        case '.rb':
          languageScores[ProgrammingLanguage.RUBY] += 2
          break
      }
    }

    // Find the language with highest score
    let bestLanguage = ProgrammingLanguage.UNKNOWN
    let bestScore = 0

    for (const [language, score] of Object.entries(languageScores)) {
      if (score > bestScore) {
        bestScore = score
        bestLanguage = language as ProgrammingLanguage
      }
    }

    return {
      primaryLanguage: bestLanguage,
      dependencies: [],
      devDependencies: [],
      scripts: {}
    }
  }

  /**
   * Extract package information from project files
   */
  private async extractPackageInfo(projectPath: string): Promise<{
    dependencies: string[]
    devDependencies: string[]
    scripts: Record<string, string>
  }> {
    // Check package.json for Node.js projects
    const packageJsonPath = path.join(projectPath, 'package.json')
    if (fs.existsSync(packageJsonPath)) {
      try {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'))
        return {
          dependencies: Object.keys(packageJson.dependencies || {}),
          devDependencies: Object.keys(packageJson.devDependencies || {}),
          scripts: packageJson.scripts || {}
        }
      } catch (error) {
        console.error('[ProjectDetector] Error parsing package.json:', error)
      }
    }

    // Check requirements.txt for Python projects
    const requirementsPath = path.join(projectPath, 'requirements.txt')
    if (fs.existsSync(requirementsPath)) {
      try {
        const content = fs.readFileSync(requirementsPath, 'utf-8')
        const dependencies = content.split('\n')
          .map(line => line.trim())
          .filter(line => line && !line.startsWith('#'))
          .map(line => line.split('==')[0]) // Remove version specifiers

        return {
          dependencies,
          devDependencies: [],
          scripts: {}
        }
      } catch (error) {
        console.error('[ProjectDetector] Error parsing requirements.txt:', error)
      }
    }

    return {
      dependencies: [],
      devDependencies: [],
      scripts: {}
    }
  }

  /**
   * Get all files in a directory recursively
   */
  private async getAllFiles(dirPath: string): Promise<string[]> {
    const files: string[] = []

    try {
      const entries = fs.readdirSync(dirPath, { withFileTypes: true })

      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name)

        if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
          // Recurse into subdirectories
          const subFiles = await this.getAllFiles(fullPath)
          files.push(...subFiles)
        } else if (entry.isFile()) {
          files.push(fullPath)
        }
      }
    } catch (error) {
      console.error('[ProjectDetector] Error reading directory:', error)
    }

    return files
  }

  /**
   * Get framework name from project type
   */
  private getFrameworkName(projectType: ProjectType): string | undefined {
    switch (projectType) {
      case ProjectType.REACT:
        return 'React'
      case ProjectType.VUE:
        return 'Vue.js'
      case ProjectType.ANGULAR:
        return 'Angular'
      case ProjectType.DJANGO:
        return 'Django'
      case ProjectType.FLASK:
        return 'Flask'
      case ProjectType.EXPRESS:
        return 'Express.js'
      case ProjectType.NEST_JS:
        return 'NestJS'
      case ProjectType.SPRING_BOOT:
        return 'Spring Boot'
      default:
        return undefined
    }
  }

  /**
   * Get project health metrics
   */
  async analyzeProjectHealth(projectPath: string): Promise<{
    hasReadme: boolean
    hasTests: boolean
    hasConfig: boolean
    hasDocumentation: boolean
    structureScore: number
  }> {
    const files = await this.getAllFiles(projectPath)

    return {
      hasReadme: files.some(f => path.basename(f).toLowerCase() === 'readme.md'),
      hasTests: files.some(f => f.includes('test') || f.includes('spec') ||
        path.basename(f).endsWith('.test.js') || path.basename(f).endsWith('.spec.ts')),
      hasConfig: files.some(f => f.includes('config') || f.endsWith('.config.js') ||
        f.endsWith('.config.ts') || f.endsWith('.json')),
      hasDocumentation: files.some(f => f.endsWith('.md') && path.basename(f).toLowerCase() !== 'readme.md'),
      structureScore: Math.min(files.length / 10, 10) // Simple heuristic
    }
  }
}

/**
 * Detection rule for identifying project types
 */
class DetectionRule {
  constructor(
    public projectType: ProjectType,
    public primaryLanguage: ProgrammingLanguage,
    public baseConfidence: number,
    public criteria: DetectionCriterion[]
  ) {}
}

/**
 * Detection criterion for testing project characteristics
 */
interface DetectionCriterion {
  file: string
  exists?: boolean
  content?: RegExp
}
