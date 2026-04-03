export type TestType = 'color' | 'reaction' | 'memory' | 'audio';

export interface TestResult {
  testType: TestType;
  score: number;
  percentile: number;
  timestamp: number;
  details: Record<string, unknown>;
}

export interface TestRecord {
  testType: TestType;
  bestScore: number;
  bestPercentile: number;
  history: TestResult[];
}

export interface TestConfig {
  type: TestType;
  name: string;
  description: string;
  duration: number;
  icon: string;
  themeColor: string;
  rounds: number;
}

export interface ColorQuestion {
  colors: string[];
  differentIndex: number;
  difficulty: number;
}

export interface MemoryQuestion {
  sequence: number[];
  difficulty: number;
}

export interface AudioQuestion {
  baseFrequency: number;
  targetFrequency: number;
  difficulty: number;
}
