import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth, LoginCredentials } from '@/contexts/AuthContext';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { ExclamationCircleIcon, LockClosedIcon, EnvelopeIcon } from '@heroicons/react/24/outline';
import { cn } from '@/utils/cn';

// Form validation schema
const loginSchema = z.object({
  email: z.string()
    .min(1, 'Email is required')
    .email('Invalid email address'),
  password: z.string()
    .min(1, 'Password is required')
    .min(6, 'Password must be at least 6 characters long'), // Adjusted based on typical requirements
  rememberMe: z.boolean().optional(),
});

type LoginFormData = z.infer<typeof loginSchema>;

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, isAuthenticated, isLoading: authLoading, error: authContextError, clearError } = useAuth();
  const [pageError, setPageError] = useState<string | null>(null);

  // Form handling with React Hook Form
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting: formIsSubmitting },
    reset,
    watch
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
  });

  // Sync authContextError to pageError
  useEffect(() => {
    setPageError(authContextError);
  }, [authContextError]);

  // Clear pageError and authContextError when form is modified
  const watchedFields = watch(); // Watch all fields
  useEffect(() => {
    if (pageError) {
      setPageError(null);
      clearError();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchedFields.email, watchedFields.password, pageError, clearError]);


  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/projects', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // Handle form submission
  const onSubmit = async (data: LoginFormData) => {
    try {
      await login({
        email: data.email,
        password: data.password,
      });
      // Successful login will trigger redirect via the isAuthenticated effect
      // No need to reset form here as user will be redirected
    } catch (error) {
      // Error is already set in AuthContext and synced to pageError
      // Reset password field for security
      reset({ ...data, password: '' });
    }
  };
  
  const isLoading = formIsSubmitting || authLoading;

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-900 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        {/* Logo and title */}
        <div className="text-center mb-8">
          <div className="flex justify-center">
            <div className="h-12 w-12 rounded-md bg-primary-600 text-white flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8">
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
            </div>
          </div>
          <h2 className="mt-6 text-3xl font-bold text-neutral-900 dark:text-white">
            Sign in to your account
          </h2>
          <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
            Or{' '}
            <Link to="/register" className="font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300">
              create a new account
            </Link>
          </p>
        </div>

        {/* Login form */}
        <Card variant="elevated" className="px-6 py-8 sm:px-8 sm:py-10">
          {/* Error message */}
          {pageError && (
            <div className="mb-4 p-3 bg-error-50 text-error-700 dark:bg-error-900/30 dark:text-error-400 rounded-md flex items-start">
              <ExclamationCircleIcon className="h-5 w-5 flex-shrink-0 mr-2 mt-0.5" />
              <span>{pageError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Email field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Email address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <EnvelopeIcon className="h-5 w-5 text-neutral-400 dark:text-neutral-500" aria-hidden="true" />
                </div>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  className={cn(
                    'block w-full pl-10 pr-3 py-2 border rounded-md shadow-sm placeholder-neutral-400 dark:placeholder-neutral-500 focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-neutral-800 dark:text-white sm:text-sm',
                    errors.email ? 'border-error-300 dark:border-error-600' : 'border-neutral-300 dark:border-neutral-600'
                  )}
                  placeholder="you@example.com"
                  {...register('email')}
                  aria-invalid={errors.email ? 'true' : 'false'}
                  aria-describedby={errors.email ? 'email-error' : undefined}
                  disabled={isLoading}
                />
                {errors.email && (
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <ExclamationCircleIcon className="h-5 w-5 text-error-500" aria-hidden="true" />
                  </div>
                )}
              </div>
              {errors.email && (
                <p className="mt-2 text-sm text-error-600 dark:text-error-400" id="email-error">
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Password field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <LockClosedIcon className="h-5 w-5 text-neutral-400 dark:text-neutral-500" aria-hidden="true" />
                </div>
                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  className={cn(
                    'block w-full pl-10 pr-3 py-2 border rounded-md shadow-sm placeholder-neutral-400 dark:placeholder-neutral-500 focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-neutral-800 dark:text-white sm:text-sm',
                    errors.password ? 'border-error-300 dark:border-error-600' : 'border-neutral-300 dark:border-neutral-600'
                  )}
                  placeholder="••••••••"
                  {...register('password')}
                  aria-invalid={errors.password ? 'true' : 'false'}
                  aria-describedby={errors.password ? 'password-error' : undefined}
                  disabled={isLoading}
                />
                {errors.password && (
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <ExclamationCircleIcon className="h-5 w-5 text-error-500" aria-hidden="true" />
                  </div>
                )}
              </div>
              {errors.password && (
                <p className="mt-2 text-sm text-error-600 dark:text-error-400" id="password-error">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Remember me checkbox and Forgot password link */}
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-neutral-300 rounded dark:border-neutral-600 dark:bg-neutral-800"
                  {...register('rememberMe')}
                  disabled={isLoading}
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-neutral-700 dark:text-neutral-300">
                  Remember me
                </label>
              </div>

              <div className="text-sm">
                <Link to="/forgot-password" className="font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300">
                  Forgot your password?
                </Link>
              </div>
            </div>

            {/* Submit button */}
            <div>
              <Button
                type="submit"
                variant="primary"
                fullWidth
                isLoading={isLoading}
                loadingText="Signing in..."
                disabled={isLoading}
              >
                Sign in
              </Button>
            </div>
          </form>

          {/* Demo account info */}
          <div className="mt-6 border-t border-neutral-200 dark:border-neutral-700 pt-4">
            <p className="text-sm text-neutral-600 dark:text-neutral-400 text-center">
              Demo account: <span className="font-medium">demo@example.com</span> / <span className="font-medium">password</span>
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default LoginPage;
