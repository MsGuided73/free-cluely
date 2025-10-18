// ipcHandlers.ts

import { ipcMain, app } from "electron"
import { AppState } from "./main"

export function initializeIpcHandlers(appState: AppState): void {
  ipcMain.handle(
    "update-content-dimensions",
    async (event, { width, height }: { width: number; height: number }) => {
      if (width && height) {
        appState.setWindowDimensions(width, height)
      }
    }
  )

  ipcMain.handle("delete-screenshot", async (event, path: string) => {
    return appState.deleteScreenshot(path)
  })

  ipcMain.handle("take-screenshot", async () => {
    try {
      const screenshotPath = await appState.takeScreenshot()
      const preview = await appState.getImagePreview(screenshotPath)
      return { path: screenshotPath, preview }
    } catch (error) {
      console.error("Error taking screenshot:", error)
      throw error
    }
  })

  ipcMain.handle("get-screenshots", async () => {
    console.log({ view: appState.getView() })
    try {
      let previews = []
      if (appState.getView() === "queue") {
        previews = await Promise.all(
          appState.getScreenshotQueue().map(async (path) => ({
            path,
            preview: await appState.getImagePreview(path)
          }))
        )
      } else {
        previews = await Promise.all(
          appState.getExtraScreenshotQueue().map(async (path) => ({
            path,
            preview: await appState.getImagePreview(path)
          }))
        )
      }
      previews.forEach((preview: any) => console.log(preview.path))
      return previews
    } catch (error) {
      console.error("Error getting screenshots:", error)
      throw error
    }
  })

  ipcMain.handle("toggle-window", async () => {
    appState.toggleMainWindow()
  })

  ipcMain.handle("reset-queues", async () => {
    try {
      appState.clearQueues()
      console.log("Screenshot queues have been cleared.")
      return { success: true }
    } catch (error: any) {
      console.error("Error resetting queues:", error)
      return { success: false, error: error.message }
    }
  })

  // IPC handler for analyzing audio from base64 data
  ipcMain.handle("analyze-audio-base64", async (event, data: string, mimeType: string) => {
    try {
      const result = await appState.processingHelper.processAudioBase64(data, mimeType)
      return result
    } catch (error: any) {
      console.error("Error in analyze-audio-base64 handler:", error)
      throw error
    }
  })

  // IPC handler for analyzing audio from file path
  ipcMain.handle("analyze-audio-file", async (event, path: string) => {
    try {
      const result = await appState.processingHelper.processAudioFile(path)
      return result
    } catch (error: any) {
      console.error("Error in analyze-audio-file handler:", error)
      throw error
    }
  })

  // IPC handler for analyzing image from file path
  ipcMain.handle("analyze-image-file", async (event, path: string) => {
    try {
      const result = await appState.processingHelper.getLLMHelper().analyzeImageFile(path)
      return result
    } catch (error: any) {
      console.error("Error in analyze-image-file handler:", error)
      throw error
    }
  })

  ipcMain.handle("gemini-chat", async (event, message: string) => {
    try {
      const result = await appState.processingHelper.getLLMHelper().chatWithGemini(message);
      return result;
    } catch (error: any) {
      console.error("Error in gemini-chat handler:", error);
      throw error;
    }
  });

  ipcMain.handle("quit-app", () => {
    app.quit()
  })

  // Window movement handlers
  ipcMain.handle("move-window-left", async () => {
    appState.moveWindowLeft()
  })

  ipcMain.handle("move-window-right", async () => {
    appState.moveWindowRight()
  })

  ipcMain.handle("move-window-up", async () => {
    appState.moveWindowUp()
  })

  ipcMain.handle("move-window-down", async () => {
    appState.moveWindowDown()
  })

  ipcMain.handle("center-and-show-window", async () => {
    appState.centerAndShowWindow()
  })

  // LLM Model Management Handlers
  ipcMain.handle("get-current-llm-config", async () => {
    try {
      const llmHelper = appState.processingHelper.getLLMHelper();
      return {
        provider: llmHelper.getCurrentProvider(),
        model: llmHelper.getCurrentModel(),
        isOllama: llmHelper.isUsingOllama()
      };
    } catch (error: any) {
      console.error("Error getting current LLM config:", error);
      throw error;
    }
  });

  ipcMain.handle("get-available-ollama-models", async () => {
    try {
      const llmHelper = appState.processingHelper.getLLMHelper();
      const models = await llmHelper.getOllamaModels();
      return models;
    } catch (error: any) {
      console.error("Error getting Ollama models:", error);
      throw error;
    }
  });

  ipcMain.handle("switch-to-ollama", async (_, model?: string, url?: string) => {
    try {
      const llmHelper = appState.processingHelper.getLLMHelper();
      await llmHelper.switchToOllama(model, url);
      return { success: true };
    } catch (error: any) {
      console.error("Error switching to Ollama:", error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle("switch-to-gemini", async (_, apiKey?: string) => {
    try {
      const llmHelper = appState.processingHelper.getLLMHelper();
      await llmHelper.switchToGemini(apiKey);
      return { success: true };
    } catch (error: any) {
      console.error("Error switching to Gemini:", error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle("test-llm-connection", async () => {
    try {
      const llmHelper = appState.processingHelper.getLLMHelper();
      const result = await llmHelper.testConnection();
      return result;
    } catch (error: any) {
      console.error("Error testing LLM connection:", error);
      return { success: false, error: error.message };
    }
  });

  // Document Generation Handlers
  ipcMain.handle("generate-document", async (_, request: any) => {
    try {
      const codingAssistant = appState.getCodingAssistant();
      if (!codingAssistant) {
        throw new Error("Coding assistant not initialized");
      }

      const document = await codingAssistant.generateDocument(request);
      return document;
    } catch (error: any) {
      console.error("Error generating document:", error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle("get-document-types", async () => {
    try {
      const codingAssistant = appState.getCodingAssistant();
      if (!codingAssistant) {
        throw new Error("Coding assistant not initialized");
      }

      const types = codingAssistant.getAvailableDocumentTypes();
      return types;
    } catch (error: any) {
      console.error("Error getting document types:", error);
      return [];
    }
  });

  ipcMain.handle("export-document", async (_, document: any, format: 'markdown' | 'json' | 'html', outputPath?: string) => {
    try {
      const codingAssistant = appState.getCodingAssistant();
      if (!codingAssistant) {
        throw new Error("Coding assistant not initialized");
      }

      const exportedContent = await codingAssistant.exportDocument(document, format, outputPath);
      return { success: true, content: exportedContent };
    } catch (error: any) {
      console.error("Error exporting document:", error);
      return { success: false, error: error.message };
    }
  });

  // Quick document generation handlers
  ipcMain.handle("generate-prd", async (_, requirements: string[], additionalContext?: string) => {
    try {
      const codingAssistant = appState.getCodingAssistant();
      if (!codingAssistant) {
        throw new Error("Coding assistant not initialized");
      }

      const document = await codingAssistant.generatePRD(requirements, additionalContext);
      return document;
    } catch (error: any) {
      console.error("Error generating PRD:", error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle("generate-technical-spec", async (_, requirements: string[]) => {
    try {
      const codingAssistant = appState.getCodingAssistant();
      if (!codingAssistant) {
        throw new Error("Coding assistant not initialized");
      }

      const document = await codingAssistant.generateTechnicalSpec(requirements);
      return document;
    } catch (error: any) {
      console.error("Error generating technical spec:", error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle("generate-user-stories", async (_, requirements: string[], targetAudience?: string) => {
    try {
      const codingAssistant = appState.getCodingAssistant();
      if (!codingAssistant) {
        throw new Error("Coding assistant not initialized");
      }

      const document = await codingAssistant.generateUserStories(requirements, targetAudience);
      return document;
    } catch (error: any) {
      console.error("Error generating user stories:", error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle("generate-api-documentation", async () => {
    try {
      const codingAssistant = appState.getCodingAssistant();
      if (!codingAssistant) {
        throw new Error("Coding assistant not initialized");
      }

      const document = await codingAssistant.generateAPIDocumentation();
      return document;
    } catch (error: any) {
      console.error("Error generating API documentation:", error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle("generate-architecture-decision", async (_, requirements: string[]) => {
    try {
      const codingAssistant = appState.getCodingAssistant();
      if (!codingAssistant) {
        throw new Error("Coding assistant not initialized");
      }

      const document = await codingAssistant.generateArchitectureDecision(requirements);
      return document;
    } catch (error: any) {
      console.error("Error generating architecture decision:", error);
      return { success: false, error: error.message };
    }
  });

  // Project Analysis Handlers
  ipcMain.handle("analyze-project", async (_, projectPath: string) => {
    try {
      const projectDetector = appState.getProjectDetector();
      if (!projectDetector) {
        throw new Error("Project detector not initialized");
      }

      const context = await projectDetector.detectProject(projectPath);
      return context;
    } catch (error: any) {
      console.error("Error analyzing project:", error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle("get-project-health", async (_, projectPath: string) => {
    try {
      const projectDetector = appState.getProjectDetector();
      if (!projectDetector) {
        throw new Error("Project detector not initialized");
      }

      const health = await projectDetector.analyzeProjectHealth(projectPath);
      return health;
    } catch (error: any) {
      console.error("Error getting project health:", error);
      return { success: false, error: error.message };
    }
  });

  // Session Management Handlers
  ipcMain.handle("create-session", async (_, projectPath: string) => {
    try {
      const codingAssistant = appState.getCodingAssistant();
      if (!codingAssistant) {
        throw new Error("Coding assistant not initialized");
      }

      const session = await codingAssistant.initializeSession(projectPath);
      return session;
    } catch (error: any) {
      console.error("Error creating session:", error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle("get-session-progress", async (_, sessionId: string) => {
    try {
      const codingAssistant = appState.getCodingAssistant();
      if (!codingAssistant) {
        throw new Error("Coding assistant not initialized");
      }

      const progress = codingAssistant.getProgressReport();
      return progress;
    } catch (error: any) {
      console.error("Error getting session progress:", error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle("update-session-stage", async (_, sessionId: string, stage: string) => {
    try {
      const codingAssistant = appState.getCodingAssistant();
      if (!codingAssistant) {
        throw new Error("Coding assistant not initialized");
      }

      // Convert string to enum
      const stageEnum = stage as any; // DevelopmentStage
      await codingAssistant.updateStage(stageEnum);
      return { success: true };
    } catch (error: any) {
      console.error("Error updating session stage:", error);
      return { success: false, error: error.message };
    }
  });
}
