'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { cn } from '@/lib/utils';
import { Inbox, CheckSquare, Calendar, FolderOpen, Menu, X, User, LogOut, ChevronDown } from 'lucide-react';

const navigationItems = [
  {
    name: 'Inbox',
    href: '/inbox',
    icon: Inbox,
    description: 'Capture new tasks and ideas',
  },
  {
    name: 'Next Actions',
    href: '/next-actions',
    icon: CheckSquare,
    description: 'Your actionable tasks',
  },
  {
    name: 'Calendar',
    href: '/calendar',
    icon: Calendar,
    description: 'Scheduled actions',
  },
  {
    name: 'Projects',
    href: '/projects',
    icon: FolderOpen,
    description: 'Multi-step initiatives',
  },
];

export function Navigation() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, signOut } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const mobileUserMenuRef = useRef<HTMLDivElement>(null);

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push('/auth/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Close user menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        userMenuRef.current && !userMenuRef.current.contains(event.target as Node) &&
        mobileUserMenuRef.current && !mobileUserMenuRef.current.contains(event.target as Node)
      ) {
        setIsUserMenuOpen(false);
      }
    }

    if (isUserMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isUserMenuOpen]);

  return (
    <>
      {/* Mobile Header */}
      <div className="lg:hidden bg-white border-b border-gray-200 p-4 fixed top-0 left-0 right-0 z-40">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">MyGTD</h1>
          <div className="flex items-center gap-2">
            <div ref={mobileUserMenuRef} className="relative">
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="p-1 rounded-full text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              >
                <div className="h-7 w-7 bg-blue-100 rounded-full flex items-center justify-center">
                  <User className="h-4 w-4 text-blue-600" />
                </div>
              </button>
              
              {isUserMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg py-2 z-50">
                  <div className="px-3 py-2 border-b border-gray-100">
                    <div className="font-medium text-sm">{user?.displayName || 'User'}</div>
                    <div className="text-xs text-gray-500 truncate">{user?.email}</div>
                  </div>
                  <button
                    onClick={handleSignOut}
                    className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign out
                  </button>
                </div>
              )}
            </div>
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="lg:hidden fixed inset-0 z-30 bg-black bg-opacity-50"
          onClick={closeMobileMenu}
        />
      )}

      {/* Desktop Sidebar */}
      <nav className="hidden lg:flex bg-white border-r border-gray-200 w-64 h-screen fixed left-0 top-0 overflow-y-auto flex-col">
        <div className="p-6 flex-1">
          <h1 className="text-2xl font-bold text-gray-900 mb-8">MyGTD</h1>
          
          <div className="space-y-2">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-sm font-medium',
                    isActive
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <div>
                    <div>{item.name}</div>
                    <div className="text-xs text-gray-500">{item.description}</div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
        
        {/* User Menu - Desktop */}
        <div className="p-6 border-t border-gray-200">
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors"
            >
              <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                <User className="h-4 w-4 text-blue-600" />
              </div>
              <div className="flex-1 text-left">
                <div className="font-medium">{user?.displayName || 'User'}</div>
                <div className="text-xs text-gray-500 truncate">{user?.email}</div>
              </div>
              <ChevronDown className={cn(
                "h-4 w-4 transition-transform",
                isUserMenuOpen && "rotate-180"
              )} />
            </button>
            
            {isUserMenuOpen && (
              <div className="absolute bottom-full left-0 right-0 mb-2 bg-white border border-gray-200 rounded-lg shadow-lg py-2">
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Mobile Sidebar */}
      <nav className={cn(
        "lg:hidden fixed top-0 left-0 z-40 w-64 h-full bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out",
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="p-6 pt-20">
          <div className="space-y-2">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={closeMobileMenu}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-sm font-medium',
                    isActive
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <div>
                    <div>{item.name}</div>
                    <div className="text-xs text-gray-500">{item.description}</div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </nav>
    </>
  );
} 