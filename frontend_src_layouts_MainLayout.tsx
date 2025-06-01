import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { 
  Bars3Icon, 
  XMarkIcon, 
  HomeIcon, 
  ChatBubbleLeftRightIcon, 
  DocumentTextIcon, 
  Cog6ToothIcon, 
  MoonIcon, 
  SunIcon, 
  ArrowRightOnRectangleIcon,
  UserCircleIcon
} from '@heroicons/react/24/outline';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { Transition } from '@headlessui/react';
import { cn } from '@/utils/cn';

// Logo component
const Logo: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cn("flex items-center gap-2", className)}>
    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary-600 text-white">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
        <path d="M12 2L2 7l10 5 10-5-10-5z" />
        <path d="M2 17l10 5 10-5" />
        <path d="M2 12l10 5 10-5" />
      </svg>
    </div>
    <span className="text-lg font-semibold text-neutral-900 dark:text-white">AI Assistant</span>
  </div>
);

// Navigation items
const navigationItems = [
  { name: 'Projects', href: '/projects', icon: HomeIcon },
  { name: 'Conversation', href: '/conversation', icon: ChatBubbleLeftRightIcon },
  { name: 'Specifications', href: '/specifications', icon: DocumentTextIcon },
  { name: 'Settings', href: '/settings', icon: Cog6ToothIcon },
];

// MainLayout component
const MainLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Close sidebar when location changes (mobile)
  useEffect(() => {
    setSidebarOpen(false);
  }, [location]);

  // Handle logout
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Get current page title
  const getCurrentPageTitle = () => {
    const currentPath = location.pathname;
    
    if (currentPath.startsWith('/conversation')) {
      return 'Conversation';
    } else if (currentPath.startsWith('/specification')) {
      return 'Specification';
    } else if (currentPath.startsWith('/projects')) {
      return 'Projects';
    } else if (currentPath.startsWith('/settings')) {
      return 'Settings';
    }
    
    return 'AI Assistant Platform';
  };

  return (
    <div className="flex h-screen overflow-hidden bg-neutral-50 dark:bg-neutral-900">
      {/* Mobile sidebar backdrop */}
      <Transition
        show={sidebarOpen}
        as={React.Fragment}
        enter="transition-opacity ease-linear duration-300"
        enterFrom="opacity-0"
        enterTo="opacity-100"
        leave="transition-opacity ease-linear duration-300"
        leaveFrom="opacity-100"
        leaveTo="opacity-0"
      >
        <div 
          className="fixed inset-0 z-40 bg-neutral-900/50 lg:hidden" 
          aria-hidden="true"
          onClick={() => setSidebarOpen(false)}
        />
      </Transition>

      {/* Sidebar */}
      <Transition
        show={sidebarOpen}
        as={React.Fragment}
        enter="transition ease-in-out duration-300 transform"
        enterFrom="-translate-x-full"
        enterTo="translate-x-0"
        leave="transition ease-in-out duration-300 transform"
        leaveFrom="translate-x-0"
        leaveTo="-translate-x-full"
      >
        <aside className="fixed inset-y-0 left-0 z-50 w-64 flex-shrink-0 overflow-y-auto border-r border-neutral-200 bg-white dark:border-neutral-700 dark:bg-neutral-800 lg:static lg:z-auto">
          <div className="flex h-full flex-col">
            {/* Sidebar header */}
            <div className="flex h-16 items-center justify-between px-4 py-3">
              <Logo />
              <button
                type="button"
                className="rounded-md p-2 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-700 dark:hover:text-neutral-50 lg:hidden"
                onClick={() => setSidebarOpen(false)}
                aria-label="Close sidebar"
              >
                <XMarkIcon className="h-6 w-6" aria-hidden="true" />
              </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 space-y-1 px-2 py-4">
              {navigationItems.map((item) => {
                const isActive = location.pathname.startsWith(item.href);
                return (
                  <NavLink
                    key={item.name}
                    to={item.href}
                    className={({ isActive }) => cn(
                      "group flex items-center rounded-md px-3 py-2 text-sm font-medium",
                      isActive 
                        ? "bg-primary-50 text-primary-600 dark:bg-primary-900/20 dark:text-primary-400" 
                        : "text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-700 dark:hover:text-neutral-100"
                    )}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    <item.icon 
                      className={cn(
                        "mr-3 h-5 w-5 flex-shrink-0",
                        isActive 
                          ? "text-primary-500 dark:text-primary-400" 
                          : "text-neutral-500 group-hover:text-neutral-700 dark:text-neutral-400 dark:group-hover:text-neutral-300"
                      )} 
                      aria-hidden="true" 
                    />
                    {item.name}
                  </NavLink>
                );
              })}
            </nav>

            {/* Sidebar footer */}
            <div className="border-t border-neutral-200 p-4 dark:border-neutral-700">
              <button
                type="button"
                className="flex w-full items-center justify-between rounded-md px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-700 dark:hover:text-neutral-100"
                onClick={toggleTheme}
                aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                <span className="flex items-center">
                  {theme === 'dark' ? (
                    <SunIcon className="mr-3 h-5 w-5 text-neutral-400" aria-hidden="true" />
                  ) : (
                    <MoonIcon className="mr-3 h-5 w-5 text-neutral-400" aria-hidden="true" />
                  )}
                  {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                </span>
              </button>
            </div>
          </div>
        </aside>
      </Transition>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className="border-b border-neutral-200 bg-white dark:border-neutral-700 dark:bg-neutral-800">
          <div className="flex h-16 items-center justify-between px-4">
            <div className="flex items-center">
              {/* Mobile menu button */}
              <button
                type="button"
                className="rounded-md p-2 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-700 dark:hover:text-neutral-50 lg:hidden"
                onClick={() => setSidebarOpen(true)}
                aria-label="Open sidebar"
              >
                <Bars3Icon className="h-6 w-6" aria-hidden="true" />
              </button>
              {/* Page title - visible on desktop */}
              <h1 className="ml-2 hidden text-lg font-semibold text-neutral-900 dark:text-white md:block">
                {getCurrentPageTitle()}
              </h1>
            </div>

            {/* User menu */}
            <div className="flex items-center space-x-4">
              <div className="relative">
                <div className="flex items-center space-x-3">
                  <div className="flex flex-col items-end">
                    <span className="text-sm font-medium text-neutral-900 dark:text-white">
                      {user?.name || 'User'}
                    </span>
                    <span className="text-xs text-neutral-500 dark:text-neutral-400">
                      {user?.email || 'user@example.com'}
                    </span>
                  </div>
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-200 text-neutral-700 dark:bg-neutral-700 dark:text-neutral-200">
                    <UserCircleIcon className="h-6 w-6" aria-hidden="true" />
                  </div>
                </div>
              </div>

              {/* Logout button */}
              <button
                type="button"
                className="rounded-md p-2 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-700 dark:hover:text-neutral-50"
                onClick={handleLogout}
                aria-label="Logout"
              >
                <ArrowRightOnRectangleIcon className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
          </div>
        </header>

        {/* Main content area */}
        <main className="flex-1 overflow-auto bg-neutral-50 dark:bg-neutral-900">
          <div className="mx-auto h-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
