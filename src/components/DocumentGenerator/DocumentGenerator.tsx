import React, { useState, useEffect } from 'react'
import { useMutation, useQuery } from 'react-query'

interface DocumentType {
  type: string
  name: string
  description: string
}

interface ProjectContext {
  name: string
  type: string
  primaryLanguage: string
  confidence: number
}

interface DocumentGeneratorProps {
  isVisible: boolean
  onClose: () => void
}

const DocumentGenerator: React.FC<DocumentGeneratorProps> = ({ isVisible, onClose }) => {
  const [selectedDocType, setSelectedDocType] = useState<string>('')
  const [requirements, setRequirements] = useState<string[]>([''])
  const [additionalContext, setAdditionalContext] = useState<string>('')
  const [targetAudience, setTargetAudience] = useState<string>('')
  const [projectContext, setProjectContext] = useState<ProjectContext | null>(null)

  // Get available document types
  const { data: documentTypes = [] } = useQuery<DocumentType[]>(
    'document-types',
    async () => {
      if (!window.electronAPI) return []
      return await window.electronAPI.invoke('get-document-types')
    },
    { enabled: !!window.electronAPI }
  )

  // Generate document mutation
  const generateMutation = useMutation(
    async (request: any) => {
      if (!window.electronAPI) throw new Error('Electron API not available')
      return await window.electronAPI.invoke('generate-document', request)
    },
    {
      onSuccess: (document) => {
        console.log('Document generated successfully:', document)
        // Could add download or preview functionality here
      },
      onError: (error) => {
        console.error('Document generation failed:', error)
      }
    }
  )

  const handleAddRequirement = () => {
    setRequirements([...requirements, ''])
  }

  const handleRemoveRequirement = (index: number) => {
    setRequirements(requirements.filter((_, i) => i !== index))
  }

  const handleRequirementChange = (index: number, value: string) => {
    const updated = [...requirements]
    updated[index] = value
    setRequirements(updated)
  }

  const handleGenerate = async () => {
    if (!selectedDocType || !projectContext) return

    const request = {
      type: selectedDocType,
      projectContext,
      requirements: requirements.filter(req => req.trim() !== ''),
      targetAudience: targetAudience || undefined,
      additionalContext: additionalContext || undefined
    }

    generateMutation.mutate(request)
  }

  const handleExport = async (format: 'markdown' | 'html' | 'json') => {
    if (!generateMutation.data) return

    try {
      if (!window.electronAPI) throw new Error('Electron API not available')

      const result = await window.electronAPI.invoke('export-document',
        generateMutation.data,
        format
      )

      if (result.success) {
        console.log(`Document exported as ${format}:`, result.content)
        // Could trigger download or show preview
      }
    } catch (error) {
      console.error('Export failed:', error)
    }
  }

  if (!isVisible) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Document Generator</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        {/* Document Type Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Document Type
          </label>
          <select
            value={selectedDocType}
            onChange={(e) => setSelectedDocType(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Select a document type...</option>
            {documentTypes.map((type) => (
              <option key={type.type} value={type.type}>
                {type.name} - {type.description}
              </option>
            ))}
          </select>
        </div>

        {/* Project Context Display */}
        {projectContext && (
          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-medium text-blue-800 mb-2">Project Context</h3>
            <div className="text-sm text-blue-700">
              <p><strong>Name:</strong> {projectContext.name}</p>
              <p><strong>Type:</strong> {projectContext.type}</p>
              <p><strong>Language:</strong> {projectContext.primaryLanguage}</p>
              <p><strong>Confidence:</strong> {Math.round(projectContext.confidence * 100)}%</p>
            </div>
          </div>
        )}

        {/* Requirements Input */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Requirements
          </label>
          {requirements.map((req, index) => (
            <div key={index} className="flex gap-2 mb-2">
              <input
                type="text"
                value={req}
                onChange={(e) => handleRequirementChange(index, e.target.value)}
                placeholder={`Requirement ${index + 1}...`}
                className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              {requirements.length > 1 && (
                <button
                  onClick={() => handleRemoveRequirement(index)}
                  className="px-3 py-2 text-red-600 hover:text-red-800"
                >
                  Remove
                </button>
              )}
            </div>
          ))}
          <button
            onClick={handleAddRequirement}
            className="mt-2 px-4 py-2 text-blue-600 hover:text-blue-800 border border-blue-300 rounded-lg hover:bg-blue-50"
          >
            + Add Requirement
          </button>
        </div>

        {/* Target Audience */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Target Audience (Optional)
          </label>
          <input
            type="text"
            value={targetAudience}
            onChange={(e) => setTargetAudience(e.target.value)}
            placeholder="e.g., Product team, Developers, End users..."
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Additional Context */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Additional Context (Optional)
          </label>
          <textarea
            value={additionalContext}
            onChange={(e) => setAdditionalContext(e.target.value)}
            placeholder="Any additional context, constraints, or specific requirements..."
            rows={4}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 justify-end">
          {generateMutation.data && (
            <div className="flex gap-2">
              <button
                onClick={() => handleExport('markdown')}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Export MD
              </button>
              <button
                onClick={() => handleExport('html')}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Export HTML
              </button>
              <button
                onClick={() => handleExport('json')}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Export JSON
              </button>
            </div>
          )}

          <button
            onClick={handleGenerate}
            disabled={!selectedDocType || requirements.filter(r => r.trim()).length === 0 || generateMutation.isLoading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {generateMutation.isLoading ? 'Generating...' : 'Generate Document'}
          </button>
        </div>

        {/* Generation Status */}
        {generateMutation.isLoading && (
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center gap-2 text-blue-800">
              <div className="animate-spin w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
              <span>Generating document with AI...</span>
            </div>
          </div>
        )}

        {/* Error Display */}
        {generateMutation.error && (
          <div className="mt-4 p-4 bg-red-50 rounded-lg">
            <p className="text-red-800">
              Error: {generateMutation.error instanceof Error ? generateMutation.error.message : 'Unknown error'}
            </p>
          </div>
        )}

        {/* Generated Document Preview */}
        {generateMutation.data && (
          <div className="mt-6">
            <h3 className="text-lg font-medium text-gray-800 mb-3">Generated Document</h3>
            <div className="p-4 bg-gray-50 rounded-lg max-h-96 overflow-y-auto">
              <div className="prose prose-sm max-w-none">
                <h4 className="text-blue-800">{generateMutation.data.title}</h4>
                <div className="whitespace-pre-wrap text-gray-700 text-sm">
                  {generateMutation.data.content.substring(0, 1000)}
                  {generateMutation.data.content.length > 1000 && '...'}
                </div>
              </div>
            </div>
            <div className="mt-2 text-xs text-gray-500">
              Generated in {generateMutation.data.metadata.generationTime}ms using {generateMutation.data.metadata.aiProvider}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default DocumentGenerator
