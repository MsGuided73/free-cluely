import * as fs from 'fs'
import * as path from 'path'
import { LLMHelper } from './LLMHelper'
import {
  DocumentGenerationRequest,
  GeneratedDocument,
  ProjectContext,
  DevelopmentStage
} from '../src/types/codingAssistant'

/**
 * Document template engine for generating professional development documents
 */
export class DocumentTemplateEngine {
  private llmHelper: LLMHelper
  private templates: Map<string, DocumentTemplate> = new Map()

  constructor(llmHelper: LLMHelper) {
    this.llmHelper = llmHelper
    this.initializeTemplates()
  }

  /**
   * Initialize document templates for different types
   */
  private initializeTemplates(): void {
    // PRD Template
    this.templates.set('prd', new DocumentTemplate(
      'prd',
      'Product Requirements Document',
      this.getPRDStructure(),
      this.generatePRDContent.bind(this)
    ))

    // Technical Specification Template
    this.templates.set('technical-spec', new DocumentTemplate(
      'technical-spec',
      'Technical Specification',
      this.getTechnicalSpecStructure(),
      this.generateTechnicalSpecContent.bind(this)
    ))

    // User Stories Template
    this.templates.set('user-story', new DocumentTemplate(
      'user-story',
      'User Stories',
      this.getUserStoryStructure(),
      this.generateUserStoryContent.bind(this)
    ))

    // API Documentation Template
    this.templates.set('api-doc', new DocumentTemplate(
      'api-doc',
      'API Documentation',
      this.getAPIDocStructure(),
      this.generateAPIDocContent.bind(this)
    ))

    // Architecture Decision Record Template
    this.templates.set('architecture', new DocumentTemplate(
      'architecture',
      'Architecture Decision Record',
      this.getArchitectureStructure(),
      this.generateArchitectureContent.bind(this)
    ))
  }

