import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/contexts/AuthContext';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { 
  ExclamationCircleIcon, 
  LockClosedIcon, 
  EnvelopeIcon,
  UserIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

// Form validation schema
const registerSchema = z.object({
  name: z.string()
    .min(1, 'Full name is required')
    .min(2, 'Name must be at least 2 characters'),
  email: z.string()
    .min(1, 'Email is required')
    .email('Invalid email address'),
  password: z.string()
    .min(1, 'Password is required')
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  confirmPassword: z.string()
    .min(1, 'Please confirm your password'),
  acceptTerms: z.boolean()
    .refine(val => val === true, {
      message: 'You must accept the terms and conditions',
    }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type RegisterFormData = z.infer<typeof registerSchema>;

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { register: registerUser, isAuthenticated, isLoading, error } = useAuth();
  const [authError, setAuthError] = useState<string | null>(error);
  const [registrationSuccess, setRegistrationSuccess] = useState<boolean>(false);

  // Form handling with React Hook Form
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    watch,
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      acceptTerms: false,
    },
  });

  // Clear auth error when form is modified
  useEffect(() => {
    if (authError) {
      const subscription = register('email').onChange(() => {
        setAuthError(null);
      });
      return () => subscription.unsubscribe?.();
    }
  }, [authError, register]);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/projects');
    }
  }, [isAuthenticated, navigate]);

  // Handle form submission
  const onSubmit = async (data: RegisterFormData) => {
    try {
      setAuthError(null);
      // In a real app, we would call the registration API
      // await registerUser({
      //   name: data.name,
      //   email: data.email,
      //   password: data.password,
      // });

      // For now, simulate a successful registration
      setRegistrationSuccess(true);
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'Registration failed. Please try again.');
      reset({ ...data, password: '', confirmPassword: '' });
    }
  };

  // Password value for comparison
  const password = watch('password');

  // If registration was successful, show success message
  if (registrationSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-900 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-success-100 dark:bg-success-900/30 mb-6">
            <CheckCircleIcon className="h-10 w-10 text-success-600 dark:text-success-400" />
          </div>
          <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-2">
            Registration Successful!
          </h2>
          <p className="text-neutral-600 dark:text-neutral-400 mb-6">
            Your account has been created. You will be redirected to the login page shortly.
          </p>
          <Button
            variant="primary"
            onClick={() => navigate('/login')}
          >
            Go to Login
          </Button>
        </div>
      </div>
    );
  }

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
            Create a new account
          </h2>
          <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
            Or{' '}
            <Link to="/login" className="font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300">
              sign in to your existing account
            </Link>
          </p>
        </div>

        {/* Registration form */}
        <Card variant="elevated" className="px-6 py-8 sm:px-8 sm:py-10">
          {/* Error message */}
          {authError && (
            <div className="mb-4 p-3 bg-error-50 text-error-700 dark:bg-error-900/30 dark:text-error-400 rounded-md flex items-start">
              <ExclamationCircleIcon className="h-5 w-5 flex-shrink-0 mr-2 mt-0.5" />
              <span>{authError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Full Name field */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Full Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <UserIcon className="h-5 w-5 text-neutral-400" aria-hidden="true" />
                </div>
                <input
                  id="name"
                  type="text"
                  autoComplete="name"
                  className={`block w-full pl-10 pr-3 py-2 border ${
                    errors.name ? 'border-error-300 dark:border-error-700' : 'border-neutral-300 dark:border-neutral-600'
                  } rounded-md shadow-sm placeholder-neutral-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-neutral-800 dark:text-white sm:text-sm`}
                  placeholder="John Doe"
                  {...register('name')}
                  aria-invalid={errors.name ? 'true' : 'false'}
                  aria-describedby={errors.name ? 'name-error' : undefined}
                />
                {errors.name && (
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <ExclamationCircleIcon className="h-5 w-5 text-error-500" aria-hidden="true" />
                  </div>
                )}
              </div>
              {errors.name && (
                <p className="mt-2 text-sm text-error-600 dark:text-error-400" id="name-error">
                  {errors.name.message}
                </p>
              )}
            </div>

            {/* Email field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Email address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <EnvelopeIcon className="h-5 w-5 text-neutral-400" aria-hidden="true" />
                </div>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  className={`block w-full pl-10 pr-3 py-2 border ${
                    errors.email ? 'border-error-300 dark:border-error-700' : 'border-neutral-300 dark:border-neutral-600'
                  } rounded-md shadow-sm placeholder-neutral-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-neutral-800 dark:text-white sm:text-sm`}
                  placeholder="you@example.com"
                  {...register('email')}
                  aria-invalid={errors.email ? 'true' : 'false'}
                  aria-describedby={errors.email ? 'email-error' : undefined}
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
                  <LockClosedIcon className="h-5 w-5 text-neutral-400" aria-hidden="true" />
                </div>
                <input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  className={`block w-full pl-10 pr-3 py-2 border ${
                    errors.password ? 'border-error-300 dark:border-error-700' : 'border-neutral-300 dark:border-neutral-600'
                  } rounded-md shadow-sm placeholder-neutral-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-neutral-800 dark:text-white sm:text-sm`}
                  placeholder="••••••••"
                  {...register('password')}
                  aria-invalid={errors.password ? 'true' : 'false'}
                  aria-describedby={errors.password ? 'password-error' : undefined}
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

            {/* Confirm Password field */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Confirm Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <LockClosedIcon className="h-5 w-5 text-neutral-400" aria-hidden="true" />
                </div>
                <input
                  id="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  className={`block w-full pl-10 pr-3 py-2 border ${
                    errors.confirmPassword ? 'border-error-300 dark:border-error-700' : 'border-neutral-300 dark:border-neutral-600'
                  } rounded-md shadow-sm placeholder-neutral-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-neutral-800 dark:text-white sm:text-sm`}
                  placeholder="••••••••"
                  {...register('confirmPassword')}
                  aria-invalid={errors.confirmPassword ? 'true' : 'false'}
                  aria-describedby={errors.confirmPassword ? 'confirm-password-error' : undefined}
                />
                {errors.confirmPassword && (
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <ExclamationCircleIcon className="h-5 w-5 text-error-500" aria-hidden="true" />
                  </div>
                )}
              </div>
              {errors.confirmPassword && (
                <p className="mt-2 text-sm text-error-600 dark:text-error-400" id="confirm-password-error">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>

            {/* Terms and conditions */}
            <div className="flex items-start">
              <div className="flex items-center h-5">
                <input
                  id="acceptTerms"
                  type="checkbox"
                  className={`h-4 w-4 text-primary-600 focus:ring-primary-500 border-neutral-300 rounded dark:border-neutral-600 dark:bg-neutral-800 ${
                    errors.acceptTerms ? 'border-error-300 dark:border-error-700' : ''
                  }`}
                  {...register('acceptTerms')}
                  aria-invalid={errors.acceptTerms ? 'true' : 'false'}
                  aria-describedby={errors.acceptTerms ? 'terms-error' : undefined}
                />
              </div>
              <div className="ml-3 text-sm">
                <label htmlFor="acceptTerms" className="font-medium text-neutral-700 dark:text-neutral-300">
                  I accept the <a href="/terms" className="text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300">Terms and Conditions</a>
                </label>
                {errors.acceptTerms && (
                  <p className="mt-1 text-sm text-error-600 dark:text-error-400" id="terms-error">
                    {errors.acceptTerms.message}
                  </p>
                )}
              </div>
            </div>

            {/* Submit button */}
            <div>
              <Button
                type="submit"
                variant="primary"
                fullWidth
                isLoading={isSubmitting || isLoading}
                loadingText="Creating account..."
                disabled={isSubmitting || isLoading}
              >
                Create Account
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default RegisterPage;
