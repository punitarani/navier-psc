// API client for Parameter Sweep Configurator backend
import { 
  ParameterSweepConfigurationRequest, 
  ParameterSweepConfigurationModel, 
  HealthResponse,
  BaseResponse,
  ParameterDefinition,
  SimulationStatusModel
} from "./types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export class ApiError extends Error {
  constructor(public status: number, message: string, public details?: any) {
    super(message);
    this.name = 'ApiError';
  }
}

async function apiRequest<T>(
  endpoint: string, 
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      let errorDetails = null;
      
      try {
        errorDetails = await response.json();
        if (errorDetails.detail) {
          errorMessage = Array.isArray(errorDetails.detail) 
            ? errorDetails.detail.map((e: any) => e.msg).join(', ')
            : errorDetails.detail;
        }
      } catch {
        // If we can't parse the error response, use the status text
      }
      
      throw new ApiError(response.status, errorMessage, errorDetails);
    }

    return response.json();
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    
    // Network or other errors
    throw new ApiError(0, error instanceof Error ? error.message : 'Network error');
  }
}

export const api = {
  // Health check
  async health(): Promise<HealthResponse> {
    return apiRequest<HealthResponse>('/');
  },

  // Get parameter definitions
  async getParameterDefinitions(): Promise<ParameterDefinition[]> {
    return apiRequest<ParameterDefinition[]>('/parameters');
  },

  // Create a new configuration
  async createConfig(config: ParameterSweepConfigurationRequest): Promise<ParameterSweepConfigurationModel> {
    return apiRequest<ParameterSweepConfigurationModel>('/configs', {
      method: 'POST',
      body: JSON.stringify(config),
    });
  },

  // Get a specific configuration by ID
  async getConfig(id: string): Promise<ParameterSweepConfigurationModel> {
    return apiRequest<ParameterSweepConfigurationModel>(`/configs/${id}`);
  },

  // Get all configurations
  async getAllConfigs(): Promise<ParameterSweepConfigurationModel[]> {
    return apiRequest<ParameterSweepConfigurationModel[]>('/configs');
  },

  // Delete a configuration
  async deleteConfig(id: string): Promise<BaseResponse> {
    return apiRequest<BaseResponse>(`/configs/${id}`, {
      method: 'DELETE',
    });
  },

  // Start simulation for a configuration
  async startSimulation(id: string): Promise<BaseResponse> {
    return apiRequest<BaseResponse>(`/configs/run/${id}`, {
      method: 'POST',
    });
  },

  // Get simulation runs for a configuration
  async getSimulationRuns(id: string): Promise<SimulationStatusModel[]> {
    return apiRequest<SimulationStatusModel[]>(`/configs/run/${id}`);
  },
};

// WebSocket connection for status updates
export function createWebSocketConnection(configId: string) {
  const WS_BASE_URL = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000";
  return new WebSocket(`${WS_BASE_URL}/ws/configs/${configId}`);
}