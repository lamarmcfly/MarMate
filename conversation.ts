import { createApiService, ApiResponse } from './client';

// Types for conversation entities
export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface ConversationState {
  id: string;
  stage: 'collecting' | 'clarifying' | 'generating' | 'completed';
  awaiting_user: boolean;
  spec_ready: boolean;
  spec_id?: string;
}

// Request types
export interface StartConversationRequest {
  initialPrompt: string;
  projectName?: string;
  userSkillLevel?: 'beginner' | 'intermediate' | 'expert';
}

export interface SendMessageRequest {
  message: string;
}

// Response types
export interface ConversationResponse {
  conversation_id: string;
  message: string;
  stage: 'collecting' | 'clarifying' | 'generating' | 'completed';
  awaiting_user: boolean;
  spec_ready: boolean;
  spec_id?: string;
}

export interface SpecificationResponse {
  spec_id: string;
  project_name: string;
  content: {
    executive_summary: string;
    functional_requirements: Array<{
      id: string;
      title: string;
      description: string;
      priority: 'High' | 'Medium' | 'Low';
    }>;
    non_functional_requirements: Array<{
      id: string;
      category: string;
      description: string;
      acceptance_criteria: string;
    }>;
    constraints: Array<{
      id: string;
      description: string;
    }>;
    tech_stack: {
      frontend: string;
      backend: string;
      database: string;
      deployment: string;
      additional_services: string[];
    };
    milestones: Array<{
      id: string;
      name: string;
      duration: string;
      tasks: string[];
      dependencies: string[];
    }>;
    assumptions: string[];
    risks: Array<{
      description: string;
      impact: 'High' | 'Medium' | 'Low';
      mitigation: string;
    }>;
    estimated_timeline: string;
    estimated_budget_range: string;
  };
  created_at: string;
  version: number;
}

export interface ConversationHistoryResponse {
  conversation_id: string;
  project_name: string;
  messages: ConversationMessage[];
  stage: 'collecting' | 'clarifying' | 'generating' | 'completed';
  created_at: string;
  updated_at: string;
}

// Create conversation API service
const conversationService = {
  // Start a new conversation
  startConversation: async (data: StartConversationRequest): Promise<ApiResponse<ConversationResponse>> => {
    const apiService = createApiService<ConversationResponse>('specification');
    return apiService.custom<ConversationResponse>('post', 'start', data);
  },

  // Send a message in an existing conversation
  sendMessage: async (conversationId: string, data: SendMessageRequest): Promise<ApiResponse<ConversationResponse>> => {
    const apiService = createApiService<ConversationResponse>('specification');
    return apiService.custom<ConversationResponse>('post', `${conversationId}`, data);
  },

  // Get a specification by ID
  getSpecification: async (specId: string): Promise<ApiResponse<SpecificationResponse>> => {
    const apiService = createApiService<SpecificationResponse>('specification');
    return apiService.getById(specId);
  },

  // Get conversation history
  getConversationHistory: async (conversationId: string): Promise<ApiResponse<ConversationHistoryResponse>> => {
