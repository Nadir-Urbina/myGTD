'use client';

import React, { ReactNode, useEffect, useState } from 'react';
import { aiService, IssueComplexityAnalysis } from '@/services/ai';
import { issuesService } from '@/services/firebase';
import { Issue } from '@/types';
import { useSettings } from '@/contexts/settings-context';
import { useAuth } from '@/contexts/auth-context';
import { 
  Info, 
  FolderOpen, 
  Brain,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Timer,
  Lightbulb,
  Settings,
  ExternalLink
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AIIssueCardProps {
  children: ReactNode;
  issue: Issue;
  className?: string;
  enableAI?: boolean;
  showTooltip?: boolean;
  onAnalysisComplete?: (analysis: IssueComplexityAnalysis) => void;
}

export function AIIssueCard({
  children,
  issue,
  className,
  enableAI = true,
  showTooltip = true,
  onAnalysisComplete
}: AIIssueCardProps) {
  const { aiAnalysisEnabled } = useSettings();
  const { user } = useAuth();
  const [analysis, setAnalysis] = useState<IssueComplexityAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    if (!enableAI || !aiAnalysisEnabled || !issue.title.trim()) return;

    let isMounted = true;

    const analyzeIssue = async () => {
      // First, check if we have a valid cached analysis in the issue object
      if (issue.aiComplexityAnalysis && 
          issue.aiAnalysisDate && 
          (Date.now() - new Date(issue.aiAnalysisDate).getTime()) < (30 * 24 * 60 * 60 * 1000)) { // 30 days
        setAnalysis(issue.aiComplexityAnalysis as unknown as IssueComplexityAnalysis);
        onAnalysisComplete?.(issue.aiComplexityAnalysis as unknown as IssueComplexityAnalysis);
        return;
      }

      setIsAnalyzing(true);
      try {
        const result = await aiService.analyzeIssueComplexity(
          issue.title,
          issue.description,
          issue.type,
          issue.reproductionSteps,
          issue.acceptanceCriteria
        );
        
        if (isMounted) {
          setAnalysis(result);
          onAnalysisComplete?.(result);
          
          // Save analysis to database for persistent caching
          if (user?.uid) {
            try {
              await issuesService.updateIssueAIAnalysis(user.uid, issue.id, result as unknown as Record<string, unknown>);
            } catch (error) {
              console.error('Failed to save AI analysis to database:', error);
              // Not a critical error - the analysis is still displayed
            }
          }
        }
      } catch (error) {
        console.error('Error analyzing issue complexity:', error);
      } finally {
        if (isMounted) {
          setIsAnalyzing(false);
        }
      }
    };

    // If we have cached analysis, use it immediately
    if (issue.aiComplexityAnalysis && 
        issue.aiAnalysisDate && 
        (Date.now() - new Date(issue.aiAnalysisDate).getTime()) < (30 * 24 * 60 * 60 * 1000)) {
      setAnalysis(issue.aiComplexityAnalysis as unknown as IssueComplexityAnalysis);
      onAnalysisComplete?.(issue.aiComplexityAnalysis as unknown as IssueComplexityAnalysis);
      return;
    }

    // Otherwise, run analysis after a small delay to avoid overwhelming the API
    const timer = setTimeout(analyzeIssue, Math.random() * 2000 + 1000);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [issue, enableAI, aiAnalysisEnabled, onAnalysisComplete, user?.uid]);

  // If AI is disabled or no analysis yet, render normally
  if (!enableAI || !aiAnalysisEnabled || !analysis) {
    return (
      <div className={className}>
        {children}
        {isAnalyzing && enableAI && aiAnalysisEnabled && (
          <div className="absolute top-2 right-2 z-20">
            <div className="flex items-center gap-1 bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs">
              <Brain className="h-3 w-3 animate-pulse" />
              <span>Analyzing...</span>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Complexity configuration
  const complexityConfig = {
    simple: {
      color: 'text-green-600 bg-green-100 border-green-200',
      icon: CheckCircle2,
      label: 'Simple',
      description: 'Quick task, 1-4 hours'
    },
    moderate: {
      color: 'text-yellow-600 bg-yellow-100 border-yellow-200', 
      icon: TrendingUp,
      label: 'Moderate',
      description: 'Medium effort, 1-3 days'
    },
    complex: {
      color: 'text-red-600 bg-red-100 border-red-200',
      icon: AlertTriangle,
      label: 'Complex',
      description: 'Large effort, 1+ weeks'
    }
  };

  const config = complexityConfig[analysis.complexity];
  const ComplexityIcon = config.icon;

  return (
    <div className={cn('relative', className)}>
      <div className="relative">
        {/* AI Analysis Indicators - positioned in Row 1 area */}
        <div className="absolute top-0 right-0 z-10 flex gap-1 p-3">
          {/* Complexity Badge */}
          <div 
            className={cn(
              'flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium shadow-sm cursor-pointer hover:opacity-80 transition-opacity',
              config.color
            )}
            onClick={() => setShowDetails(!showDetails)}
            title={`${config.label}: ${config.description}`}
          >
            <ComplexityIcon className="h-3 w-3" />
            <span>{config.label}</span>
          </div>

          {/* Time Estimate Badge */}
          {analysis.estimatedTimeRange && (
            <div 
              className="flex items-center gap-1 bg-blue-500 text-white px-2 py-1 rounded-full text-xs font-medium shadow-sm cursor-pointer hover:bg-blue-600 transition-colors"
              onClick={() => setShowDetails(!showDetails)}
              title="Estimated time to complete"
            >
              <Timer className="h-3 w-3" />
              <span>{analysis.estimatedTimeRange}</span>
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
        
        {children}
      </div>

      {/* Analysis Details Modal */}
      {showDetails && showTooltip && (
        <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 bg-white border border-gray-200 rounded-lg shadow-xl p-6 w-96 text-sm max-h-[80vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Brain className="h-4 w-4 text-blue-500" />
              <span className="font-medium text-gray-900">AI Analysis</span>
            </div>
            <div className="text-xs text-gray-500">
              {Math.round(analysis.confidence * 100)}% confidence
            </div>
          </div>

          {/* Complexity Section */}
          <div className="mb-3">
            <div className={cn('font-medium mb-1 flex items-center gap-1', config.color.split(' ')[0])}>
              <ComplexityIcon className="h-4 w-4" />
              {config.label} Complexity
            </div>
            <div className="text-gray-600 text-xs mb-2">
              {config.description}
            </div>
            
            {analysis.estimatedTimeRange && (
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Estimated time:</span>
                <span className="font-medium">{analysis.estimatedTimeRange}</span>
              </div>
            )}
          </div>

          {/* Reasoning */}
          {analysis.reasoning && (
            <div className="mb-3">
              <div className="text-gray-500 mb-1 text-xs">Reasoning:</div>
              <div className="text-gray-700 text-xs">{analysis.reasoning}</div>
            </div>
          )}

          {/* Recommended Approach */}
          {analysis.recommendedApproach && (
            <div className="mb-3">
              <div className="text-gray-500 mb-1 text-xs flex items-center gap-1">
                <Lightbulb className="h-3 w-3" />
                Recommended Approach:
              </div>
              <div className="text-gray-700 text-xs">{analysis.recommendedApproach}</div>
            </div>
          )}

          {/* Suggested Breakdown */}
          {analysis.suggestedBreakdown && analysis.suggestedBreakdown.length > 0 && (
            <div className="mb-3">
              <div className="text-gray-500 mb-1 text-xs flex items-center gap-1">
                <FolderOpen className="h-3 w-3" />
                Suggested Breakdown:
              </div>
              <ul className="text-gray-700 text-xs space-y-1">
                {analysis.suggestedBreakdown.map((task, index) => (
                  <li key={index} className="flex items-start gap-1">
                    <span className="text-gray-400 mt-0.5">•</span>
                    <span>{task}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Technical Considerations */}
          {analysis.technicalConsiderations && analysis.technicalConsiderations.length > 0 && (
            <div className="mb-3">
              <div className="text-gray-500 mb-1 text-xs flex items-center gap-1">
                <Settings className="h-3 w-3" />
                Technical Considerations:
              </div>
              <ul className="text-gray-700 text-xs space-y-1">
                {analysis.technicalConsiderations.map((consideration, index) => (
                  <li key={index} className="flex items-start gap-1">
                    <span className="text-gray-400 mt-0.5">•</span>
                    <span>{consideration}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Helpful Links */}
          {analysis.helpfulLinks && analysis.helpfulLinks.length > 0 && (
            <div className="mb-3">
              <div className="text-gray-500 mb-1 text-xs flex items-center gap-1">
                <ExternalLink className="h-3 w-3" />
                Helpful Resources:
              </div>
              <div className="space-y-2">
                {analysis.helpfulLinks.map((link, index) => (
                  <div key={index} className="bg-blue-50 border border-blue-200 rounded p-2">
                    <a 
                      href={link.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-700 hover:text-blue-900 font-medium text-xs block"
                    >
                      {link.title} ↗
                    </a>
                    {link.description && (
                      <p className="text-blue-600 text-xs mt-1">{link.description}</p>
                    )}
                  </div>
                ))}
              </div>
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

      {/* Invisible click area to close modal */}
      {showDetails && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowDetails(false)}
        />
      )}
    </div>
  );
}
