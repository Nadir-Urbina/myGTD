'use client';

import { ReactNode, useEffect, useState } from 'react';
import { aiService, TaskAnalysis } from '@/services/ai';
import { TwoMinuteRuleBorder } from '@/components/ui/border-beam';
import { useLanguage } from '@/contexts/language-context';
import { useSettings } from '@/contexts/settings-context';
import { Clock, Zap, Info, FolderOpen } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AITaskCardProps {
  children: ReactNode;
  taskTitle: string;
  taskDescription?: string;
  className?: string;
  enableAI?: boolean;
  showTooltip?: boolean;
  onAnalysisComplete?: (analysis: TaskAnalysis) => void;
  // New props for caching
  userId?: string;
  itemId?: string;
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
  };
}

export function AITaskCard({
  children,
  taskTitle,
  taskDescription,
  className,
  enableAI = true,
  showTooltip = true,
  onAnalysisComplete,
  userId,
  itemId,
  existingAnalysis
}: AITaskCardProps) {
  const { t } = useLanguage();
  const { aiAnalysisEnabled } = useSettings();
  const [analysis, setAnalysis] = useState<TaskAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    if (!enableAI || !aiAnalysisEnabled || !taskTitle.trim()) return;

    let isMounted = true;

    const analyzeTask = async () => {
      setIsAnalyzing(true);
      try {
        let result: TaskAnalysis;
        
        // Use caching if we have userId and itemId
        if (userId && itemId) {
          result = await aiService.analyzeTaskWithCaching(
            userId, 
            itemId, 
            taskTitle, 
            taskDescription, 
            existingAnalysis
          );
        } else {
          // Fallback to regular analysis
          result = await aiService.analyzeTask(taskTitle, taskDescription);
        }
        
        if (isMounted) {
          setAnalysis(result);
          onAnalysisComplete?.(result);
        }
      } catch (error) {
        console.error('Error analyzing task:', error);
      } finally {
        if (isMounted) {
          setIsAnalyzing(false);
        }
      }
    };

    // Check if we already have cached analysis
    if (existingAnalysis?.is2MinuteRuleCandidate !== undefined && 
        existingAnalysis?.isProjectCandidate !== undefined &&
        existingAnalysis?.aiAnalysisDate) {
      
      const daysSinceAnalysis = (Date.now() - existingAnalysis.aiAnalysisDate.getTime()) / (1000 * 60 * 60 * 24);
      
      if (daysSinceAnalysis < 30) {
        // Use cached analysis immediately
        const cachedAnalysis: TaskAnalysis = {
          is2MinuteCandidate: existingAnalysis.is2MinuteRuleCandidate,
          isProjectCandidate: existingAnalysis.isProjectCandidate,
          confidence: existingAnalysis.aiAnalysisData?.confidence || 0.8,
          reasoning: existingAnalysis.aiAnalysisData?.reasoning,
          estimatedDuration: existingAnalysis.aiAnalysisData?.estimatedDuration,
          projectReasoning: existingAnalysis.aiAnalysisData?.projectReasoning
        };
        setAnalysis(cachedAnalysis);
        onAnalysisComplete?.(cachedAnalysis);
        return;
      }
    }

    // Add a small delay to avoid overwhelming the API
    const timer = setTimeout(analyzeTask, Math.random() * 1000 + 500);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [taskTitle, taskDescription, enableAI, aiAnalysisEnabled, onAnalysisComplete, userId, itemId, existingAnalysis]);

  // If AI is disabled or no analysis yet, render normally
  if (!enableAI || !aiAnalysisEnabled || !analysis) {
    return (
      <div className={className}>
        {children}
        {isAnalyzing && enableAI && aiAnalysisEnabled && (
          <div className="absolute top-2 right-2 z-20">
            <div className="flex items-center gap-1 bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs">
              <Clock className="h-3 w-3 animate-spin" />
              <span>{t('ai.analyzing')}</span>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Determine what indicators to show
  const show2MinuteIndicator = analysis.is2MinuteCandidate && analysis.confidence > 0.6;
  const showProjectIndicator = analysis.isProjectCandidate;
  
  // Choose primary indicator (2-minute rule takes precedence)
  const hasPrimaryIndicator = show2MinuteIndicator || showProjectIndicator;
  
  return (
    <div className={cn('relative', className)}>
      {/* Apply border beam for 2-minute candidates */}
      {show2MinuteIndicator ? (
        <TwoMinuteRuleBorder>
          {children}
        </TwoMinuteRuleBorder>
      ) : (
        children
      )}
      
      {/* Indicators */}
      {hasPrimaryIndicator && (
        <div className="absolute top-2 right-2 z-20 flex gap-1">
          {/* Project Candidate Badge */}
          {showProjectIndicator && (
            <div 
              className="flex items-center gap-1 bg-blue-500 text-white px-2 py-1 rounded-full text-xs font-medium shadow-sm cursor-pointer hover:bg-blue-600 transition-colors"
              onClick={() => setShowDetails(!showDetails)}
              title="Might be a project"
            >
              <FolderOpen className="h-3 w-3" />
              <span>Project</span>
            </div>
          )}
          
          {/* 2-Minute Rule Badge */}
          {show2MinuteIndicator && (
            <div 
              className="flex items-center gap-1 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-medium shadow-sm cursor-pointer hover:bg-green-600 transition-colors"
              onClick={() => setShowDetails(!showDetails)}
              title={t('ai.twoMinuteRule.tooltip')}
            >
              <Zap className="h-3 w-3" />
              <span>2min</span>
            </div>
          )}
          
          {/* Info icon for details */}
          {showTooltip && (
            <div 
              className="flex items-center justify-center w-6 h-6 bg-gray-500 text-white rounded-full cursor-pointer hover:bg-gray-600 transition-colors"
              onClick={() => setShowDetails(!showDetails)}
            >
              <Info className="h-3 w-3" />
            </div>
          )}
        </div>
      )}

      {/* Analysis Details Tooltip */}
      {showDetails && showTooltip && hasPrimaryIndicator && (
        <div className="absolute top-10 right-2 z-30 bg-white border border-gray-200 rounded-lg shadow-lg p-3 w-72 text-sm">
          {/* 2-Minute Rule Section */}
          {show2MinuteIndicator && (
            <div className="mb-3">
              <div className="font-medium text-green-700 mb-1 flex items-center gap-1">
                <Zap className="h-4 w-4" />
                {t('ai.twoMinuteRule.candidate')}
              </div>
              <div className="text-gray-600 text-xs mb-2">
                {t('ai.twoMinuteRule.tooltip')}
              </div>
              
              <div className="space-y-1 text-xs">
                {analysis.confidence && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">{t('ai.twoMinuteRule.confidence')}:</span>
                    <span className="font-medium">{Math.round(analysis.confidence * 100)}%</span>
                  </div>
                )}
                
                {analysis.estimatedDuration && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">{t('ai.twoMinuteRule.estimatedTime')}:</span>
                    <span className="font-medium">{analysis.estimatedDuration}</span>
                  </div>
                )}
                
                {analysis.reasoning && (
                  <div className="mt-2 pt-2 border-t border-gray-100">
                    <div className="text-gray-500 mb-1">{t('ai.reasoning')}:</div>
                    <div className="text-gray-700">{analysis.reasoning}</div>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Project Candidate Section */}
          {showProjectIndicator && (
            <div className={show2MinuteIndicator ? 'pt-3 border-t border-gray-100' : ''}>
              <div className="font-medium text-blue-700 mb-1 flex items-center gap-1">
                <FolderOpen className="h-4 w-4" />
                Project Candidate
              </div>
              <div className="text-gray-600 text-xs mb-2">
                This task might require multiple steps and could become a project.
              </div>
              
              {analysis.projectReasoning && (
                <div className="text-xs">
                  <div className="text-gray-500 mb-1">Why it might be a project:</div>
                  <div className="text-gray-700">{analysis.projectReasoning}</div>
                </div>
              )}
            </div>
          )}
          
          {/* Close button */}
          <button
            onClick={() => setShowDetails(false)}
            className="absolute top-1 right-1 text-gray-400 hover:text-gray-600"
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
}

// Hook for managing AI analysis state
export function useAITaskAnalysis(taskTitle: string, taskDescription?: string) {
  const [analysis, setAnalysis] = useState<TaskAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    if (!taskTitle.trim()) return;

    let isMounted = true;

    const analyzeTask = async () => {
      setIsAnalyzing(true);
      try {
        const result = await aiService.analyzeTask(taskTitle, taskDescription);
        if (isMounted) {
          setAnalysis(result);
        }
      } catch (error) {
        console.error('Error analyzing task:', error);
      } finally {
        if (isMounted) {
          setIsAnalyzing(false);
        }
      }
    };

    analyzeTask();

    return () => {
      isMounted = false;
    };
  }, [taskTitle, taskDescription]);

  return { analysis, isAnalyzing };
} 