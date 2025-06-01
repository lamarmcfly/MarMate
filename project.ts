import { createApiService, ApiResponse } from './client';
import { v4 as uuidv4 } from 'uuid';

// Types for project entities
export interface ProjectMember {
  id: string;
  user_id: string;
  name: string;
  email: string;
  role: 'owner' | 'editor' | 'viewer';
  joined_at: string;
}

export interface ProjectStats {
  conversations_count: number;
  specifications_count: number;
  code_files_count: number;
  last_activity_at: string;
  completion_percentage: number;
  tasks_total: number;
  tasks_completed: number;
  human_review_pending: number;
}

export enum ProjectStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  ARCHIVED = 'archived',
}

export interface Project {
  id: string;
  name: string;
  description: string;
  status: ProjectStatus;
  created_at: string;
  updated_at: string;
  user_id: string; // Owner ID
  spec_id?: string; // Main specification ID
  repository_url?: string;
  settings: {
    color?: string;
    icon?: string;
    is_public: boolean;
    auto_save: boolean;
    default_frameworks?: {
      frontend?: string;
      backend?: string;
      database?: string;
    };
  };
  stats?: ProjectStats;
  members?: ProjectMember[];
  tags?: string[];
}

// Request types
export interface CreateProjectRequest {
  name: string;
  description?: string;
  spec_id?: string;
  status?: ProjectStatus;
  settings?: Partial<Project['settings']>;
  tags?: string[];
}

export interface UpdateProjectRequest {
  name?: string;
  description?: string;
  status?: ProjectStatus;
  spec_id?: string;
  repository_url?: string;
  settings?: Partial<Project['settings']>;
  tags?: string[];
}

export interface ProjectMemberRequest {
  email: string;
  role: 'editor' | 'viewer';
}

