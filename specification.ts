import { createApiService, ApiResponse } from './client';

// Types for specification entities
export interface RequirementItem {
  id: string;
  title: string;
  description: string;
  priority: 'High' | 'Medium' | 'Low';
}

export interface NonFunctionalRequirement {
  id: string;
  category: string;
  description: string;
  acceptance_criteria: string;
}

export interface Constraint {
  id: string;
  description: string;
}

export interface TechStack {
  frontend: string;
  backend: string;
  database: string;
  deployment: string;
  additional_services: string[];
}

export interface Milestone {
  id: string;
  name: string;
  duration: string;
  tasks: string[];
  dependencies: string[];
}

export interface Risk {
  description: string;
  impact: 'High' | 'Medium' | 'Low';
  mitigation: string;
}

export interface SpecificationContent {
  executive_summary: string;
  functional_requirements: RequirementItem[];
  non_functional_requirements: NonFunctionalRequirement[];
  constraints: Constraint[];
  tech_stack: TechStack;
  milestones: Milestone[];
  assumptions: string[];
  risks: Risk[];
  estimated_timeline: string;
  estimated_budget_range: string;
}

export interface Specification {
  id: string;
  project_name: string;
  content: SpecificationContent;
  created_at: string;
  updated_at: string;
  version: number;
  conversation_id: string;
  user_id: string;
}

// Request types
export interface UpdateSpecificationRequest {
  project_name?: string;
  content?: Partial<SpecificationContent>;
}

export interface GenerateCodeRequest {
  specId: string;
  frameworks?: {
    frontend?: string;
    backend?: string;
    database?: string;
  };
  repositoryInfo?: {
    owner: string;
    name: string;
    branch?: string;
  };
}

export interface ExportSpecificationRequest {
  format: 'pdf' | 'markdown' | 'html' | 'docx' | 'json';
  includeCode?: boolean;
  includeDiagrams?: boolean;
}

// Response types
export interface CodeGenerationResponse {
  session_id: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  files_generated?: number;
  error_message?: string;
}

// Create specification API service
const specificationService = {
  // Get a specification by ID
  getSpecification: async (specId: string): Promise<ApiResponse<Specification>> => {
    const apiService = createApiService<Specification>('specification');
    return apiService.getById(specId);
  },

  // Get all specifications for a user
  getUserSpecifications: async (): Promise<ApiResponse<Specification[]>> => {
    const apiService = createApiService<Specification[]>('specifications');
    return apiService.getAll();
  },

  // Update a specification
  updateSpecification: async (
    specId: string,
    data: UpdateSpecificationRequest
  ): Promise<ApiResponse<Specification>> => {
    const apiService = createApiService<Specification>('specification');
    return apiService.update(specId, data);
  },

  // Generate code from a specification
  generateCode: async (
    data: GenerateCodeRequest
  ): Promise<ApiResponse<CodeGenerationResponse>> => {
    const apiService = createApiService<CodeGenerationResponse>('code');
    return apiService.custom<CodeGenerationResponse>('post', 'generate', data);
  },

  // Check code generation status
  checkCodeGenerationStatus: async (
    sessionId: string
  ): Promise<ApiResponse<CodeGenerationResponse>> => {
    const apiService = createApiService<CodeGenerationResponse>('code');
    return apiService.custom<CodeGenerationResponse>('get', `status/${sessionId}`);
  },

  // Export specification to different formats
  exportSpecification: async (
    specId: string,
    options: ExportSpecificationRequest
  ): Promise<ApiResponse<Blob>> => {
    const apiService = createApiService<Blob>('specification');
    return apiService.custom<Blob>('post', `${specId}/export`, options, {
      responseType: 'blob',
    });
  },

  // Clone a specification as a new project
  cloneSpecification: async (
    specId: string,
    newName: string
  ): Promise<ApiResponse<Specification>> => {
    const apiService = createApiService<Specification>('specification');
    return apiService.custom<Specification>('post', `${specId}/clone`, { project_name: newName });
  },

  // Share a specification with another user
  shareSpecification: async (
    specId: string,
    email: string,
    permission: 'view' | 'edit'
  ): Promise<ApiResponse<{ success: boolean }>> => {
    const apiService = createApiService<{ success: boolean }>('specification');
    return apiService.custom<{ success: boolean }>('post', `${specId}/share`, {
      email,
      permission,
    });
  },

  // Get specification versions history
  getSpecificationVersions: async (
    specId: string
  ): Promise<ApiResponse<{ versions: { version: number; created_at: string }[] }>> => {
    const apiService = createApiService<{ versions: { version: number; created_at: string }[] }>(
      'specification'
    );
    return apiService.custom<{ versions: { version: number; created_at: string }[] }>(
      'get',
      `${specId}/versions`
    );
  },

  // Get a specific version of a specification
  getSpecificationVersion: async (
    specId: string,
    version: number
  ): Promise<ApiResponse<Specification>> => {
    const apiService = createApiService<Specification>('specification');
    return apiService.custom<Specification>('get', `${specId}/versions/${version}`);
  },

  // Delete a specification
  deleteSpecification: async (specId: string): Promise<ApiResponse<void>> => {
    const apiService = createApiService<void>('specification');
    return apiService.delete(specId);
  },
};

export default specificationService;
