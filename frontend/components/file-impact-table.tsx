'use client';

import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { RiskBadge } from '@/components/risk-badge';
import { Impact } from '@/types/analysis';
import { Badge } from '@/components/ui/badge';

interface FileImpactTableProps {
  impacts: Impact[];
}

export function FileImpactTable({ impacts }: FileImpactTableProps) {
  const [sortBy, setSortBy] = useState<'risk' | 'file'>('risk');

  const sortedImpacts = [...impacts].sort((a, b) => {
    if (sortBy === 'risk') {
      const riskOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
      return riskOrder[a.risk] - riskOrder[b.risk];
    }
    return a.file.localeCompare(b.file);
  });

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <button
          onClick={() => setSortBy('risk')}
          className={`px-3 py-1 rounded text-sm ${
            sortBy === 'risk'
              ? 'bg-primary text-primary-foreground'
              : 'bg-secondary text-secondary-foreground'
          }`}
        >
          Sort by Risk
        </button>
        <button
          onClick={() => setSortBy('file')}
          className={`px-3 py-1 rounded text-sm ${
            sortBy === 'file'
              ? 'bg-primary text-primary-foreground'
              : 'bg-secondary text-secondary-foreground'
          }`}
        >
          Sort by File
        </button>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Risk</TableHead>
              <TableHead>File</TableHead>
              <TableHead>Line</TableHead>
              <TableHead>Symbol</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Reason</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedImpacts.map((impact, index) => (
              <TableRow key={index}>
                <TableCell>
                  <RiskBadge risk={impact.risk} />
                </TableCell>
                <TableCell className="font-mono text-sm">{impact.file}</TableCell>
                <TableCell className="text-muted-foreground">{impact.line}</TableCell>
                <TableCell className="font-mono text-sm">{impact.symbol}</TableCell>
                <TableCell>
                  <Badge variant={impact.indirect ? 'outline' : 'secondary'}>
                    {impact.indirect ? 'Indirect' : 'Direct'}
                  </Badge>
                </TableCell>
                <TableCell className="max-w-md">{impact.reason}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

// Made with Bob
