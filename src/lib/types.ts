export type AgentStatus = 'running' | 'idle' | 'errored' | 'stopped';

export interface Agent {
  id: string;
  name: string;
  status: AgentStatus;
  taskQueueLength: number;
  currentObjective: string;
  confidence: number; // 0-1
  cpuUsage: number; // 0-100
  memoryUsage: number; // 0-100
  networkIO: { in: number; out: number }; // KB/s
}

export interface PolicyRule {
  id: string;
  condition: string;
  action: string;
  priority: number;
  description: string;
  createdBy: 'user' | 'ai';
}

export type TimeSeriesData = {
  time: string;
  cpu: number;
  memory: number;
}
