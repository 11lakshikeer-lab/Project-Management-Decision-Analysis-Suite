import { projectId, publicAnonKey } from './supabase/info';
import { SavedProjectData } from '../App';

const API_BASE_URL = `https://${projectId}.supabase.co/functions/v1/make-server-2df582f7`;

const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${publicAnonKey}`,
};

export const projectApi = {
  // Get all projects
  async getAllProjects(): Promise<SavedProjectData[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/projects`, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch projects: ${response.statusText}`);
      }

      const data = await response.json();
      return data.projects || [];
    } catch (error) {
      console.error('Error fetching projects:', error);
      return [];
    }
  },

  // Get single project by ID
  async getProject(id: string): Promise<SavedProjectData | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/projects/${id}`, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error(`Failed to fetch project: ${response.statusText}`);
      }

      const data = await response.json();
      return data.project;
    } catch (error) {
      console.error('Error fetching project:', error);
      return null;
    }
  },

  // Create or update a project
  async saveProject(projectData: SavedProjectData): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/projects`, {
        method: 'POST',
        headers,
        body: JSON.stringify(projectData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Failed to save project: ${errorData.error || response.statusText}`);
      }

      return true;
    } catch (error) {
      console.error('Error saving project:', error);
      return false;
    }
  },

  // Update an existing project
  async updateProject(id: string, projectData: SavedProjectData): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/projects/${id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(projectData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Failed to update project: ${errorData.error || response.statusText}`);
      }

      return true;
    } catch (error) {
      console.error('Error updating project:', error);
      return false;
    }
  },

  // Delete a project
  async deleteProject(id: string): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/projects/${id}`, {
        method: 'DELETE',
        headers,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Failed to delete project: ${errorData.error || response.statusText}`);
      }

      return true;
    } catch (error) {
      console.error('Error deleting project:', error);
      return false;
    }
  },
};
