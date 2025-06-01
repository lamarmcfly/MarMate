import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { PlusIcon, ArrowPathIcon, DocumentTextIcon } from '@heroicons/react/24/outline';

import ConversationPanel from '@/components/conversation/ConversationPanel';
import conversationService, { 
  ConversationMessage, 
  ConversationResponse,
  StartConversationRequest
} from '@/api/conversation';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Spinner from '@/components/ui/Spinner';
import NewConversationModal from '@/components/conversation/NewConversationModal';

const ConversationPage: React.FC = () => {
  const { conversationId } = useParams<{ conversationId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  // State
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(!conversationId);
  const [isWebSocketConnected, setIsWebSocketConnected] = useState<boolean>(false);
  
  // Refs
  const wsRef = useRef<WebSocket | null>(null);
  
  // Queries and mutations
  const { data: conversationData, isLoading: isLoadingConversation } = useQuery(
    ['conversation', conversationId],
    () => conversationService.getConversationHistory(conversationId!),
    {
      enabled: !!conversationId,
      onSuccess: (response) => {
        setMessages(response.data.messages || []);
      },
      onError: (error) => {
        toast.error('Failed to load conversation');
        console.error('Error loading conversation:', error);
      }
    }
  );
  
  const startConversationMutation = useMutation(
    (data: StartConversationRequest) => conversationService.startConversation(data),
    {
      onSuccess: (response) => {
        const newConversationId = response.data.conversation_id;
        
        // Add initial assistant message
        const newMessage: ConversationMessage = {
          role: 'assistant',
          content: response.data.message,
          timestamp: new Date().toISOString()
        };
        
        setMessages([newMessage]);
        
        // Navigate to the new conversation
        navigate(`/conversation/${newConversationId}`, { replace: true });
        
        // Close the modal
        setIsModalOpen(false);
        
        // Connect WebSocket
        connectWebSocket(newConversationId);
        
        toast.success('New conversation started');
      },
      onError: (error) => {
        toast.error('Failed to start conversation');
        console.error('Error starting conversation:', error);
      }
    }
  );
  
  const sendMessageMutation = useMutation(
    ({ id, message }: { id: string; message: string }) => 
      conversationService.sendMessage(id, { message }),
    {
      onSuccess: (response) => {
        // Add assistant response
        const newAssistantMessage: ConversationMessage = {
          role: 'assistant',
          content: response.data.message,
          timestamp: new Date().toISOString()
        };
        
        setMessages(prev => [...prev, newAssistantMessage]);
        
        // Check if specification is ready
        if (response.data.spec_ready && response.data.spec_id) {
          toast.success('Specification is ready!', {
            icon: '📄',
            duration: 5000,
            action: {
              text: 'View',
              onClick: () => navigate(`/specification/${response.data.spec_id}`)
            }
          });
        }
        
        // Invalidate queries to refresh data
        queryClient.invalidateQueries(['conversation', conversationId]);
      },
      onError: (error) => {
        toast.error('Failed to send message');
        console.error('Error sending message:', error);
      }
    }
  );
  
  // WebSocket connection
  const connectWebSocket = useCallback((id: string) => {
    // Close existing connection if any
    if (wsRef.current) {
      wsRef.current.close();
    }
    
    try {
      // Create new WebSocket connection
      wsRef.current = conversationService.createWebSocketConnection(id);
      
      // Set up event handlers
      wsRef.current.onopen = () => {
        setIsWebSocketConnected(true);
        console.log('WebSocket connected');
      };
      
      wsRef.current.onclose = () => {
        setIsWebSocketConnected(false);
        console.log('WebSocket disconnected');
      };
      
      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        setIsWebSocketConnected(false);
      };
      
      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data) as ConversationResponse;
          
          // Handle different event types
          if (data.message) {
            const newMessage: ConversationMessage = {
              role: 'assistant',
              content: data.message,
              timestamp: new Date().toISOString()
            };
            
            setMessages(prev => [...prev, newMessage]);
          }
          
          // Check if specification is ready
          if (data.spec_ready && data.spec_id) {
            toast.success('Specification is ready!', {
              icon: '📄',
              duration: 5000,
              action: {
                text: 'View',
                onClick: () => navigate(`/specification/${data.spec_id}`)
              }
            });
          }
          
          // Invalidate queries to refresh data
          queryClient.invalidateQueries(['conversation', id]);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };
    } catch (error) {
      console.error('Error connecting to WebSocket:', error);
    }
  }, [navigate, queryClient]);
  
  // Connect WebSocket when conversationId changes
  useEffect(() => {
    if (conversationId) {
      connectWebSocket(conversationId);
    }
    
    // Cleanup WebSocket on unmount
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [conversationId, connectWebSocket]);
  
  // Handle starting a new conversation
  const handleStartConversation = (data: StartConversationRequest) => {
    startConversationMutation.mutate(data);
  };
  
  // Handle sending a message
  const handleSendMessage = (message: string) => {
    if (!conversationId || !message.trim()) return;
    
    // Add user message to the UI immediately
    const userMessage: ConversationMessage = {
      role: 'user',
      content: message,
      timestamp: new Date().toISOString()
    };
    
    setMessages(prev => [...prev, userMessage]);
    
    // Send message to API
    sendMessageMutation.mutate({ id: conversationId, message });
  };
  
  // Handle refreshing the conversation
  const handleRefreshConversation = () => {
    if (!conversationId) return;
    
    queryClient.invalidateQueries(['conversation', conversationId]);
  };
  
  // Handle viewing the specification
  const handleViewSpecification = () => {
    if (!conversationData?.data.spec_id) return;
    
    navigate(`/specification/${conversationData.data.spec_id}`);
  };
  
  // Handle opening the new conversation modal
  const handleNewConversation = () => {
    setIsModalOpen(true);
  };
  
  // Loading state
  const isLoading = isLoadingConversation || startConversationMutation.isLoading;
  
  // Determine if sending is disabled
  const isSendingDisabled = sendMessageMutation.isLoading || 
    !conversationId || 
    (conversationData?.data.stage === 'completed');
  
  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <header className="border-b border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-4">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
            {conversationData?.data.project_name || 'New Conversation'}
          </h1>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefreshConversation}
              disabled={isLoading}
              icon={<ArrowPathIcon className="w-4 h-4" />}
            >
              Refresh
            </Button>
            
            {conversationData?.data.spec_id && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleViewSpecification}
                icon={<DocumentTextIcon className="w-4 h-4" />}
              >
                View Specification
              </Button>
            )}
            
            <Button
              variant="primary"
              size="sm"
              onClick={handleNewConversation}
              icon={<PlusIcon className="w-4 h-4" />}
            >
              New Conversation
            </Button>
          </div>
        </div>
      </header>
      
      {/* Main content */}
      <main className="flex-1 overflow-hidden p-4 md:p-6">
        <div className="container mx-auto h-full">
          {isLoading && !messages.length ? (
            <div className="h-full flex items-center justify-center">
              <Spinner size="lg" />
            </div>
          ) : (
            <Card className="h-full overflow-hidden">
              <ConversationPanel
                messages={messages}
                isLoading={sendMessageMutation.isLoading}
                onSendMessage={handleSendMessage}
                disabled={isSendingDisabled}
                conversationId={conversationId}
                className="h-full"
              />
            </Card>
          )}
        </div>
      </main>
      
      {/* New conversation modal */}
      <NewConversationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleStartConversation}
        isLoading={startConversationMutation.isLoading}
      />
    </div>
  );
};

export default ConversationPage;
