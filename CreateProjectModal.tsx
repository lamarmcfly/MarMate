import React, { useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Button from '@/components/ui/Button';
import { Project } from '@/api/project';

// Form validation schema
const projectSchema = z.object({
  name: z.string()
    .min(1, 'Project name is required')
    .max(100, 'Project name cannot exceed 100 characters'),
  description: z.string()
    .max(500, 'Description cannot exceed 500 characters')
    .optional(),
});

type ProjectFormData = z.infer<typeof projectSchema>;

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ProjectFormData) => void;
  project?: Project | null;
  isLoading?: boolean;
}

const CreateProjectModal: React.FC<CreateProjectModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  project,
  isLoading = false,
}) => {
  const isEditMode = !!project;

  // Form handling with React Hook Form
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isValid, isDirty },
  } = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      name: '',
      description: '',
    },
  });

  // Reset form when modal opens or project changes
  useEffect(() => {
    if (isOpen) {
      reset({
        name: project?.name || '',
        description: project?.description || '',
      });
    }
  }, [isOpen, project, reset]);

  // Handle form submission
  const handleFormSubmit = (data: ProjectFormData) => {
    onSubmit(data);
  };

  return (
    <Transition show={isOpen} as={React.Fragment}>
      <Dialog
        as="div"
        className="fixed inset-0 z-50 overflow-y-auto"
        onClose={isLoading ? () => {} : onClose}
        aria-labelledby="create-project-modal"
      >
        {/* Backdrop */}
        <Transition.Child
          as={React.Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/50 transition-opacity" aria-hidden="true" />
        </Transition.Child>

        {/* Modal panel */}
        <div className="flex min-h-full items-center justify-center p-4 text-center">
          <Transition.Child
            as={React.Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-lg bg-white dark:bg-neutral-800 p-6 text-left align-middle shadow-xl transition-all">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <Dialog.Title
                  as="h3"
                  className="text-lg font-semibold text-neutral-900 dark:text-neutral-100"
                  id="create-project-modal"
                >
                  {isEditMode ? 'Edit Project' : 'Create New Project'}
                </Dialog.Title>
                <button
                  type="button"
                  className="rounded-full p-1 text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  onClick={onClose}
                  disabled={isLoading}
                  aria-label="Close"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit(handleFormSubmit)}>
                <div className="space-y-4">
                  {/* Project Name */}
                  <div>
                    <label
                      htmlFor="name"
                      className="block text-sm font-medium text-neutral-900 dark:text-neutral-100 mb-1"
                    >
                      Project Name <span className="text-error-500">*</span>
                    </label>
                    <input
                      id="name"
                      type="text"
                      {...register('name')}
                      className={`w-full rounded-md border ${
                        errors.name ? 'border-error-300 dark:border-error-700' : 'border-neutral-300 dark:border-neutral-600'
                      } bg-white dark:bg-neutral-700 px-3 py-2 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-500 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 disabled:opacity-75`}
                      placeholder="My Awesome Project"
                      disabled={isLoading}
                      aria-invalid={!!errors.name}
                      aria-describedby={errors.name ? "name-error" : undefined}
                    />
                    {errors.name && (
                      <p id="name-error" className="mt-1 text-sm text-error-500">
                        {errors.name.message}
                      </p>
                    )}
                  </div>

                  {/* Project Description */}
                  <div>
                    <label
                      htmlFor="description"
                      className="block text-sm font-medium text-neutral-900 dark:text-neutral-100 mb-1"
                    >
                      Description
                    </label>
                    <textarea
                      id="description"
                      {...register('description')}
                      rows={4}
                      className={`w-full rounded-md border ${
                        errors.description ? 'border-error-300 dark:border-error-700' : 'border-neutral-300 dark:border-neutral-600'
                      } bg-white dark:bg-neutral-700 px-3 py-2 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-500 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 disabled:opacity-75 resize-y`}
                      placeholder="Describe your project (optional)"
                      disabled={isLoading}
                      aria-invalid={!!errors.description}
                      aria-describedby={errors.description ? "description-error" : undefined}
                    />
                    {errors.description && (
                      <p id="description-error" className="mt-1 text-sm text-error-500">
                        {errors.description.message}
                      </p>
                    )}
                    <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                      {500 - (register('description').value?.length || 0)} characters remaining
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-6 flex justify-end gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onClose}
                    disabled={isLoading}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    disabled={isLoading || (!isDirty && isEditMode) || !isValid}
                    isLoading={isLoading}
                    loadingText={isEditMode ? "Saving..." : "Creating..."}
                  >
                    {isEditMode ? 'Save Changes' : 'Create Project'}
                  </Button>
                </div>
              </form>
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition>
  );
};

export default CreateProjectModal;
