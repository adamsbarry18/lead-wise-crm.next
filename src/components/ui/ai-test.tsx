'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { scoreLead } from '@/ai/flows/score-lead';
import { generateSalesStrategyForContact } from '@/ai/flows/generate-sales-strategy';

export function AITest() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string>('');

  const testScoreLead = async () => {
    setLoading(true);
    setResult('Testing score lead...');

    try {
      const scoreResult = await scoreLead({
        engagement: 'High engagement via email',
        exchanges: 'Multiple positive interactions',
        history: 'Contacted 3 times in the last month',
        otherCriteria: 'Type: Lead, Tags: interested, qualified',
      });

      setResult(`Score: ${scoreResult.score}/100\nJustification: ${scoreResult.justification}`);
    } catch (error) {
      setResult(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const testSalesStrategy = async () => {
    setLoading(true);
    setResult('Testing sales strategy...');

    try {
      const strategyResult = await generateSalesStrategyForContact({
        contactSummary: 'Contact has shown interest in our product and has requested a demo.',
      });

      setResult(
        `Strategy generated successfully!\nEmail Sequences: ${strategyResult.salesStrategy.emailSequences.length}\nFollow-ups: ${strategyResult.salesStrategy.followUps.length}\nPriorities: ${strategyResult.salesStrategy.priorities.length}`
      );
    } catch (error) {
      setResult(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>AI Test</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button onClick={testScoreLead} disabled={loading}>
            Test Score Lead
          </Button>
          <Button onClick={testSalesStrategy} disabled={loading}>
            Test Strategy
          </Button>
        </div>
        {result && (
          <div className="p-4 bg-muted rounded-md">
            <pre className="text-sm whitespace-pre-wrap">{result}</pre>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
