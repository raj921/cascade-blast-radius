export type RiskLevel = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export interface ChangedSymbol {
  file: string;
  symbol: string;
  kind: string;
  old_sig: string;
  new_sig: string;
}

export interface Impact {
  file: string;
  line: number;
  symbol: string;
  risk: RiskLevel;
  reason: string;
  indirect: boolean;
}

export interface MissingTest {
  file: string;
  scenario: string;
}

export interface SuggestedRegressionTest {
  path: string;
  code: string;
}

export interface AnalysisSummary {
  overall_risk: RiskLevel;
  files_affected: number;
  cross_service: boolean;
  critical_impacts: number;
  high_impacts: number;
  medium_impacts: number;
  low_impacts: number;
}

export interface BlastRadiusAnalysis {
  changed_symbols: ChangedSymbol[];
  impacts: Impact[];
  missing_tests: MissingTest[];
  suggested_regression_tests: SuggestedRegressionTest[];
  summary: AnalysisSummary;
}

export interface DemoAnalysis extends BlastRadiusAnalysis {
  id: string;
  title: string;
  description: string;
}

// Made with Bob
