import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'react-hot-toast';
import {
  UserCircleIcon,
  PaintBrushIcon,
  KeyIcon,
  BellIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
} from '@heroicons/react/24/outline';

import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Spinner from '@/components/ui/Spinner';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/utils/cn';

// --- Schemas for form validation ---

// Profile Settings Schema
const profileSchema = z.object({
  fullName: z.string().min(1, 'Full name is required').max(100, 'Full name cannot exceed 100 characters'),
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
  avatarUrl: z.string().url('Invalid URL').optional().or(z.literal('')),
});
type ProfileFormData = z.infer<typeof profileSchema>;

// API Keys Schema
const apiKeysSchema = z.object({
  openaiApiKey: z.string().optional(),
  githubToken: z.string().optional(),
  // Add more API keys as needed
});
type ApiKeysFormData = z.infer<typeof apiKeysSchema>;

// Notification Settings Schema
const notificationSchema = z.object({
  emailNotifications: z.boolean().default(true),
  inAppNotifications: z.boolean().default(true),
  projectUpdates: z.boolean().default(true),
  deadlineReminders: z.boolean().default(true),
  codeGenerationStatus: z.boolean().default(true),
  // Add more notification types as needed
});
type NotificationFormData = z.infer<typeof notificationSchema>;

// --- Settings Page Component ---

