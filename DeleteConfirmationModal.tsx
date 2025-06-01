import React from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { ExclamationTriangleIcon, XMarkIcon } from '@heroicons/react/24/outline';
import Button from '@/components/ui/Button';

interface DeleteConfirmationModalProps {
  /**
   * Controls whether the modal is displayed
   */
  isOpen: boolean;
  
  /**
   * Function to call when the modal is closed without confirmation
   */
  onClose: () => void;
  
  /**
   * Function to call when deletion is confirmed
   */
  onConfirm: () => void;
  
  /**
   * Title of the confirmation modal
   * @default "Confirm Deletion"
   */
  title?: string;
  
  /**
   * Message to display in the confirmation modal
   * @default "Are you sure you want to delete this item? This action cannot be undone."
   */
  message?: string | React.ReactNode;
  
  /**
   * Text for the cancel button
   * @default "Cancel"
   */
  cancelButtonText?: string;
  
  /**
   * Text for the confirm button
   * @default "Delete"
   */
  confirmButtonText?: string;
  
  /**
   * Whether the confirmation action is in progress
   * @default false
   */
  isLoading?: boolean;
  
  /**
   * Additional CSS class for the modal
   */
  className?: string;
}

const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title = "Confirm Deletion",
  message = "Are you sure you want to delete this item? This action cannot be undone.",
  cancelButtonText = "Cancel",
  confirmButtonText = "Delete",
  isLoading = false,
  className,
}) => {
  return (
    <Transition show={isOpen} as={React.Fragment}>
      <Dialog
        as="div"
        className="fixed inset-0 z-50 overflow-y-auto"
        onClose={isLoading ? () => {} : onClose}
        aria-labelledby="delete-confirmation-modal"
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
            <Dialog.Panel 
              className={`w-full max-w-md transform overflow-hidden rounded-lg bg-white dark:bg-neutral-800 p-6 text-left align-middle shadow-xl transition-all ${className}`}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <Dialog.Title
                  as="h3"
                  className="text-lg font-semibold text-error-600 dark:text-error-400"
                  id="delete-confirmation-modal"
                >
                  {title}
                </Dialog.Title>
                <button
                  type="button"
                  className="rounded-full p-1 text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-700 focus:outline-none focus:ring-2 focus:ring-neutral-500"
                  onClick={onClose}
                  disabled={isLoading}
                  aria-label="Close"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>

              {/* Content */}
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-error-100 dark:bg-error-900/30">
                    <ExclamationTriangleIcon className="h-6 w-6 text-error-600 dark:text-error-400" aria-hidden="true" />
                  </div>
                </div>
                <div className="flex-1">
                  <div className="text-sm text-neutral-700 dark:text-neutral-300">
                    {typeof message === 'string' ? <p>{message}</p> : message}
                  </div>
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
                  {cancelButtonText}
                </Button>
                <Button
                  type="button"
                  variant="danger"
                  onClick={onConfirm}
                  isLoading={isLoading}
                  loadingText="Deleting..."
                  disabled={isLoading}
                >
                  {confirmButtonText}
                </Button>
              </div>
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition>
  );
};

export default DeleteConfirmationModal;
