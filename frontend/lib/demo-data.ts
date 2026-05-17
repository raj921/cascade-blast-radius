import { BlastRadiusAnalysis, DemoAnalysis } from '@/types/analysis';
import demo1 from '@/data/demo-1.json';
import demo2 from '@/data/demo-2.json';
import demo3 from '@/data/demo-3.json';

export const demoAnalyses: DemoAnalysis[] = [
  {
    id: 'demo-1',
    title: 'Authentication Signature Change',
    description: 'Critical authentication bypass due to return type change in verifyToken function',
    ...(demo1 as BlastRadiusAnalysis),
  },
  {
    id: 'demo-2',
    title: 'Environment Variable Rename',
    description: 'Email service failure due to SMTP_SERVER → MAIL_HOST environment variable rename',
    ...(demo2 as BlastRadiusAnalysis),
  },
  {
    id: 'demo-3',
    title: 'Tax Calculation Rounding',
    description: 'Medium risk change in tax calculation rounding behavior',
    ...(demo3 as BlastRadiusAnalysis),
  },
];

export function getDemoAnalysis(id: string): DemoAnalysis | undefined {
  return demoAnalyses.find((demo) => demo.id === id);
}

export function getAllDemoAnalyses(): DemoAnalysis[] {
  return demoAnalyses;
}

// Made with Bob
