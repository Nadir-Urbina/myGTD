import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true // Note: In production, this should be done server-side
});

export interface TaskAnalysis {
  is2MinuteCandidate: boolean;
  isProjectCandidate: boolean;
  confidence: number; // 0-1 scale
  reasoning?: string;
  estimatedDuration?: string;
  projectReasoning?: string;
}

export interface IssueComplexityAnalysis {
  complexity: 'simple' | 'moderate' | 'complex';
  reasoning: string;
  confidence: number; // 0-1 scale
  suggestedBreakdown?: string[]; // suggested subtasks if complex
  estimatedTimeRange?: string; // e.g., "2-4 hours", "1-2 days"
  relatedIssues?: string[]; // IDs of potentially related issues
  recommendedApproach?: string; // suggested approach for implementation
  technicalConsiderations?: string[]; // technical aspects to consider
  helpfulLinks?: Array<{ title: string; url: string; description?: string }>; // relevant documentation/resources
}

// AI Model Configuration - easily switch between cost-efficient models
const AI_CONFIG = {
  // Most cost-efficient option for 2025
  model: 'gpt-4o-mini', // 90% cheaper than gpt-3.5-turbo
  maxTokens: 150, // Reduced from 200 for further cost savings
  temperature: 0.2, // Slightly lower for more consistent results
  
  // Alternative models for different budgets:
  // 'gpt-4-1-nano' - Ultra budget: $0.10/$0.40 per 1M tokens
  // 'gpt-4-1-mini' - Balanced: $0.40/$1.60 per 1M tokens
  // 'gpt-4o-mini' - Recommended: $0.15/$0.60 per 1M tokens
} as const;

export class AIService {
  private static instance: AIService;
  private cache = new Map<string, TaskAnalysis>();
  private currentModel: string = AI_CONFIG.model;

  private constructor() {
    // Clear cache if model has changed since last session (only in browser)
    if (typeof window !== 'undefined') {
      const storedModel = localStorage.getItem('ai-model');
      if (storedModel && storedModel !== AI_CONFIG.model) {
        this.cache.clear();
        console.log(`AI model changed from ${storedModel} to ${AI_CONFIG.model}, clearing cache`);
      }
      localStorage.setItem('ai-model', AI_CONFIG.model);
    }
  }

  static getInstance(): AIService {
    if (!AIService.instance) {
      AIService.instance = new AIService();
    }
    return AIService.instance;
  }

  /**
   * Analyze a task and cache results in Firestore to avoid repeated API calls
   */
  async analyzeTaskWithCaching(
    userId: string, 
    itemId: string, 
    taskTitle: string, 
    taskDescription?: string,
    existingAnalysis?: { 
      is2MinuteRuleCandidate?: boolean;
      isProjectCandidate?: boolean;
      aiAnalysisDate?: Date;
      aiAnalysisData?: {
        confidence: number;
        reasoning?: string;
        estimatedDuration?: string;
        projectReasoning?: string;
      };
    }
  ): Promise<TaskAnalysis> {
    // Check if we already have valid cached analysis (within last 30 days)
    if (existingAnalysis?.aiAnalysisDate) {
      const daysSinceAnalysis = (Date.now() - existingAnalysis.aiAnalysisDate.getTime()) / (1000 * 60 * 60 * 24);
      
      if (daysSinceAnalysis < 30 && 
          existingAnalysis.is2MinuteRuleCandidate !== undefined && 
          existingAnalysis.isProjectCandidate !== undefined) {
        
        // Return cached analysis
        return {
          is2MinuteCandidate: existingAnalysis.is2MinuteRuleCandidate,
          isProjectCandidate: existingAnalysis.isProjectCandidate,
          confidence: existingAnalysis.aiAnalysisData?.confidence || 0.8,
          reasoning: existingAnalysis.aiAnalysisData?.reasoning,
          estimatedDuration: existingAnalysis.aiAnalysisData?.estimatedDuration,
          projectReasoning: existingAnalysis.aiAnalysisData?.projectReasoning
        };
      }
    }

    // Perform fresh analysis
    const analysis = await this.analyzeTask(taskTitle, taskDescription);
    
    // Save results to Firestore (don't await to avoid blocking UI)
    this.saveAnalysisToFirestore(userId, itemId, analysis).catch(error => {
      console.warn('Failed to save AI analysis to Firestore:', error);
    });

    return analysis;
  }