const SettingsPage: React.FC = () => {
  const { user, isLoading: isLoadingAuth, checkAuth } = useAuth();
  const { theme, setTheme } = useTheme();

  const [activeTab, setActiveTab] = useState<'profile' | 'appearance' | 'api-keys' | 'notifications'>('profile');

  // --- Profile Settings Form ---
  const {
    register: registerProfile,
    handleSubmit: handleProfileSubmit,
    reset: resetProfile,
    formState: { errors: profileErrors, isSubmitting: isSubmittingProfile, isDirty: isProfileDirty },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: user?.name || '',
      email: user?.email || '',
      avatarUrl: user?.avatar || '',
    },
  });

  useEffect(() => {
    if (user) {
      resetProfile({
        fullName: user.name || '',
        email: user.email || '',
        avatarUrl: user.avatar || '',
      });
    }
  }, [user, resetProfile]);

  const onSaveProfile = async (data: ProfileFormData) => {
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));
      // In a real app: await userService.updateProfile(user.id, data);
      toast.success('Profile updated successfully!');
      // Re-fetch user data or update context if necessary
      await checkAuth();
      resetProfile(data); // Reset form to clean state
    } catch (error: any) {
      toast.error(`Failed to update profile: ${error.message || 'Unknown error'}`);
    }
  };

  // --- Appearance Settings ---
  const onSaveAppearance = async (newTheme: 'light' | 'dark') => {
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500));
      setTheme(newTheme);
      toast.success('Appearance updated!');
    } catch (error: any) {
      toast.error(`Failed to update appearance: ${error.message || 'Unknown error'}`);
    }
  };

  // --- API Keys Form ---
  const {
    register: registerApiKeys,
    handleSubmit: handleApiKeysSubmit,
    reset: resetApiKeys,
    formState: { errors: apiKeysErrors, isSubmitting: isSubmittingApiKeys, isDirty: isApiKeysDirty },
  } = useForm<ApiKeysFormData>({
    resolver: zodResolver(apiKeysSchema),
    defaultValues: {
      openaiApiKey: '', // These would typically be fetched securely or not displayed at all
      githubToken: '',
    },
  });

  const onSaveApiKeys = async (data: ApiKeysFormData) => {
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));
      // In a real app, send these to a secure backend service
      toast.success('API Keys updated securely!');
      resetApiKeys(data); // Reset form to clean state
    } catch (error: any) {
      toast.error(`Failed to update API keys: ${error.message || 'Unknown error'}`);
    }
  };

  // --- Notification Settings Form ---
  const {
    register: registerNotifications,
    handleSubmit: handleNotificationsSubmit,
    reset: resetNotifications,
    formState: { errors: notificationErrors, isSubmitting: isSubmittingNotifications, isDirty: isNotificationsDirty },
  } = useForm<NotificationFormData>({
    resolver: zodResolver(notificationSchema),
    defaultValues: {
      emailNotifications: true,
      inAppNotifications: true,
      projectUpdates: true,
      deadlineReminders: true,
      codeGenerationStatus: true,
    },
  });

  const onSaveNotifications = async (data: NotificationFormData) => {
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));
      // In a real app: await userService.updateNotificationSettings(user.id, data);
      toast.success('Notification settings updated!');
      resetNotifications(data); // Reset form to clean state
    } catch (error: any) {
      toast.error(`Failed to update notification settings: ${error.message || 'Unknown error'}`);
    }
  };

  // --- Tab Navigation ---
  const tabs = [
    { id: 'profile', label: 'Profile', icon: UserCircleIcon },
    { id: 'appearance', label: 'Appearance', icon: PaintBrushIcon },
    { id: 'api-keys', label: 'API Keys', icon: KeyIcon },
    { id: 'notifications', label: 'Notifications', icon: BellIcon },
  ];

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Settings</h1>
        <p className="text-neutral-600 dark:text-neutral-400 mt-1">
          Manage your account settings and preferences
        </p>
      </div>

      {/* Settings Layout */}
      <div className="flex flex-col md:flex-row gap-6">
        {/* Sidebar / Tabs */}
        <div className="md:w-64 flex-shrink-0">
          <Card className="sticky top-6">
            <Card.Body className="p-0">
              <nav className="flex flex-col">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    className={cn(
                      'flex items-center px-4 py-3 text-sm font-medium border-l-2 transition-colors',
                      activeTab === tab.id
                        ? 'border-l-primary-500 text-primary-600 bg-primary-50 dark:bg-primary-900/20 dark:text-primary-400'
                        : 'border-l-transparent text-neutral-700 hover:bg-neutral-50 dark:text-neutral-300 dark:hover:bg-neutral-800'
                    )}
                    onClick={() => setActiveTab(tab.id as any)}
                  >
                    <tab.icon className="w-5 h-5 mr-3" />
                    {tab.label}
                  </button>
                ))}
              </nav>
            </Card.Body>
          </Card>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          {/* Profile Settings */}
          {activeTab === 'profile' && (
            <Card>
              <Card.Header>
                <h2 className="text-xl font-semibold text-neutral-900 dark:text-white flex items-center">
                  <UserCircleIcon className="w-6 h-6 mr-2 text-primary-500" />
                  Profile Settings
                </h2>
              </Card.Header>
              <Card.Body>
                {isLoadingAuth ? (
                  <div className="flex justify-center py-8">
                    <Spinner size="lg" />
                  </div>
                ) : (
                  <form onSubmit={handleProfileSubmit(onSaveProfile)} className="space-y-6">
                    {/* Full Name */}
                    <div>
                      <label htmlFor="fullName" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                        Full Name
                      </label>
                      <input
                        id="fullName"
                        type="text"
                        className={`w-full rounded-md border ${
                          profileErrors.fullName ? 'border-error-300 dark:border-error-700' : 'border-neutral-300 dark:border-neutral-600'
                        } bg-white dark:bg-neutral-700 px-3 py-2 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-500 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 disabled:opacity-75`}
                        placeholder="Your full name"
                        {...registerProfile('fullName')}
                        aria-invalid={!!profileErrors.fullName}
                      />
                      {profileErrors.fullName && (
                        <p className="mt-1 text-sm text-error-600 dark:text-error-400">
                          {profileErrors.fullName.message}
                        </p>
                      )}
                    </div>

                    {/* Email */}
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                        Email Address
                      </label>
                      <input
                        id="email"
                        type="email"
                        className={`w-full rounded-md border ${
                          profileErrors.email ? 'border-error-300 dark:border-error-700' : 'border-neutral-300 dark:border-neutral-600'
                        } bg-white dark:bg-neutral-700 px-3 py-2 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-500 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 disabled:opacity-75`}
                        placeholder="your.email@example.com"
                        {...registerProfile('email')}
                        aria-invalid={!!profileErrors.email}
                      />
                      {profileErrors.email && (
                        <p className="mt-1 text-sm text-error-600 dark:text-error-400">
                          {profileErrors.email.message}
                        </p>
                      )}
                      <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                        This email is used for notifications and account recovery.
                      </p>
                    </div>

                    {/* Avatar URL */}
                    <div>
                      <label htmlFor="avatarUrl" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                        Avatar URL (optional)
                      </label>
                      <div className="flex gap-4 items-start">
                        <div className="flex-1">
                          <input
                            id="avatarUrl"
                            type="text"
                            className={`w-full rounded-md border ${
                              profileErrors.avatarUrl ? 'border-error-300 dark:border-error-700' : 'border-neutral-300 dark:border-neutral-600'
                            } bg-white dark:bg-neutral-700 px-3 py-2 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-500 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 disabled:opacity-75`}
                            placeholder="https://example.com/avatar.jpg"
                            {...registerProfile('avatarUrl')}
                            aria-invalid={!!profileErrors.avatarUrl}
                          />
                          {profileErrors.avatarUrl && (
                            <p className="mt-1 text-sm text-error-600 dark:text-error-400">
                              {profileErrors.avatarUrl.message}
                            </p>
                          )}
                        </div>
                        <div className="flex-shrink-0">
                          <div className="h-16 w-16 rounded-full overflow-hidden bg-neutral-200 dark:bg-neutral-700 border border-neutral-300 dark:border-neutral-600">
                            {user?.avatar ? (
                              <img
                                src={user.avatar}
                                alt={user.name || 'User avatar'}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="h-full w-full flex items-center justify-center text-neutral-500 dark:text-neutral-400">
                                <UserCircleIcon className="h-12 w-12" />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Submit Button */}
                    <div className="flex justify-end">
                      <Button
                        type="submit"
                        variant="primary"
                        isLoading={isSubmittingProfile}
                        loadingText="Saving..."
                        disabled={isSubmittingProfile || !isProfileDirty}
                      >
                        Save Profile
                      </Button>
                    </div>
                  </form>
                )}
              </Card.Body>
            </Card>
          )}

          {/* Appearance Settings */}
          {activeTab === 'appearance' && (
            <Card>
              <Card.Header>
                <h2 className="text-xl font-semibold text-neutral-900 dark:text-white flex items-center">
                  <PaintBrushIcon className="w-6 h-6 mr-2 text-primary-500" />
                  Appearance Settings
                </h2>
              </Card.Header>
              <Card.Body>
                <div className="space-y-6">
                  {/* Theme Selection */}
                  <div>
                    <h3 className="text-base font-medium text-neutral-900 dark:text-neutral-100 mb-3">
                      Theme
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Light Theme Option */}
                      <div
                        className={cn(
                          'border rounded-lg p-4 cursor-pointer transition-all',
                          theme === 'light'
                            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                            : 'border-neutral-300 dark:border-neutral-600 hover:border-primary-300 dark:hover:border-primary-700'
                        )}
                        onClick={() => onSaveAppearance('light')}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center">
                            <div className="w-5 h-5 rounded-full border-2 border-neutral-300 dark:border-neutral-600 flex items-center justify-center mr-2">
                              {theme === 'light' && (
                                <div className="w-3 h-3 rounded-full bg-primary-500" />
                              )}
                            </div>
                            <span className="font-medium text-neutral-900 dark:text-neutral-100">Light</span>
                          </div>
                          <svg
                            className="w-6 h-6 text-neutral-900"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <circle cx="12" cy="12" r="5" fill="currentColor" />
                            <line x1="12" y1="1" x2="12" y2="3" stroke="currentColor" strokeWidth="2" />
                            <line x1="12" y1="21" x2="12" y2="23" stroke="currentColor" strokeWidth="2" />
                            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" stroke="currentColor" strokeWidth="2" />
                            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" stroke="currentColor" strokeWidth="2" />
                            <line x1="1" y1="12" x2="3" y2="12" stroke="currentColor" strokeWidth="2" />
                            <line x1="21" y1="12" x2="23" y2="12" stroke="currentColor" strokeWidth="2" />
                            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" stroke="currentColor" strokeWidth="2" />
                            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" stroke="currentColor" strokeWidth="2" />
                          </svg>
                        </div>
                        <div className="bg-white border border-neutral-200 rounded p-3 flex flex-col h-24">
                          <div className="h-3 w-24 bg-neutral-800 rounded mb-2"></div>
                          <div className="h-2 w-32 bg-neutral-300 rounded mb-2"></div>
                          <div className="h-2 w-20 bg-neutral-300 rounded"></div>
                          <div className="mt-auto flex justify-end">
                            <div className="h-6 w-16 bg-primary-500 rounded"></div>
                          </div>
                        </div>
                      </div>

                      {/* Dark Theme Option */}
                      <div
                        className={cn(
                          'border rounded-lg p-4 cursor-pointer transition-all',
                          theme === 'dark'
                            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                            : 'border-neutral-300 dark:border-neutral-600 hover:border-primary-300 dark:hover:border-primary-700'
                        )}
                        onClick={() => onSaveAppearance('dark')}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center">
                            <div className="w-5 h-5 rounded-full border-2 border-neutral-300 dark:border-neutral-600 flex items-center justify-center mr-2">
                              {theme === 'dark' && (
                                <div className="w-3 h-3 rounded-full bg-primary-500" />
                              )}
                            </div>
                            <span className="font-medium text-neutral-900 dark:text-neutral-100">Dark</span>
                          </div>
                          <svg
                            className="w-6 h-6 text-neutral-900 dark:text-neutral-100"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                            />
                          </svg>
                        </div>
                        <div className="bg-neutral-800 border border-neutral-700 rounded p-3 flex flex-col h-24">
                          <div className="h-3 w-24 bg-white rounded mb-2"></div>
                          <div className="h-2 w-32 bg-neutral-600 rounded mb-2"></div>
                          <div className="h-2 w-20 bg-neutral-600 rounded"></div>
                          <div className="mt-auto flex justify-end">
                            <div className="h-6 w-16 bg-primary-500 rounded"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <p className="mt-3 text-sm text-neutral-600 dark:text-neutral-400">
                      Choose the theme that works best for your environment. Your preference will be saved for future sessions.
                    </p>
                  </div>

                  {/* Future Appearance Options */}
                  <div className="border-t border-neutral-200 dark:border-neutral-700 pt-6">
                    <h3 className="text-base font-medium text-neutral-900 dark:text-neutral-100 mb-3">
                      Additional Options
                    </h3>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">
                      More appearance options will be available in future updates, including custom color themes and font sizes.
                    </p>
                  </div>
                </div>
              </Card.Body>
            </Card>
          )}

          {/* API Keys Settings */}
          {activeTab === 'api-keys' && (
            <Card>
              <Card.Header>
                <h2 className="text-xl font-semibold text-neutral-900 dark:text-white flex items-center">
                  <KeyIcon className="w-6 h-6 mr-2 text-primary-500" />
                  API Keys
                </h2>
              </Card.Header>
              <Card.Body>
                <div className="mb-4 p-4 bg-warning-50 dark:bg-warning-900/20 border border-warning-200 dark:border-warning-800 rounded-md">
                  <h3 className="text-sm font-medium text-warning-800 dark:text-warning-400 mb-1">
                    Security Notice
                  </h3>
                  <p className="text-sm text-warning-700 dark:text-warning-500">
                    API keys are sensitive credentials. For security, keys are stored securely on the server and never exposed in the frontend.
                    When you save a key, only a hashed version is stored.
                  </p>
                </div>

                <form onSubmit={handleApiKeysSubmit(onSaveApiKeys)} className="space-y-6">
                  {/* OpenAI API Key */}
                  <div>
                    <label htmlFor="openaiApiKey" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                      OpenAI API Key
                    </label>
                    <input
                      id="openaiApiKey"
                      type="password"
                      className={`w-full rounded-md border ${
                        apiKeysErrors.openaiApiKey ? 'border-error-300 dark:border-error-700' : 'border-neutral-300 dark:border-neutral-600'
                      } bg-white dark:bg-neutral-700 px-3 py-2 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-500 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 disabled:opacity-75`}
                      placeholder="sk-..."
                      {...registerApiKeys('openaiApiKey')}
                      aria-invalid={!!apiKeysErrors.openaiApiKey}
                    />
                    {apiKeysErrors.openaiApiKey && (
                      <p className="mt-1 text-sm text-error-600 dark:text-error-400">
                        {apiKeysErrors.openaiApiKey.message}
                      </p>
                    )}
                    <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                      Used for AI-powered features. Get your API key from <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-primary-600 dark:text-primary-400 hover:underline">OpenAI</a>.
                    </p>
                  </div>

                  {/* GitHub Token */}
                  <div>
                    <label htmlFor="githubToken" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                      GitHub Personal Access Token
                    </label>
                    <input
                      id="githubToken"
                      type="password"
                      className={`w-full rounded-md border ${
                        apiKeysErrors.githubToken ? 'border-error-300 dark:border-error-700' : 'border-neutral-300 dark:border-neutral-600'
                      } bg-white dark:bg-neutral-700 px-3 py-2 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-500 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 disabled:opacity-75`}
                      placeholder="ghp_..."
                      {...registerApiKeys('githubToken')}
                      aria-invalid={!!apiKeysErrors.githubToken}
                    />
                    {apiKeysErrors.githubToken && (
                      <p className="mt-1 text-sm text-error-600 dark:text-error-400">
                        {apiKeysErrors.githubToken.message}
                      </p>
                    )}
                    <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                      Required for GitHub integration. Create a token with 'repo' scope from <a href="https://github.com/settings/tokens" target="_blank" rel="noopener noreferrer" className="text-primary-600 dark:text-primary-400 hover:underline">GitHub</a>.
                    </p>
                  </div>

                  {/* Submit Button */}
                  <div className="flex justify-end">
                    <Button
                      type="submit"
                      variant="primary"
                      isLoading={isSubmittingApiKeys}
                      loadingText="Saving..."
                      disabled={isSubmittingApiKeys || !isApiKeysDirty}
                    >
                      Save API Keys
                    </Button>
                  </div>
                </form>
              </Card.Body>
            </Card>
          )}

          {/* Notification Settings */}
          {activeTab === 'notifications' && (
            <Card>
              <Card.Header>
                <h2 className="text-xl font-semibold text-neutral-900 dark:text-white flex items-center">
                  <BellIcon className="w-6 h-6 mr-2 text-primary-500" />
                  Notification Settings
                </h2>
              </Card.Header>
              <Card.Body>
                <form onSubmit={handleNotificationsSubmit(onSaveNotifications)} className="space-y-6">
                  {/* Notification Channels */}
                  <div>
                    <h3 className="text-base font-medium text-neutral-900 dark:text-neutral-100 mb-3">
                      Notification Channels
                    </h3>
                    <div className="space-y-3">
                      <div className="flex items-start">
                        <div className="flex items-center h-5">
                          <input
                            id="emailNotifications"
                            type="checkbox"
                            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-neutral-300 rounded dark:border-neutral-600 dark:bg-neutral-800"
                            {...registerNotifications('emailNotifications')}
                          />
                        </div>
                        <div className="ml-3 text-sm">
                          <label htmlFor="emailNotifications" className="font-medium text-neutral-700 dark:text-neutral-300">
                            Email Notifications
                          </label>
                          <p className="text-neutral-500 dark:text-neutral-400">
                            Receive notifications via email
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start">
                        <div className="flex items-center h-5">
                          <input
                            id="inAppNotifications"
                            type="checkbox"
                            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-neutral-300 rounded dark:border-neutral-600 dark:bg-neutral-800"
                            {...registerNotifications('inAppNotifications')}
                          />
                        </div>
                        <div className="ml-3 text-sm">
                          <label htmlFor="inAppNotifications" className="font-medium text-neutral-700 dark:text-neutral-300">
                            In-App Notifications
                          </label>
                          <p className="text-neutral-500 dark:text-neutral-400">
                            Receive notifications within the application
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Notification Types */}
                  <div className="border-t border-neutral-200 dark:border-neutral-700 pt-6">
                    <h3 className="text-base font-medium text-neutral-900 dark:text-neutral-100 mb-3">
                      Notification Types
                    </h3>
                    <div className="space-y-3">
                      <div className="flex items-start">
                        <div className="flex items-center h-5">
                          <input
                            id="projectUpdates"
                            type="checkbox"
                            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-neutral-300 rounded dark:border-neutral-600 dark:bg-neutral-800"
                            {...registerNotifications('projectUpdates')}
                          />
                        </div>
                        <div className="ml-3 text-sm">
                          <label htmlFor="projectUpdates" className="font-medium text-neutral-700 dark:text-neutral-300">
                            Project Updates
                          </label>
                          <p className="text-neutral-500 dark:text-neutral-400">
                            Notifications about changes to your projects
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start">
                        <div className="flex items-center h-5">
                          <input
                            id="deadlineReminders"
                            type="checkbox"
                            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-neutral-300 rounded dark:border-neutral-600 dark:bg-neutral-800"
                            {...registerNotifications('deadlineReminders')}
                          />
                        </div>
                        <div className="ml-3 text-sm">
                          <label htmlFor="deadlineReminders" className="font-medium text-neutral-700 dark:text-neutral-300">
                            Deadline Reminders
                          </label>
                          <p className="text-neutral-500 dark:text-neutral-400">
                            Reminders about upcoming project deadlines
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start">
                        <div className="flex items-center h-5">
                          <input
                            id="codeGenerationStatus"
                            type="checkbox"
                            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-neutral-300 rounded dark:border-neutral-600 dark:bg-neutral-800"
                            {...registerNotifications('codeGenerationStatus')}
                          />
                        </div>
                        <div className="ml-3 text-sm">
                          <label htmlFor="codeGenerationStatus" className="font-medium text-neutral-700 dark:text-neutral-300">
                            Code Generation Status
                          </label>
                          <p className="text-neutral-500 dark:text-neutral-400">
                            Updates about code generation progress and completion
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="flex justify-end">
                    <Button
                      type="submit"
                      variant="primary"
                      isLoading={isSubmittingNotifications}
                      loadingText="Saving..."
                      disabled={isSubmittingNotifications || !isNotificationsDirty}
                    >
                      Save Notification Settings
                    </Button>
                  </div>
                </form>
              </Card.Body>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
