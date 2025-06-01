import React from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Button from '@/components/ui/Button';
import { StartConversationRequest } from '@/api/conversation';

// Form validation schema
const formSchema = z.object({
  projectName: z.string().min(1, 'Project name is required'),
  initialPrompt: z.string().min(10, 'Please provide a more detailed description (minimum 10 characters)'),
  userSkillLevel: z.enum(['beginner', 'intermediate', 'expert']).default('intermediate'),
});

type FormData = z.infer<typeof formSchema>;

interface NewConversationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: StartConversationRequest) => void;
  isLoading: boolean;
}

const NewConversationModal: React.FC<NewConversationModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isLoading,
}) => {
  // Form handling
  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    reset,
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    mode: 'onChange',
    defaultValues: {
      projectName: '',
      initialPrompt: '',
      userSkillLevel: 'intermediate',
    },
  });

  // Handle form submission
  const onFormSubmit = (data: FormData) => {
    onSubmit({
      projectName: data.projectName,
      initialPrompt: data.initialPrompt,
      userSkillLevel: data.userSkillLevel,
    });
  };

  // Reset form when modal is closed
  React.useEffect(() => {
    if (!isOpen) {
      setTimeout(() => reset(), 300); // Reset after close animation
    }
  }, [isOpen, reset]);

  return (
    <Transition show={isOpen} as={React.Fragment}>
      <Dialog
        as="div"
        className="fixed inset-0 z-50 overflow-y-auto"
        onClose={isLoading ? () => {} : onClose}
        aria-labelledby="new-conversation-modal"
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
            <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-lg bg-white dark:bg-neutral-800 p-6 text-left align-middle shadow-xl transition-all">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <Dialog.Title
                  as="h3"
                  className="text-lg font-semibold text-neutral-900 dark:text-neutral-100"
                  id="new-conversation-modal"
                >
                  Start New Project
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
              <form onSubmit={handleSubmit(onFormSubmit)}>
                <div className="space-y-4">
                  {/* Project Name */}
                  <div>
                    <label
                      htmlFor="projectName"
                      className="block text-sm font-medium text-neutral-900 dark:text-neutral-100 mb-1"
                    >
                      Project Name
                    </label>
                    <input
                      id="projectName"
                      type="text"
                      {...register('projectName')}
                      className="w-full rounded-md border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 px-3 py-2 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-500 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 disabled:opacity-75"
                      placeholder="My Awesome Project"
                      disabled={isLoading}
                      aria-invalid={!!errors.projectName}
                      aria-describedby={errors.projectName ? "projectName-error" : undefined}
                    />
                    {errors.projectName && (
                      <p id="projectName-error" className="mt-1 text-sm text-error-500">
                        {errors.projectName.message}
                      </p>
                    )}
                  </div>

                  {/* Initial Prompt */}
                  <div>
                    <label
                      htmlFor="initialPrompt"
                      className="block text-sm font-medium text-neutral-900 dark:text-neutral-100 mb-1"
                    >
                      Project Description
                    </label>
                    <textarea
                      id="initialPrompt"
                      {...register('initialPrompt')}
                      rows={5}
                      className="w-full rounded-md border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 px-3 py-2 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-500 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 disabled:opacity-75 resize-y"
                      placeholder="Describe your project idea in detail. What are you trying to build? What features do you need? Who is the target audience?"
                      disabled={isLoading}
                      aria-invalid={!!errors.initialPrompt}
                      aria-describedby={errors.initialPrompt ? "initialPrompt-error" : undefined}
                    />
                    {errors.initialPrompt ? (
                      <p id="initialPrompt-error" className="mt-1 text-sm text-error-500">
                        {errors.initialPrompt.message}
                      </p>
                    ) : (
                      <p className="mt-1 text-xs text-neutral-500">
                        Be as specific as possible. The AI will ask clarifying questions to help refine your project specification.
                      </p>
                    )}
                  </div>

                  {/* User Skill Level */}
                  <div>
                    <label
                      htmlFor="userSkillLevel"
                      className="block text-sm font-medium text-neutral-900 dark:text-neutral-100 mb-1"
                    >
                      Your Technical Expertise
                    </label>
                    <select
                      id="userSkillLevel"
                      {...register('userSkillLevel')}
                      className="w-full rounded-md border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 px-3 py-2 text-neutral-900 dark:text-neutral-100 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 disabled:opacity-75"
                      disabled={isLoading}
                    >
                      <option value="beginner">Beginner - I'm new to software development</option>
                      <option value="intermediate">Intermediate - I have some experience</option>
                      <option value="expert">Expert - I'm an experienced developer</option>
                    </select>
                    <p className="mt-1 text-xs text-neutral-500">
                      This helps the AI adjust explanations and recommendations to your level of expertise.
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
                    disabled={!isValid || isLoading}
                    isLoading={isLoading}
                    loadingText="Starting..."
                  >
                    Start Project
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

export default NewConversationModal;
