// TypeScript definitions for FrankTech SDK

interface FrankTechConfig {
  apiKey: string;
  endpoint?: string;
  environment?: string;
  release?: string;
  enabled?: boolean;
  captureConsole?: boolean;
  batchSize?: number;
  flushInterval?: number;
  user?: {
    id?: string;
    email?: string;
  };
  onError?: (error: any) => void;

  // Session Replay options
  enableReplay?: boolean;
  replaySampleRate?: number;
  replayMaskInputs?: boolean;
  replayBlockClass?: string;
  replayMaxDuration?: number;
}

interface ErrorContext {
  severity?: "critical" | "error" | "warning" | "info";
  metadata?: Record<string, any>;
}

interface ReplayEvent {
  type: number;
  data: any;
  timestamp: number;
  [key: string]: any;
}

interface ReplayData {
  events: ReplayEvent[];
  startTimestamp: number;
  endTimestamp: number;
}

interface ErrorData {
  type: string;
  message: string;
  stack_trace?: string;
  severity: string;
  url?: string;
  user_agent?: string;
  environment: string;
  release_version: string;
  user_id?: string;
  user_email?: string;
  extra_data: Record<string, any>;
  session_replay?: ReplayData | null;
  created_at: string;
}

export class FrankTech {
  constructor(config: FrankTechConfig);
  setUser(user: { id?: string; email?: string }): void;
  captureError(error: Error | string, context?: ErrorContext): void;
  flush(): Promise<void>;
  destroy(): void;

  // Session Replay methods
  initReplayRecording(): Promise<void>;
  stopReplayRecording(): void;
  getReplayData(): ReplayData | null;
  getReplayEvents(): ReplayEvent[];
  clearReplayEvents(): void;
  isReplayEnabled(): boolean;
  isReplayRecording(): boolean;
}

export function useFrankTech(config: FrankTechConfig): FrankTech;
export function franktechMiddleware(
  monitor: FrankTech,
): (req: any, res: any, next: any) => void;
export function createFrankTechVuePlugin(config: FrankTechConfig): any;

export default FrankTech;