  /**
   * Analyze a task to determine if it might be a 2-minute rule candidate
   */
  async analyzeTask(taskTitle: string, taskDescription?: string): Promise<TaskAnalysis> {
    // Create cache key
    const cacheKey = `${taskTitle}|${taskDescription || ''}`;
    
    // Check cache first
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    try {
      const prompt = this.buildAnalysisPrompt(taskTitle, taskDescription);
      
      const response = await openai.chat.completions.create({
        model: AI_CONFIG.model,
        messages: [
          {
            role: 'system',
            content: `You are an expert in Getting Things Done (GTD) methodology. Your job is to analyze tasks and determine:

1. **2-MINUTE RULE**: If they could be completed in 2 minutes or less
2. **PROJECT CANDIDATE**: If they require more than 2 steps (should become a project)

## 2-MINUTE RULE ANALYSIS:
"If something takes less than 2 minutes to do, do it now rather than adding it to your system."

Examples of 2-minute tasks:
- Sending a quick email or text
- Making a short phone call
- Filing a document
- Responding to a simple question
- Scheduling an appointment
- Paying a bill online
- Taking out trash
- Replying to a message

## PROJECT CANDIDATE ANALYSIS:
"If a task will take more than 2 steps to complete, it should become a project."

Examples of project candidates:
- "Organize home office" (clean, declutter, reorganize, file documents)
- "Plan vacation" (research destinations, book flights, reserve hotels, plan activities)
- "Hire new employee" (write job description, post job, interview candidates, make offer)
- "Launch website" (design, develop, test, deploy, promote)
- "Learn Spanish" (buy materials, schedule classes, practice daily, take tests)

Examples of NOT project candidates:
- "Call John about meeting" (single step)
- "Buy milk" (single step)
- "Send report to manager" (single step)

IMPORTANT: Respond with ONLY a valid JSON object (no markdown, no code blocks, no explanations). The JSON must contain:
- is2MinuteCandidate: boolean
- isProjectCandidate: boolean  
- confidence: number (0-1, confidence in the 2-minute analysis)
- reasoning: string (brief explanation for 2-minute rule)
- estimatedDuration: string (like "1-2 minutes", "5-10 minutes", etc.)
- projectReasoning: string (brief explanation if it's a project candidate)

Example response format:
{"is2MinuteCandidate": false, "isProjectCandidate": true, "confidence": 0.9, "reasoning": "Requires planning and coordination", "estimatedDuration": "2-3 hours", "projectReasoning": "Multiple steps: research, plan, coordinate, execute"}`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: AI_CONFIG.maxTokens,
        temperature: AI_CONFIG.temperature
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response from OpenAI');
      }

      // Parse JSON response - handle markdown code blocks from GPT-4o mini
      let jsonContent = content.trim();
      
      // Remove markdown code blocks if present
      if (jsonContent.startsWith('```json')) {
        jsonContent = jsonContent.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (jsonContent.startsWith('```')) {
        jsonContent = jsonContent.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }
      
      const analysis = JSON.parse(jsonContent) as TaskAnalysis;
      
      // Validate response
      if (typeof analysis.is2MinuteCandidate !== 'boolean' || 
          typeof analysis.confidence !== 'number') {
        throw new Error('Invalid response format from OpenAI');
      }

      // Cache the result
      this.cache.set(cacheKey, analysis);
      
      return analysis;

    } catch (error) {
      console.error('Error analyzing task with AI:', error);
      
      // Fallback analysis based on simple heuristics
      const fallbackAnalysis: TaskAnalysis = {
        is2MinuteCandidate: this.simpleFallbackAnalysis(taskTitle, taskDescription),
        isProjectCandidate: false, // Conservative fallback
        confidence: 0.3,
        reasoning: 'AI analysis unavailable, using simple heuristics',
        estimatedDuration: 'Unknown'
      };

      this.cache.set(cacheKey, fallbackAnalysis);
      return fallbackAnalysis;
    }
  }

  /**
   * Build the analysis prompt for OpenAI
   */
  private buildAnalysisPrompt(title: string, description?: string): string {
    let prompt = `Task: "${title}"`;
    
    if (description && description.trim() !== title.trim()) {
      prompt += `\nDescription: "${description}"`;
    }
    
    prompt += '\n\nAnalyze this task and determine if it could reasonably be completed in 2 minutes or less.';
    
    return prompt;
  }

  /**
   * Simple fallback analysis when AI is unavailable
   */
  private simpleFallbackAnalysis(title: string, description?: string): boolean {
    const text = `${title} ${description || ''}`.toLowerCase();
    
    // Quick tasks keywords
    const quickTaskKeywords = [
      'email', 'text', 'message', 'call', 'phone', 'reply', 'respond',
      'file', 'save', 'bookmark', 'schedule', 'cancel', 'confirm',
      'pay', 'bill', 'order', 'buy', 'purchase', 'send', 'forward',
      'delete', 'archive', 'organize', 'clean', 'tidy', 'put away',
      'check', 'look', 'find', 'search', 'quick', 'brief', 'short'
    ];

    // Complex tasks keywords
    const complexTaskKeywords = [
      'write', 'create', 'develop', 'build', 'design', 'plan', 'strategy',
      'research', 'analyze', 'study', 'learn', 'meeting', 'presentation',
      'report', 'document', 'proposal', 'review', 'complete', 'finish',
      'project', 'complex', 'detailed', 'comprehensive'
    ];

    const hasQuickKeywords = quickTaskKeywords.some(keyword => text.includes(keyword));
    const hasComplexKeywords = complexTaskKeywords.some(keyword => text.includes(keyword));
    
    // If it has quick keywords and no complex keywords, might be a 2-minute task
    return hasQuickKeywords && !hasComplexKeywords;
  }

  /**
   * Get cost statistics for monitoring AI usage
   */
  getCostStats(): {
    totalRequests: number;
    cacheHits: number;
    estimatedCost: number;
    costSavings: number;
  } {
    const totalRequests = this.cache.size;
    const cacheHits = this.cache.size; // All cached items were hits
    
    // Estimated cost calculation (based on GPT-4o mini pricing)
    const avgInputTokens = 150; // Estimated average
    const avgOutputTokens = 50;  // Estimated average
    const inputCostPer1M = 0.15; // $0.15 per 1M tokens
    const outputCostPer1M = 0.60; // $0.60 per 1M tokens
    
    const costPerRequest = 
      (avgInputTokens * inputCostPer1M / 1000000) +
      (avgOutputTokens * outputCostPer1M / 1000000);
    
    const estimatedCost = totalRequests * costPerRequest;
    
    // Cost savings vs GPT-3.5-turbo (estimated 90% savings)
    const oldModelCostPerRequest = costPerRequest * 10; // 10x more expensive
    const costSavings = totalRequests * (oldModelCostPerRequest - costPerRequest);
    
    return {
      totalRequests,
      cacheHits,
      estimatedCost: parseFloat(estimatedCost.toFixed(6)),
      costSavings: parseFloat(costSavings.toFixed(6))
    };
  }

  /**
   * Clear the analysis cache (useful for testing different models)
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }

  /**
   * Save AI analysis results to Firestore to cache them
   */
  private async saveAnalysisToFirestore(
    userId: string, 
    itemId: string, 
    analysis: TaskAnalysis
  ): Promise<void> {
    try {
      const { doc, updateDoc, Timestamp } = await import('firebase/firestore');
      const { db } = await import('@/lib/firebase');
      
      // Try updating in inbox first, then next actions if not found
      const collections = ['inbox', 'nextActions', 'maybeSomeday'];
      
      for (const collectionName of collections) {
        try {
          const docRef = doc(db, `users/${userId}/${collectionName}`, itemId);
          await updateDoc(docRef, {
            is2MinuteRuleCandidate: analysis.is2MinuteCandidate,
            isProjectCandidate: analysis.isProjectCandidate,
            aiAnalysisDate: Timestamp.now(),
            aiAnalysisData: {
              confidence: analysis.confidence,
              reasoning: analysis.reasoning,
              estimatedDuration: analysis.estimatedDuration,
              projectReasoning: analysis.projectReasoning
            },
            updatedAt: Timestamp.now()
          });
          break; // Success, exit loop
        } catch {
          // Continue to next collection if this one fails
          continue;
        }
      }
    } catch (error) {
      console.error('Failed to save analysis to Firestore:', error);
      throw error;
    }
  }

  /**
   * Analyze an issue for complexity and effort estimation
   */
  async analyzeIssueComplexity(
    issueTitle: string, 
    issueDescription?: string,
    issueType?: string,
    reproductionSteps?: string,
    acceptanceCriteria?: string
  ): Promise<IssueComplexityAnalysis> {
    // Create cache key
    const cacheKey = `issue_${issueTitle}|${issueDescription || ''}|${issueType || ''}`;
    
    // Check cache first
    if (this.issueCache.has(cacheKey)) {
      return this.issueCache.get(cacheKey)!;
    }

    try {
      const prompt = this.buildIssueAnalysisPrompt(
        issueTitle, 
        issueDescription, 
        issueType,
        reproductionSteps,
        acceptanceCriteria
      );
      
      const response = await openai.chat.completions.create({
        model: AI_CONFIG.model,
        messages: [
          {
            role: 'system',
            content: `You are an expert software engineering consultant specializing in issue complexity analysis and effort estimation. Your job is to analyze development issues and determine:

1. **COMPLEXITY LEVEL**: Whether the issue is simple, moderate, or complex
2. **EFFORT ESTIMATION**: How much time it would likely take to implement
3. **IMPLEMENTATION APPROACH**: Recommended approach and breakdown

## COMPLEXITY DEFINITIONS:

**SIMPLE** (1-4 hours):
- UI text changes, simple styling updates
- Adding basic form fields or validation
- Small bug fixes with clear root cause
- Configuration changes
- Simple API endpoint additions

**MODERATE** (1-3 days):
- New feature implementations with moderate scope
- Database schema changes with migrations
- Integration with external APIs
- Complex UI components with state management
- Bug fixes requiring investigation across multiple files

**COMPLEX** (1+ weeks):
- Major architectural changes
- New system integrations
- Performance optimization projects
- Large-scale refactoring
- Features requiring multiple components/services
- Complex algorithms or data processing

IMPORTANT: Respond with ONLY a valid JSON object (no markdown, no code blocks). The JSON must contain:
- complexity: "simple" | "moderate" | "complex"
- reasoning: string (brief explanation)
- confidence: number (0-1)
- estimatedTimeRange: string (e.g., "2-4 hours", "1-2 days")
- suggestedBreakdown: string[] (if complex, suggest subtasks)
- recommendedApproach: string (suggested implementation approach)
- technicalConsiderations: string[] (technical aspects to consider)
- helpfulLinks: array of {title: string, url: string, description?: string} (relevant docs/tutorials)

Example response:
{"complexity": "moderate", "reasoning": "Requires database changes and API updates", "confidence": 0.85, "estimatedTimeRange": "1-2 days", "suggestedBreakdown": ["Update database schema", "Modify API endpoints", "Update frontend components"], "recommendedApproach": "Start with backend changes, then update frontend", "technicalConsiderations": ["Consider data migration strategy", "Ensure backward compatibility"], "helpfulLinks": [{"title": "Database Migration Guide", "url": "https://docs.example.com/migrations", "description": "Best practices for safe schema changes"}]}`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 250, // Increased for more detailed analysis
        temperature: AI_CONFIG.temperature,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response from AI');
      }

      let analysis: IssueComplexityAnalysis;
      try {
        analysis = JSON.parse(content);
      } catch (parseError) {
        console.error('Failed to parse AI response:', content);
        throw new Error('Invalid AI response format');
      }

      // Validate the response
      if (!analysis.complexity || !analysis.reasoning || typeof analysis.confidence !== 'number') {
        throw new Error('Incomplete AI analysis response');
      }

      // Cache the result
      this.issueCache.set(cacheKey, analysis);

      return analysis;
    } catch (error) {
      console.error('Error analyzing issue complexity:', error);
      // Return fallback analysis
      return {
        complexity: 'moderate',
        reasoning: 'Unable to analyze complexity automatically',
        confidence: 0.3,
        estimatedTimeRange: '1-2 days',
        recommendedApproach: 'Break down into smaller tasks and tackle systematically'
      };
    }
  }

  /**
   * Build the prompt for issue complexity analysis
   */
  private buildIssueAnalysisPrompt(
    title: string, 
    description?: string, 
    type?: string,
    reproductionSteps?: string,
    acceptanceCriteria?: string
  ): string {
    let prompt = `Issue Title: "${title}"\n`;
    
    if (type) {
      prompt += `Issue Type: ${type}\n`;
    }
    
    if (description) {
      prompt += `Description: ${description}\n`;
    }
    
    if (reproductionSteps) {
      prompt += `Reproduction Steps: ${reproductionSteps}\n`;
    }
    
    if (acceptanceCriteria) {
      prompt += `Acceptance Criteria: ${acceptanceCriteria}\n`;
    }
    
    prompt += '\nPlease analyze this issue for complexity and provide effort estimation.';
    
    return prompt;
  }

  // Add issue cache
  private issueCache = new Map<string, IssueComplexityAnalysis>();
}

// Export singleton instance
export const aiService = AIService.getInstance(); 