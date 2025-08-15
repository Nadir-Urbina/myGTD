import React from 'react';
import { CheckSquare, Inbox, Target } from 'lucide-react';
import { useLanguage } from '@/contexts/language-context';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showSubtitle?: boolean;
  className?: string;
}

export function Logo({ size = 'md', showSubtitle = true, className = '' }: LogoProps) {
  const { t } = useLanguage();

  const sizeClasses = {
    sm: {
      container: 'flex items-center gap-2',
      iconContainer: 'flex items-center gap-1',
      icon: 'h-4 w-4',
      title: 'text-lg font-bold',
      subtitle: 'text-xs'
    },
    md: {
      container: 'flex items-center gap-3',
      iconContainer: 'flex items-center gap-1',
      icon: 'h-5 w-5',
      title: 'text-xl font-bold',
      subtitle: 'text-sm'
    },
    lg: {
      container: 'flex items-center gap-4',
      iconContainer: 'flex items-center gap-1.5',
      icon: 'h-6 w-6',
      title: 'text-2xl font-bold',
      subtitle: 'text-base'
    }
  };

  const classes = sizeClasses[size];

  return (
    <div className={`${classes.container} ${className}`}>
      {/* Logo Icon Stack */}
      <div className="relative">
        {/* Background Circle */}
        <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl p-2 shadow-md">
          <div className={classes.iconContainer}>
            <CheckSquare className={`${classes.icon} text-white`} />
            <div className="flex flex-col gap-0.5">
              <div className="w-1 h-1 bg-white/70 rounded-full"></div>
              <div className="w-1 h-1 bg-white/50 rounded-full"></div>
              <div className="w-1 h-1 bg-white/30 rounded-full"></div>
            </div>
          </div>
        </div>
        
        {/* Small accent badge */}
        <div className="absolute -top-1 -right-1 bg-green-500 rounded-full p-0.5">
          <Target className="h-2 w-2 text-white" />
        </div>
      </div>

      {/* Text */}
      <div className="flex flex-col">
        <div className="flex items-center gap-1">
          <span className={`${classes.title} text-gray-900`}>Effectiv</span>
          <span className={`${classes.title} bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent`}>
            O
          </span>
        </div>
        {showSubtitle && (
          <span className={`${classes.subtitle} text-gray-500 leading-tight`}>
            {t('landing.nav.subtitle')}
          </span>
        )}
      </div>
    </div>
  );
}

// Simplified version for very small spaces
export function LogoMark({ className = '' }: { className?: string }) {
  return (
    <div className={`relative ${className}`}>
      <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg p-1.5 shadow-sm">
        <CheckSquare className="h-4 w-4 text-white" />
      </div>
      <div className="absolute -top-0.5 -right-0.5 bg-green-500 rounded-full p-0.5">
        <Target className="h-1.5 w-1.5 text-white" />
      </div>
    </div>
  );
} 