export interface ProjectFilterOptions {
  status?: ProjectStatus | ProjectStatus[];
  search?: string;
  tags?: string[];
  sort_by?: 'name' | 'created_at' | 'updated_at' | 'status';
  sort_direction?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

// Response types
export interface ProjectsResponse {
  projects: Project[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export interface ProjectActivityItem {
  id: string;
  type: string; // e.g., 'project_created', 'member_added', 'spec_updated'
  timestamp: string;
  user_name: string; // Name of the user who performed the action
  details: string; // e.g., "Updated specification to v2.1"
  link?: string; // Optional link to the relevant item
}

export interface ProjectActivityResponse {
  activities: ProjectActivityItem[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}


// --- Real API Service ---
const realProjectService = {
  getProjects: async (options?: ProjectFilterOptions): Promise<ApiResponse<ProjectsResponse>> => {
    const apiService = createApiService<ProjectsResponse>('projects');
    return apiService.getAll(options);
  },
  getProject: async (projectId: string): Promise<ApiResponse<Project>> => {
    const apiService = createApiService<Project>('projects');
    return apiService.getById(projectId);
  },
  createProject: async (data: CreateProjectRequest): Promise<ApiResponse<Project>> => {
    const apiService = createApiService<Project>('projects');
    return apiService.create(data);
  },
  updateProject: async (projectId: string, data: UpdateProjectRequest): Promise<ApiResponse<Project>> => {
    const apiService = createApiService<Project>('projects');
    return apiService.update(projectId, data);
  },
  deleteProject: async (projectId: string): Promise<ApiResponse<void>> => {
    const apiService = createApiService<void>('projects');
    return apiService.delete(projectId);
  },
  archiveProject: async (projectId: string): Promise<ApiResponse<Project>> => {
    const apiService = createApiService<Project>('projects');
    return apiService.custom<Project>('patch', `${projectId}/archive`, {});
  },
  restoreProject: async (projectId: string): Promise<ApiResponse<Project>> => {
    const apiService = createApiService<Project>('projects');
    return apiService.custom<Project>('patch', `${projectId}/restore`, {});
  },
  cloneProject: async (projectId: string, newName: string): Promise<ApiResponse<Project>> => {
    const apiService = createApiService<Project>('projects');
    return apiService.custom<Project>('post', `${projectId}/clone`, { name: newName });
  },
  addProjectMember: async (projectId: string, data: ProjectMemberRequest): Promise<ApiResponse<ProjectMember>> => {
    const apiService = createApiService<ProjectMember>('projects');
    return apiService.custom<ProjectMember>('post', `${projectId}/members`, data);
  },
  updateProjectMember: async (
    projectId: string,
    memberId: string,
    role: 'editor' | 'viewer'
  ): Promise<ApiResponse<ProjectMember>> => {
    const apiService = createApiService<ProjectMember>('projects');
    return apiService.custom<ProjectMember>('put', `${projectId}/members/${memberId}`, { role });
  },
  removeProjectMember: async (projectId: string, memberId: string): Promise<ApiResponse<void>> => {
    const apiService = createApiService<void>('projects');
    return apiService.custom<void>('delete', `${projectId}/members/${memberId}`);
  },
  getProjectStats: async (projectId: string): Promise<ApiResponse<ProjectStats>> => {
    const apiService = createApiService<ProjectStats>('projects');
    return apiService.custom<ProjectStats>('get', `${projectId}/stats`);
  },
  getProjectActivity: async (
    projectId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<ApiResponse<ProjectActivityResponse>> => {
    const apiService = createApiService<ProjectActivityResponse>('projects');
    return apiService.custom<ProjectActivityResponse>('get', `${projectId}/activity`, { page, limit });
  },
  exportProject: async (
    projectId: string,
    format: 'json' | 'zip' | 'pdf'
  ): Promise<ApiResponse<Blob>> => {
    const apiService = createApiService<Blob>('projects');
    return apiService.custom<Blob>('get', `${projectId}/export`, { format }, {
      responseType: 'blob',
    });
  },
  importProject: async (file: File): Promise<ApiResponse<Project>> => {
    const formData = new FormData();
    formData.append('file', file);
    const apiService = createApiService<Project>('projects');
    return apiService.custom<Project>('post', 'import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  // Adding methods from DashboardPage that were missing
  getUserStats: async (): Promise<ApiResponse<any>> => { // Replace 'any' with a proper UserStats interface if available
    const apiService = createApiService<any>('stats');
    return apiService.custom<any>('get', 'user');
  },
  getUserActivity: async (limit: number = 10): Promise<ApiResponse<ProjectActivityResponse>> => {
    const apiService = createApiService<ProjectActivityResponse>('activity');
    return apiService.custom<ProjectActivityResponse>('get', 'user', { limit });
  },
};

// --- Mock API Service ---
let mockProjects: Project[] = [
  {
    id: 'proj_1', name: 'USMLE Study Tool', description: 'An application to optimize USMLE study schedules using spaced repetition and analytics.', status: ProjectStatus.ACTIVE,
    created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), updated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), user_id: 'user_1',
    spec_id: 'spec_1', repository_url: 'https://github.com/lamar/usmle-study-tool',
    settings: { color: '#4A90E2', icon: 'BookOpenIcon', is_public: false, auto_save: true, default_frameworks: { frontend: 'React', backend: 'FastAPI', database: 'PostgreSQL' } },
    tags: ['medical', 'education', 'react', 'fastapi'],
    stats: { conversations_count: 5, specifications_count: 2, code_files_count: 150, last_activity_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), completion_percentage: 60, tasks_total: 50, tasks_completed: 30, human_review_pending: 2 },
    members: [{ id: 'mem_1', user_id: 'user_1', name: 'Lamar Martin', email: 'lamar@example.com', role: 'owner', joined_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString() }]
  },
  {
    id: 'proj_2', name: 'Learning Analytics Dashboard', description: 'Dashboard for visualizing learning patterns and performance.', status: ProjectStatus.DRAFT,
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), updated_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), user_id: 'user_1',
    settings: { color: '#F5A623', icon: 'ChartBarIcon', is_public: false, auto_save: true, default_frameworks: { frontend: 'Vue', backend: 'Node.js', database: 'MongoDB' } },
    tags: ['analytics', 'dashboard', 'vue'],
    stats: { conversations_count: 2, specifications_count: 1, code_files_count: 20, last_activity_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), completion_percentage: 15, tasks_total: 20, tasks_completed: 3, human_review_pending: 0 },
    members: [{ id: 'mem_2', user_id: 'user_1', name: 'Lamar Martin', email: 'lamar@example.com', role: 'owner', joined_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() }]
  },
  {
    id: 'proj_3', name: 'NBME Shelf Exam Prep', description: 'AI-powered question bank and study planner for NBME shelf exams.', status: ProjectStatus.COMPLETED,
    created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), updated_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(), user_id: 'user_1',
    settings: { color: '#50E3C2', icon: 'AcademicCapIcon', is_public: false, auto_save: false },
    tags: ['medical', 'test-prep', 'ai'],
    stats: { conversations_count: 10, specifications_count: 3, code_files_count: 250, last_activity_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(), completion_percentage: 100, tasks_total: 80, tasks_completed: 80, human_review_pending: 0 },
    members: [{ id: 'mem_3', user_id: 'user_1', name: 'Lamar Martin', email: 'lamar@example.com', role: 'owner', joined_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString() }]
  },
    {
    id: 'proj_4', name: 'Archived Medical App', description: 'An older project that is now archived.', status: ProjectStatus.ARCHIVED,
    created_at: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000).toISOString(), updated_at: new Date(Date.now() - 50 * 24 * 60 * 60 * 1000).toISOString(), user_id: 'user_1',
    settings: { color: '#BD10E0', icon: 'ArchiveBoxIcon', is_public: false, auto_save: false },
    tags: ['legacy', 'medical'],
    stats: { conversations_count: 3, specifications_count: 1, code_files_count: 50, last_activity_at: new Date(Date.now() - 50 * 24 * 60 * 60 * 1000).toISOString(), completion_percentage: 100, tasks_total: 30, tasks_completed: 30, human_review_pending: 0 },
    members: [{ id: 'mem_4', user_id: 'user_1', name: 'Lamar Martin', email: 'lamar@example.com', role: 'owner', joined_at: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000).toISOString() }]
  }
];

