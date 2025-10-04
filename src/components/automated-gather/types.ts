export interface AutomatedGatherProgress {
  status: 'idle' | 'running' | 'completed' | 'failed' | 'cancelled';
  currentDepartment: string | null;
  currentIteration: number;
  maxIterations: number;
  qualityScore: number;
  targetQualityScore: number;
  totalItems: number;
  duplicatesRemoved: number;
  departments: DepartmentProgress[];
  isDeduplicating: boolean;
  model: string;
  startedAt?: string;
  completedAt?: string;
  error?: string;
}

export interface DepartmentProgress {
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  items: number;
  duplicatesRemoved: number;
  qualityScore: number;
}

export interface AutomatedGatherConfig {
  model: string;
  qualityThreshold: number;
  maxIterations: number;
}
