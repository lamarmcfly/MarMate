import React, { Fragment, ReactNode } from 'react';
import { Menu, Transition } from '@headlessui/react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/utils/cn';

// Dropdown item variant styling
const dropdownItemVariants = cva(
  'group flex w-full items-center px-4 py-2 text-sm text-neutral-700 dark:text-neutral-300 focus:outline-none',
  {
    variants: {
      variant: {
        default: 'hover:bg-neutral-100 dark:hover:bg-neutral-700 focus:bg-neutral-100 dark:focus:bg-neutral-700',
        danger: 'text-error-600 dark:text-error-400 hover:bg-error-50 dark:hover:bg-error-900/20 focus:bg-error-50 dark:focus:bg-error-900/20',
        success: 'text-success-600 dark:text-success-400 hover:bg-success-50 dark:hover:bg-success-900/20 focus:bg-success-50 dark:focus:bg-success-900/20',
        warning: 'text-warning-600 dark:text-warning-400 hover:bg-warning-50 dark:hover:bg-warning-900/20 focus:bg-warning-50 dark:focus:bg-warning-900/20',
      },
      active: {
        true: 'bg-neutral-100 dark:bg-neutral-700',
      },
      disabled: {
        true: 'opacity-50 cursor-not-allowed pointer-events-none',
      },
    },
    defaultVariants: {
      variant: 'default',
      active: false,
      disabled: false,
    },
  }
);

// Types
export interface DropdownItem {
  label: string;
  icon?: ReactNode;
  onClick?: (e: React.MouseEvent) => void;
  variant?: 'default' | 'danger' | 'success' | 'warning';
  active?: boolean;
  disabled?: boolean;
}

export interface DropdownProps {
  trigger: ReactNode;
  items: (DropdownItem | 'separator')[];
  align?: 'left' | 'right' | 'center';
  width?: 'auto' | 'sm' | 'md' | 'lg';
  className?: string;
  triggerClassName?: string;
  itemsClassName?: string;
}

const Dropdown: React.FC<DropdownProps> = ({
  trigger,
  items,
  align = 'left',
  width = 'auto',
  className,
  triggerClassName,
  itemsClassName,
}) => {
  // Alignment classes
  const alignmentClasses = {
    left: 'left-0 origin-top-left',
    right: 'right-0 origin-top-right',
    center: 'left-1/2 -translate-x-1/2 origin-top',
  };

  // Width classes
  const widthClasses = {
    auto: 'min-w-[12rem]',
    sm: 'w-48',
    md: 'w-56',
    lg: 'w-64',
  };

  return (
    <Menu as="div" className={cn("relative inline-block text-left", className)}>
      {({ open }) => (
        <>
          {/* Trigger button */}
          <Menu.Button as={Fragment}>
            <div className={triggerClassName}>{trigger}</div>
          </Menu.Button>

          {/* Dropdown menu */}
          <Transition
            show={open}
            as={Fragment}
            enter="transition ease-out duration-100"
            enterFrom="transform opacity-0 scale-95"
            enterTo="transform opacity-100 scale-100"
            leave="transition ease-in duration-75"
            leaveFrom="transform opacity-100 scale-100"
            leaveTo="transform opacity-0 scale-95"
          >
            <Menu.Items
              className={cn(
                "absolute z-50 mt-2 rounded-md bg-white dark:bg-neutral-800 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none",
                alignmentClasses[align],
                widthClasses[width],
                itemsClassName
              )}
            >
              <div className="py-1">
                {items.map((item, index) => {
                  // Render a separator
                  if (item === 'separator') {
                    return (
                      <div
                        key={`separator-${index}`}
                        className="my-1 h-px bg-neutral-200 dark:bg-neutral-700"
                        role="separator"
                        aria-orientation="horizontal"
                      />
                    );
                  }

                  // Render a menu item
                  const { label, icon, onClick, variant = 'default', active = false, disabled = false } = item;
                  
                  return (
                    <Menu.Item key={`item-${index}`} disabled={disabled}>
                      {({ active: isActive }) => (
                        <button
                          type="button"
                          className={cn(
                            dropdownItemVariants({
                              variant,
                              active: active || isActive,
                              disabled,
                            })
                          )}
                          onClick={onClick}
                          disabled={disabled}
                        >
                          {icon && <span className="mr-3 h-5 w-5">{icon}</span>}
                          {label}
                        </button>
                      )}
                    </Menu.Item>
                  );
                })}
              </div>
            </Menu.Items>
          </Transition>
        </>
      )}
    </Menu>
  );
};

export default Dropdown;