const mockProjectActivities: Record<string, ProjectActivityItem[]> = {
  'proj_1': [
    { id: 'act_1', type: 'project_created', timestamp: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), user_name: 'Lamar Martin', details: 'Created project "USMLE Study Tool"' },
    { id: 'act_2', type: 'spec_updated', timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), user_name: 'AI Assistant', details: 'Generated v1.1 of specification' },
    { id: 'act_3', type: 'code_commit', timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), user_name: 'AI Assistant', details: 'Committed frontend components' },
  ],
  'proj_2': [
     { id: 'act_4', type: 'project_created', timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), user_name: 'Lamar Martin', details: 'Created project "Learning Analytics Dashboard"' },
  ]
};

const mockUserStats = {
    projects_count: mockProjects.length,
    active_conversations_count: 7,
    completed_specifications_count: 3,
    generated_files_count: 420,
    projects_change: 2, // e.g. +2 new projects this month
    conversations_change: 5,
    specifications_change: 1,
    files_change: 50,
    project_progress: mockProjects.filter(p => p.status === ProjectStatus.ACTIVE || p.status === ProjectStatus.DRAFT).slice(0,5).map(p => ({
        date: p.updated_at.split('T')[0], // Using updated_at as a proxy for progress date
        progress: p.stats?.completion_percentage || 0,
        name: p.name
    }))
};


const simulateDelay = (ms: number = 1000) => new Promise(resolve => setTimeout(resolve, ms));

