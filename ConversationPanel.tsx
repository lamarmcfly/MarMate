import React, { useState, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { ConversationMessage } from '@/api/conversation';
import { PaperAirplaneIcon } from '@heroicons/react/24/solid';
import { SparklesIcon } from '@heroicons/react/24/outline';

// Types
export interface ConversationPanelProps {
  messages: ConversationMessage[];
  isLoading: boolean;
  onSendMessage: (message: string) => void;
  disabled?: boolean;
  conversationId?: string;
  className?: string;
}

interface MessageFormData {
  message: string;
}

// Component
const ConversationPanel: React.FC<ConversationPanelProps> = ({
  messages,
  isLoading,
  onSendMessage,
  disabled = false,
  conversationId,
  className = '',
}) => {
  // Form handling
  const { register, handleSubmit, reset, formState } = useForm<MessageFormData>({
    defaultValues: { message: '' },
  });

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  const [textareaHeight, setTextareaHeight] = useState<number>(56); // Default height
  
  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle form submission
  const onSubmit = (data: MessageFormData) => {
    if (data.message.trim()) {
      onSendMessage(data.message.trim());
      reset();
      setTextareaHeight(56); // Reset height
    }
  };

  // Handle textarea resize
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const textarea = e.target;
    
    // Reset height to calculate the new height
    textarea.style.height = '56px';
    
    // Calculate new height (with max height limit)
    const newHeight = Math.min(textarea.scrollHeight, 200);
    textarea.style.height = `${newHeight}px`;
    setTextareaHeight(newHeight);
  };

  // Handle Enter key (submit on Enter, new line on Shift+Enter)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(onSubmit)();
    }
  };

  // Format timestamp
  const formatTime = (timestamp: string): string => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return '';
    }
  };

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Conversation ID display */}
      {conversationId && (
        <div className="px-4 py-2 text-xs text-neutral-500 bg-neutral-100 dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700">
          Conversation ID: {conversationId}
        </div>
      )}

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-neutral-500">
            <SparklesIcon className="w-12 h-12 mb-4 text-primary-500" />
            <p className="text-lg font-medium">Start a conversation</p>
            <p className="text-sm">Describe your project and I'll help you create a detailed specification.</p>
          </div>
        ) : (
          messages.map((message, index) => (
            <div
              key={`${message.role}-${index}-${message.timestamp}`}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] md:max-w-[70%] rounded-lg px-4 py-3 ${
                  message.role === 'user'
                    ? 'bg-primary-500 text-white rounded-tr-none'
                    : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 rounded-tl-none'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-sm">
                    {message.role === 'user' ? 'You' : 'AI Assistant'}
                  </span>
                  <span className="text-xs opacity-75">
                    {formatTime(message.timestamp)}
                  </span>
                </div>
                <div className="whitespace-pre-wrap break-words">
                  {message.content}
                </div>
              </div>
            </div>
          ))
        )}

        {/* Loading indicator */}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-neutral-100 dark:bg-neutral-800 rounded-lg px-4 py-3 max-w-[80%] md:max-w-[70%] rounded-tl-none">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium text-sm">AI Assistant</span>
                <span className="text-xs opacity-75">typing...</span>
              </div>
              <div className="flex space-x-2">
                <div className="w-2 h-2 rounded-full bg-neutral-400 dark:bg-neutral-500 animate-pulse" />
                <div className="w-2 h-2 rounded-full bg-neutral-400 dark:bg-neutral-500 animate-pulse delay-150" />
                <div className="w-2 h-2 rounded-full bg-neutral-400 dark:bg-neutral-500 animate-pulse delay-300" />
              </div>
            </div>
          </div>
        )}

        {/* Auto-scroll anchor */}
        <div ref={messagesEndRef} />
      </div>

      {/* Message input */}
      <div className="border-t border-neutral-200 dark:border-neutral-700 p-4">
        <form onSubmit={handleSubmit(onSubmit)} className="flex items-end gap-2">
          <div className="relative flex-1">
            <textarea
              {...register('message', { required: true })}
              ref={textareaRef}
              rows={1}
              placeholder="Type your message..."
              disabled={disabled || isLoading}
              onChange={handleTextareaChange}
              onKeyDown={handleKeyDown}
              className="w-full rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 px-4 py-3 pr-12 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-500 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 disabled:opacity-75 resize-none"
              style={{ height: `${textareaHeight}px` }}
              aria-label="Message input"
            />
            <div className="absolute right-2 bottom-2">
              <button
                type="submit"
                disabled={disabled || isLoading || !formState.isDirty}
                className="p-2 rounded-full bg-primary-500 text-white hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 transition-colors"
                aria-label="Send message"
              >
                <PaperAirplaneIcon className="w-5 h-5" />
              </button>
            </div>
          </div>
        </form>
        <p className="text-xs text-neutral-500 mt-2 ml-1">
          Press Enter to send, Shift+Enter for a new line
        </p>
      </div>
    </div>
  );
};

export default ConversationPanel;
