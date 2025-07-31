import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true // Note: In production, this should be done server-side
});

export interface TaskAnalysis {
  is2MinuteCandidate: boolean;
  confidence: number; // 0-1 scale
  reasoning?: string;
  estimatedDuration?: string;
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
            content: `You are an expert in Getting Things Done (GTD) methodology. Your job is to analyze tasks and determine if they could be completed in 2 minutes or less according to the GTD 2-minute rule.

The 2-minute rule states: "If something takes less than 2 minutes to do, do it now rather than adding it to your system."

Examples of 2-minute tasks:
- Sending a quick email or text
- Making a short phone call
- Filing a document
- Responding to a simple question
- Scheduling an appointment
- Paying a bill online
- Taking out trash
- Replying to a message

Examples of NOT 2-minute tasks:
- Writing a report
- Planning a project
- Complex research
- Long meetings
- Creative work
- Learning something new
- Shopping for multiple items

IMPORTANT: Respond with ONLY a valid JSON object (no markdown, no code blocks, no explanations). The JSON must contain:
- is2MinuteCandidate: boolean
- confidence: number (0-1)
- reasoning: string (brief explanation)
- estimatedDuration: string (like "1-2 minutes", "5-10 minutes", etc.)

Example response format:
{"is2MinuteCandidate": true, "confidence": 0.8, "reasoning": "Quick email response", "estimatedDuration": "1-2 minutes"}`
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
}

// Export singleton instance
export const aiService = AIService.getInstance(); 