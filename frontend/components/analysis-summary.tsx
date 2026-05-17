import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AnalysisSummary as AnalysisSummaryType } from '@/types/analysis';
import { RiskBadge } from '@/components/risk-badge';
import { FileText, AlertTriangle, GitBranch } from 'lucide-react';

interface AnalysisSummaryProps {
  summary: AnalysisSummaryType;
}

export function AnalysisSummary({ summary }: AnalysisSummaryProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Overall Risk</CardTitle>
          <AlertTriangle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <RiskBadge risk={summary.overall_risk} className="text-lg" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Files Affected</CardTitle>
          <FileText className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{summary.files_affected}</div>
          <p className="text-xs text-muted-foreground">
            {summary.cross_service ? 'Cross-service impact' : 'Single service'}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Critical Impacts</CardTitle>
          <AlertTriangle className="h-4 w-4 text-red-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-500">{summary.critical_impacts}</div>
          <p className="text-xs text-muted-foreground">Require immediate attention</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Impact Breakdown</CardTitle>
          <GitBranch className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-orange-500">High:</span>
              <span className="font-medium">{summary.high_impacts}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-yellow-500">Medium:</span>
              <span className="font-medium">{summary.medium_impacts}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-green-500">Low:</span>
              <span className="font-medium">{summary.low_impacts}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Made with Bob
