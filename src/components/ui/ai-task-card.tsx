'use client';

import { ReactNode, useEffect, useState } from 'react';
import { aiService, TaskAnalysis } from '@/services/ai';
import { TwoMinuteRuleBorder } from '@/components/ui/border-beam';
import { useLanguage } from '@/contexts/language-context';
import { useSettings } from '@/contexts/settings-context';
import { Clock, Zap, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AITaskCardProps {
  children: ReactNode;
  taskTitle: string;
  taskDescription?: string;
  className?: string;
  enableAI?: boolean;
  showTooltip?: boolean;
  onAnalysisComplete?: (analysis: TaskAnalysis) => void;
}

export function AITaskCard({
  children,
  taskTitle,
  taskDescription,
  className,
  enableAI = true,
  showTooltip = true,
  onAnalysisComplete
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
        const result = await aiService.analyzeTask(taskTitle, taskDescription);
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

    // Add a small delay to avoid overwhelming the API
    const timer = setTimeout(analyzeTask, Math.random() * 1000 + 500);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [taskTitle, taskDescription, enableAI, aiAnalysisEnabled, onAnalysisComplete]);

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

  // If it's a 2-minute rule candidate, wrap with border beam
  if (analysis.is2MinuteCandidate && analysis.confidence > 0.6) {
    return (
      <div className={cn('relative', className)}>
        <TwoMinuteRuleBorder>
          {children}
        </TwoMinuteRuleBorder>
        
        {/* 2-Minute Rule Badge */}
        <div className="absolute top-2 right-2 z-20">
          <div 
            className="flex items-center gap-1 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-medium shadow-sm cursor-pointer hover:bg-green-600 transition-colors"
            onClick={() => setShowDetails(!showDetails)}
            title={t('ai.twoMinuteRule.tooltip')}
          >
            <Zap className="h-3 w-3" />
            <span>2min</span>
            {showTooltip && <Info className="h-3 w-3" />}
          </div>
        </div>

        {/* Analysis Details Tooltip */}
        {showDetails && showTooltip && (
          <div className="absolute top-10 right-2 z-30 bg-white border border-gray-200 rounded-lg shadow-lg p-3 w-64 text-sm">
            <div className="mb-2">
              <div className="font-medium text-green-700 mb-1">
                {t('ai.twoMinuteRule.candidate')}
              </div>
              <div className="text-gray-600 text-xs">
                {t('ai.twoMinuteRule.tooltip')}
              </div>
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
                  <div className="text-gray-500 mb-1">{t('ai.twoMinuteRule.reasoning')}:</div>
                  <div className="text-gray-700">{analysis.reasoning}</div>
                </div>
              )}
            </div>
            
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

  // Regular task (not a 2-minute candidate)
  return (
    <div className={className}>
      {children}
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