const mockProjectService = {
  getProjects: async (options?: ProjectFilterOptions): Promise<ApiResponse<ProjectsResponse>> => {
    await simulateDelay();
    let filtered = [...mockProjects];

    if (options?.status) {
      const statuses = Array.isArray(options.status) ? options.status : [options.status];
      filtered = filtered.filter(p => statuses.includes(p.status));
    }
    if (options?.search) {
      const searchTerm = options.search.toLowerCase();
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(searchTerm) ||
        (p.description && p.description.toLowerCase().includes(searchTerm))
      );
    }
    if (options?.tags && options.tags.length > 0) {
      filtered = filtered.filter(p =>
        p.tags && options.tags?.every(tag => p.tags!.includes(tag))
      );
    }

    if (options?.sort_by) {
      filtered.sort((a, b) => {
        const valA = a[options.sort_by!] ?? '';
        const valB = b[options.sort_by!] ?? '';
        if (typeof valA === 'string' && typeof valB === 'string') {
          return options.sort_direction === 'desc' ? valB.localeCompare(valA) : valA.localeCompare(valB);
        }
        if (typeof valA === 'number' && typeof valB === 'number') {
          return options.sort_direction === 'desc' ? valB - valA : valA - valB;
        }
        // For dates (strings)
        const dateA = new Date(valA as string).getTime();
        const dateB = new Date(valB as string).getTime();
        return options.sort_direction === 'desc' ? dateB - dateA : dateA - dateB;
      });
    }

    const page = options?.page || 1;
    const limit = options?.limit || 10;
    const total = filtered.length;
    const total_pages = Math.ceil(total / limit);
    const paginatedProjects = filtered.slice((page - 1) * limit, page * limit);

    return {
      data: { projects: paginatedProjects, total, page, limit, total_pages },
      status: 200,
      headers: {},
    };
  },
  getProject: async (projectId: string): Promise<ApiResponse<Project>> => {
    await simulateDelay();
    const project = mockProjects.find(p => p.id === projectId);
    if (project) {
      return { data: project, status: 200, headers: {} };
    }
    return Promise.reject({ status: 404, message: 'Project not found' });
  },
  createProject: async (data: CreateProjectRequest): Promise<ApiResponse<Project>> => {
    await simulateDelay();
    const now = new Date().toISOString();
    const newProject: Project = {
      id: uuidv4(),
      ...data,
      status: data.status || ProjectStatus.DRAFT,
      created_at: now,
      updated_at: now,
      user_id: 'user_1', // Assuming a default user for mock
      settings: { is_public: false, auto_save: true, ...data.settings },
      tags: data.tags || [],
      stats: { conversations_count: 0, specifications_count: 0, code_files_count: 0, last_activity_at: now, completion_percentage: 0, tasks_total:0, tasks_completed:0, human_review_pending: 0 },
      members: [{ id: uuidv4(), user_id: 'user_1', name: 'Mock User', email: 'mock@example.com', role: 'owner', joined_at: now }]
    };
    mockProjects.unshift(newProject); // Add to the beginning
    return { data: newProject, status: 201, headers: {} };
  },
  updateProject: async (projectId: string, data: UpdateProjectRequest): Promise<ApiResponse<Project>> => {
    await simulateDelay();
    const index = mockProjects.findIndex(p => p.id === projectId);
    if (index !== -1) {
      mockProjects[index] = { ...mockProjects[index], ...data, updated_at: new Date().toISOString() };
      if (data.settings) {
        mockProjects[index].settings = { ...mockProjects[index].settings, ...data.settings };
      }
      return { data: mockProjects[index], status: 200, headers: {} };
    }
    return Promise.reject({ status: 404, message: 'Project not found' });
  },
  deleteProject: async (projectId: string): Promise<ApiResponse<void>> => {
    await simulateDelay();
    const initialLength = mockProjects.length;
    mockProjects = mockProjects.filter(p => p.id !== projectId);
    if (mockProjects.length < initialLength) {
      return { data: undefined, status: 204, headers: {} };
    }
    return Promise.reject({ status: 404, message: 'Project not found' });
  },
  archiveProject: async (projectId: string): Promise<ApiResponse<Project>> => {
    return mockProjectService.updateProject(projectId, { status: ProjectStatus.ARCHIVED });
  },
  restoreProject: async (projectId: string): Promise<ApiResponse<Project>> => {
    return mockProjectService.updateProject(projectId, { status: ProjectStatus.ACTIVE });
  },
  cloneProject: async (projectId: string, newName: string): Promise<ApiResponse<Project>> => {
    await simulateDelay();
    const originalProject = mockProjects.find(p => p.id === projectId);
    if (originalProject) {
      const clonedProject: Project = {
        ...originalProject,
        id: uuidv4(),
        name: newName,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        status: ProjectStatus.DRAFT, // Cloned projects start as drafts
      };
      mockProjects.unshift(clonedProject);
      return { data: clonedProject, status: 201, headers: {} };
    }
    return Promise.reject({ status: 404, message: 'Original project not found' });
  },
  addProjectMember: async (projectId: string, data: ProjectMemberRequest): Promise<ApiResponse<ProjectMember>> => {
    await simulateDelay();
    const project = mockProjects.find(p => p.id === projectId);
    if (project) {
      const newMember: ProjectMember = {
        id: uuidv4(),
        user_id: uuidv4(), // mock user id
        name: data.email.split('@')[0], // mock name
        email: data.email,
        role: data.role,
        joined_at: new Date().toISOString(),
      };
      project.members = [...(project.members || []), newMember];
      return { data: newMember, status: 201, headers: {} };
    }
    return Promise.reject({ status: 404, message: 'Project not found' });
  },
  updateProjectMember: async (projectId: string, memberId: string, role: 'editor' | 'viewer'): Promise<ApiResponse<ProjectMember>> => {
    await simulateDelay();
    const project = mockProjects.find(p => p.id === projectId);
    if (project && project.members) {
      const memberIndex = project.members.findIndex(m => m.id === memberId);
      if (memberIndex !== -1) {
        project.members[memberIndex].role = role;
        return { data: project.members[memberIndex], status: 200, headers: {} };
      }
    }
    return Promise.reject({ status: 404, message: 'Project or member not found' });
  },
  removeProjectMember: async (projectId: string, memberId: string): Promise<ApiResponse<void>> => {
    await simulateDelay();
    const project = mockProjects.find(p => p.id === projectId);
    if (project && project.members) {
      const initialLength = project.members.length;
      project.members = project.members.filter(m => m.id !== memberId);
      if (project.members.length < initialLength) {
        return { data: undefined, status: 204, headers: {} };
      }
    }
    return Promise.reject({ status: 404, message: 'Project or member not found' });
  },
  getProjectStats: async (projectId: string): Promise<ApiResponse<ProjectStats>> => {
    await simulateDelay(500);
    const project = mockProjects.find(p => p.id === projectId);
    if (project && project.stats) {
      return { data: project.stats, status: 200, headers: {} };
    } else if (project) { // Generate some default stats if none exist
        const defaultStats: ProjectStats = {
            conversations_count: Math.floor(Math.random() * 10),
            specifications_count: Math.floor(Math.random() * 3) + 1,
            code_files_count: Math.floor(Math.random() * 200),
            last_activity_at: project.updated_at,
            completion_percentage: Math.floor(Math.random() * 100),
            tasks_total: Math.floor(Math.random() * 50),
            tasks_completed: Math.floor(Math.random() * 30),
            human_review_pending: Math.floor(Math.random() * 5),
        };
        return { data: defaultStats, status: 200, headers: {} };
    }
    return Promise.reject({ status: 404, message: 'Project not found' });
  },
  getProjectActivity: async (projectId: string, page: number = 1, limit: number = 20): Promise<ApiResponse<ProjectActivityResponse>> => {
    await simulateDelay(800);
    const activities = mockProjectActivities[projectId] || [];
    const total = activities.length;
    const total_pages = Math.ceil(total / limit);
    const paginatedActivities = activities.slice((page - 1) * limit, page * limit);
    return {
      data: { activities: paginatedActivities, total, page, limit, total_pages },
      status: 200,
      headers: {},
    };
  },
  exportProject: async (projectId: string, format: 'json' | 'zip' | 'pdf'): Promise<ApiResponse<Blob>> => {
    await simulateDelay(1500);
    const project = mockProjects.find(p => p.id === projectId);
    if (project) {
      let blobContent: string;
      let mimeType: string;
      if (format === 'json') {
        blobContent = JSON.stringify(project, null, 2);
        mimeType = 'application/json';
      } else if (format === 'pdf') {
        blobContent = `PDF Export for ${project.name}\n\n${project.description}`; // Simplified PDF
        mimeType = 'application/pdf';
      } else { // zip
        blobContent = `ZIP archive for ${project.name}`; // Simplified ZIP
        mimeType = 'application/zip';
      }
      const blob = new Blob([blobContent], { type: mimeType });
      return { data: blob, status: 200, headers: {} };
    }
    return Promise.reject({ status: 404, message: 'Project not found' });
  },
  importProject: async (file: File): Promise<ApiResponse<Project>> => {
    await simulateDelay(2000);
    // Simulate reading file content (in real app, this would be more complex)
    const newProjectData: CreateProjectRequest = {
      name: file.name.replace(/\.[^/.]+$/, "") + " (Imported)",
      description: `Imported from file: ${file.name}`,
      tags: ['imported'],
    };
    return mockProjectService.createProject(newProjectData);
  },
  getUserStats: async (): Promise<ApiResponse<any>> => {
    await simulateDelay(700);
    return { data: mockUserStats, status: 200, headers: {} };
  },
  getUserActivity: async (limit: number = 10): Promise<ApiResponse<ProjectActivityResponse>> => {
    await simulateDelay(600);
    const allActivities = Object.values(mockProjectActivities).flat().sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    const paginatedActivities = allActivities.slice(0, limit);
    return {
        data: { activities: paginatedActivities, total: allActivities.length, page: 1, limit, total_pages: Math.ceil(allActivities.length / limit) },
        status: 200,
        headers: {}
    };
  }
};

// --- Export Service ---
// Use environment variable to switch between real and mock services
const projectServiceToExport = import.meta.env.VITE_USE_MOCK_API === 'true'
  ? mockProjectService
  : realProjectService;

export default projectServiceToExport;