  /**
   * Generate a document based on the request
   */
  async generateDocument(request: DocumentGenerationRequest): Promise<GeneratedDocument> {
    console.log(`[DocumentTemplateEngine] Generating ${request.type} document`)

    const template = this.templates.get(request.type)
    if (!template) {
      throw new Error(`Unknown document type: ${request.type}`)
    }

    const startTime = Date.now()

    try {
      // Generate content using AI
      const content = await template.generateContent(request)

      // Create document structure
      const document: GeneratedDocument = {
        id: `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: request.type,
        title: this.generateDocumentTitle(request),
        content,
        metadata: {
          generatedAt: new Date(),
          projectContext: request.projectContext,
          aiProvider: this.llmHelper.getCurrentProvider(),
          tokensUsed: this.estimateTokens(content),
          generationTime: Date.now() - startTime
        },
        sections: template.getSectionStructure()
      }

      console.log(`[DocumentTemplateEngine] Generated ${request.type} in ${document.metadata.generationTime}ms`)
      return document

    } catch (error) {
      console.error(`[DocumentTemplateEngine] Error generating ${request.type}:`, error)
      throw error
    }
  }

  /**
   * Generate document title based on type and context
   */
  private generateDocumentTitle(request: DocumentGenerationRequest): string {
    const { type, projectContext } = request

    switch (type) {
      case 'prd':
        return `Product Requirements Document - ${projectContext.name}`
      case 'technical-spec':
        return `Technical Specification - ${projectContext.name}`
      case 'user-story':
        return `User Stories - ${projectContext.name}`
      case 'api-doc':
        return `API Documentation - ${projectContext.name}`
      case 'architecture':
        return `Architecture Decision Record - ${projectContext.name}`
      default:
        return `${String(type).toUpperCase()} - ${projectContext.name}`
    }
  }

  /**
   * Estimate tokens used (rough approximation)
   */
  private estimateTokens(content: string): number {
    // Rough estimation: ~4 characters per token
    return Math.ceil(content.length / 4)
  }

  /**
   * Get PRD document structure
   */
  private getPRDStructure() {
    return [
      { id: 'overview', title: '1. Overview', required: true },
      { id: 'goals', title: '2. Goals and Objectives', required: true },
      { id: 'scope', title: '3. Scope', required: true },
      { id: 'requirements', title: '4. Functional Requirements', required: true },
      { id: 'constraints', title: '5. Constraints and Assumptions', required: false },
      { id: 'architecture', title: '6. Technical Architecture', required: false },
      { id: 'timeline', title: '7. Timeline and Milestones', required: false },
      { id: 'success', title: '8. Success Metrics', required: false }
    ]
  }

  /**
   * Generate PRD content using AI
   */
  private async generatePRDContent(request: DocumentGenerationRequest): Promise<string> {
    const { projectContext, requirements, additionalContext } = request

    const prompt = `You are a senior product manager creating a comprehensive Product Requirements Document (PRD).

Project Context:
- Name: ${projectContext.name}
- Type: ${projectContext.type}
- Language: ${projectContext.primaryLanguage}
- Framework: ${projectContext.framework || 'Not specified'}
- Dependencies: ${projectContext.dependencies.join(', ')}

Requirements:
${requirements.map(req => `- ${req}`).join('\n')}

${additionalContext ? `Additional Context: ${additionalContext}` : ''}

Please generate a professional PRD with the following sections:

1. OVERVIEW
   - Product name and brief description
   - Target audience
   - Key value proposition

2. GOALS AND OBJECTIVES
   - Primary goals
   - Success criteria
   - Business impact

3. SCOPE
   - In scope features
   - Out of scope items
   - Future considerations

4. FUNCTIONAL REQUIREMENTS
   - Detailed feature requirements
   - User stories
   - Acceptance criteria

5. CONSTRAINTS AND ASSUMPTIONS
   - Technical constraints
   - Business constraints
   - Dependencies

6. TECHNICAL ARCHITECTURE
   - Technology stack
   - System architecture
   - Integration points

7. TIMELINE AND MILESTONES
   - Development phases
   - Key milestones
   - Delivery timeline

8. SUCCESS METRICS
   - KPIs and measurement
   - Quality standards
   - Performance targets

Format the document professionally with clear headings, bullet points, and actionable content. Be specific and technical while remaining accessible to both technical and non-technical stakeholders.`

    try {
      const response = await this.llmHelper.chat(prompt)
      return response
    } catch (error) {
      console.error('[DocumentTemplateEngine] Error generating PRD content:', error)
      throw error
    }
  }

  /**
   * Get Technical Specification structure
   */
  private getTechnicalSpecStructure() {
    return [
      { id: 'overview', title: '1. Overview', required: true },
      { id: 'architecture', title: '2. System Architecture', required: true },
      { id: 'components', title: '3. Component Design', required: true },
      { id: 'apis', title: '4. API Design', required: false },
      { id: 'database', title: '5. Database Design', required: false },
      { id: 'security', title: '6. Security Considerations', required: false },
      { id: 'performance', title: '7. Performance Requirements', required: false },
      { id: 'deployment', title: '8. Deployment Strategy', required: false }
    ]
  }

  /**
   * Generate Technical Specification content
   */
  private async generateTechnicalSpecContent(request: DocumentGenerationRequest): Promise<string> {
    const { projectContext, requirements } = request

    const prompt = `You are a senior software architect creating a comprehensive Technical Specification.

Project Context:
- Name: ${projectContext.name}
- Type: ${projectContext.type}
- Language: ${projectContext.primaryLanguage}
- Framework: ${projectContext.framework || 'Not specified'}
- Dependencies: ${projectContext.dependencies.join(', ')}

Requirements:
${requirements.map(req => `- ${req}`).join('\n')}

Please generate a detailed technical specification with the following sections:

1. OVERVIEW
   - System purpose and scope
   - Technical objectives
   - Key stakeholders

2. SYSTEM ARCHITECTURE
   - High-level architecture diagram (describe in text)
   - Technology stack justification
   - Component relationships

3. COMPONENT DESIGN
   - Component breakdown
   - Interface definitions
   - Data flow diagrams

4. API DESIGN
   - RESTful API endpoints
   - Request/response formats
   - Authentication mechanisms

5. DATABASE DESIGN
   - Schema design
   - Data models
   - Relationships and constraints

6. SECURITY CONSIDERATIONS
   - Authentication and authorization
   - Data protection
   - Security best practices

7. PERFORMANCE REQUIREMENTS
   - Performance targets
   - Scalability considerations
   - Optimization strategies

8. DEPLOYMENT STRATEGY
   - Deployment architecture
   - Environment setup
   - Rollback procedures

Provide concrete, implementable technical details. Include code examples where appropriate and ensure all recommendations are specific to the ${projectContext.type} project type.`

    try {
      const response = await this.llmHelper.chat(prompt)
      return response
    } catch (error) {
      console.error('[DocumentTemplateEngine] Error generating technical spec content:', error)
      throw error
    }
  }

  /**
   * Get User Story structure
   */
  private getUserStoryStructure() {
    return [
      { id: 'stories', title: 'User Stories', required: true },
      { id: 'acceptance', title: 'Acceptance Criteria', required: true },
      { id: 'estimation', title: 'Story Point Estimation', required: false },
      { id: 'priority', title: 'Priority Ranking', required: false }
    ]
  }

  /**
   * Generate User Stories content
   */
  private async generateUserStoryContent(request: DocumentGenerationRequest): Promise<string> {
    const { projectContext, requirements } = request

    const prompt = `You are a senior business analyst creating comprehensive user stories for a software project.

Project Context:
- Name: ${projectContext.name}
- Type: ${projectContext.type}
- Target Users: ${request.targetAudience || 'Software developers and end users'}

Requirements:
${requirements.map(req => `- ${req}`).join('\n')}

Please generate detailed user stories following this format:

"As a [type of user], I want [some goal] so that [some reason]."

For each user story, provide:

1. USER STORIES
   - Role-based user stories
   - Feature-specific stories
   - Integration stories

2. ACCEPTANCE CRITERIA
   - Specific, testable criteria
   - Edge cases covered
   - Performance requirements

3. STORY POINT ESTIMATION
   - Complexity assessment
   - Effort estimation
   - Risk factors

4. PRIORITY RANKING
   - Must-have vs nice-to-have
   - Dependencies
   - Business value

Create 8-12 comprehensive user stories that cover the main functionality. Ensure stories are independent, negotiable, valuable, estimable, small, and testable (INVEST criteria).`

    try {
      const response = await this.llmHelper.chat(prompt)
      return response
    } catch (error) {
      console.error('[DocumentTemplateEngine] Error generating user stories content:', error)
      throw error
    }
  }

  /**
   * Get API Documentation structure
   */
  private getAPIDocStructure() {
    return [
      { id: 'overview', title: '1. API Overview', required: true },
      { id: 'authentication', title: '2. Authentication', required: true },
      { id: 'endpoints', title: '3. API Endpoints', required: true },
      { id: 'examples', title: '4. Usage Examples', required: false },
      { id: 'errors', title: '5. Error Handling', required: false }
    ]
  }

  /**
   * Generate API Documentation content
   */
  private async generateAPIDocContent(request: DocumentGenerationRequest): Promise<string> {
    const { projectContext } = request

    const prompt = `You are a senior API developer creating comprehensive API documentation.

Project Context:
- Name: ${projectContext.name}
- Type: ${projectContext.type}
- Language: ${projectContext.primaryLanguage}
- Framework: ${projectContext.framework || 'Not specified'}

Please generate detailed API documentation with the following sections:

1. API OVERVIEW
   - API purpose and scope
   - Base URL and versioning
   - Rate limiting and quotas

2. AUTHENTICATION
   - Authentication methods
   - API key management
   - Security best practices

3. API ENDPOINTS
   - Complete endpoint listing
   - Request/response schemas
   - Parameter definitions

4. USAGE EXAMPLES
   - Code examples in relevant languages
   - Common use cases
   - Best practices

5. ERROR HANDLING
   - Error response formats
   - Status codes and meanings
   - Troubleshooting guide

Include specific examples for ${projectContext.type} projects. Provide concrete endpoints, schemas, and examples that developers can immediately implement.`

    try {
      const response = await this.llmHelper.chat(prompt)
      return response
    } catch (error) {
      console.error('[DocumentTemplateEngine] Error generating API documentation content:', error)
      throw error
    }
  }

  /**
   * Get Architecture Decision Record structure
   */
  private getArchitectureStructure() {
    return [
      { id: 'context', title: '1. Context', required: true },
      { id: 'decision', title: '2. Decision', required: true },
      { id: 'rationale', title: '3. Rationale', required: true },
      { id: 'consequences', title: '4. Consequences', required: false }
    ]
  }

  /**
   * Generate Architecture Decision Record content
   */
  private async generateArchitectureContent(request: DocumentGenerationRequest): Promise<string> {
    const { projectContext, requirements } = request

    const prompt = `You are a senior software architect documenting an important architectural decision.

Project Context:
- Name: ${projectContext.name}
- Type: ${projectContext.type}
- Current Architecture: ${projectContext.framework ? `Using ${projectContext.framework}` : 'To be determined'}

Decision Context:
${requirements.map(req => `- ${req}`).join('\n')}

Please generate an Architecture Decision Record (ADR) with the following sections:

1. CONTEXT
   - Problem statement
   - Current state
   - Forces and constraints

2. DECISION
   - Chosen solution
   - Architecture patterns
   - Technology choices

3. RATIONALE
   - Why this decision?
   - Alternative options considered
   - Trade-off analysis

4. CONSEQUENCES
   - Benefits and advantages
   - Drawbacks and limitations
   - Migration strategy

Focus on architectural decisions relevant to ${projectContext.type} projects. Provide concrete, actionable guidance that development teams can follow.`

    try {
      const response = await this.llmHelper.chat(prompt)
      return response
    } catch (error) {
      console.error('[DocumentTemplateEngine] Error generating architecture content:', error)
      throw error
    }
  }

  /**
   * Export document to different formats
   */
  async exportDocument(document: GeneratedDocument, format: 'markdown' | 'json' | 'html'): Promise<string> {
    switch (format) {
      case 'markdown':
        return this.exportToMarkdown(document)
      case 'json':
        return JSON.stringify(document, null, 2)
      case 'html':
        return this.exportToHTML(document)
      default:
        throw new Error(`Unsupported export format: ${format}`)
    }
  }

  /**
   * Export document as Markdown
   */
  private exportToMarkdown(document: GeneratedDocument): string {
    let markdown = `# ${document.title}\n\n`
    markdown += `*Generated on: ${document.metadata.generatedAt.toLocaleDateString()}*\n`
    markdown += `*Project: ${document.metadata.projectContext.name}*\n`
    markdown += `*AI Provider: ${document.metadata.aiProvider}*\n\n`
    markdown += `---\n\n`
    markdown += document.content
    markdown += `\n\n---\n\n`
    markdown += `*Generated in ${document.metadata.generationTime}ms | ~${document.metadata.tokensUsed} tokens*`

    return markdown
  }

  /**
   * Export document as HTML
   */
  private exportToHTML(document: GeneratedDocument): string {
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${document.title}</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; max-width: 800px; margin: 0 auto; padding: 20px; }
        h1, h2, h3 { color: #333; }
        .metadata { background: #f5f5f5; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
        .content { line-height: 1.8; }
        .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 0.9em; color: #666; }
    </style>
</head>
<body>
    <div class="metadata">
        <h1>${document.title}</h1>
        <p><strong>Generated:</strong> ${document.metadata.generatedAt.toLocaleDateString()}</p>
        <p><strong>Project:</strong> ${document.metadata.projectContext.name}</p>
        <p><strong>AI Provider:</strong> ${document.metadata.aiProvider}</p>
    </div>
    <div class="content">
        ${this.markdownToHTML(document.content)}
    </div>
    <div class="footer">
        <p>Generated in ${document.metadata.generationTime}ms | ~${document.metadata.tokensUsed} tokens</p>
    </div>
</body>
</html>`

    return html
  }

  /**
   * Convert markdown to HTML (basic implementation)
   */
  private markdownToHTML(markdown: string): string {
    return markdown
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
      .replace(/\*(.*)\*/gim, '<em>$1</em>')
      .replace(/!\[([^\]]*)\]\(([^)]+)\)/gim, '<img alt="$1" src="$2">')
      .replace(/\[([^\]]*)\]\(([^)]+)\)/gim, '<a href="$2">$1</a>')
      .replace(/\n\n/gim, '</p><p>')
      .replace(/\n/gim, '<br>')
  }

  /**
   * Get available document types
   */
  getAvailableDocumentTypes(): Array<{ type: string; name: string; description: string }> {
    return Array.from(this.templates.entries()).map(([type, template]) => ({
      type,
      name: template.name,
      description: template.description
    }))
  }

  /**
   * Validate document request
   */
  validateRequest(request: DocumentGenerationRequest): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    if (!request.type) {
      errors.push('Document type is required')
    }

    if (!this.templates.has(request.type)) {
      errors.push(`Unknown document type: ${request.type}`)
    }

    if (!request.projectContext) {
      errors.push('Project context is required')
    }

    if (!request.requirements || request.requirements.length === 0) {
      errors.push('At least one requirement is needed')
    }

    return {
      valid: errors.length === 0,
      errors
    }
  }
}

/**
 * Document template class
 */
class DocumentTemplate {
  constructor(
    public readonly type: string,
    public readonly name: string,
    public readonly structure: Array<{ id: string; title: string; required: boolean }>,
    public readonly generateContent: (request: DocumentGenerationRequest) => Promise<string>,
    public readonly description?: string
  ) {}

  /**
   * Get section structure for the template
   */
  getSectionStructure() {
    return this.structure.map(section => ({
      title: section.title,
      content: '', // Will be filled by generateContent
      order: parseInt(section.id.split('_')[0]) || 0
    }))
  }
}
