'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { BarChart, PieChart, TrendingDown, Users } from 'lucide-react'; // Use appropriate icons

export default function AnalyticsPage() {
  // Placeholder data - replace with actual analytics data fetching and charting
  const leadSourceData = [
    { name: 'Website', value: 400 },
    { name: 'Referral', value: 300 },
    { name: 'Cold Outreach', value: 200 },
    { name: 'Events', value: 100 },
  ];

  const conversionFunnelData = [
    { stage: 'Prospect', count: 1000 },
    { stage: 'Lead', count: 600 },
    { stage: 'MQL', count: 300 },
    { stage: 'Customer', count: 150 },
  ];


  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Analytics</h1>

       <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {/* Placeholder KPI Cards */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg. Sales Cycle</CardTitle>
                 <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">45 Days</div>
                 <p className="text-xs text-muted-foreground">+2% from last month</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Lead Velocity Rate</CardTitle>
                 <TrendingDown className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">8.2%</div>
                <p className="text-xs text-muted-foreground">-1.5% from last month</p>
              </CardContent>
            </Card>
             <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Top Lead Source</CardTitle>
                 <PieChart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">Website</div>
                 <p className="text-xs text-muted-foreground">40% of new leads</p>
              </CardContent>
            </Card>
             <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Activity Score</CardTitle>
                 <BarChart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">78/100</div>
                 <p className="text-xs text-muted-foreground">Overall team activity</p>
              </CardContent>
            </Card>
       </div>


      <Card>
        <CardHeader>
          <CardTitle>Analytics Dashboard</CardTitle>
          <CardDescription>More detailed charts and reports coming soon.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            This section will contain various charts visualizing lead sources, conversion funnels, sales performance, and activity metrics.
            Integration with charting libraries like Recharts (already included via ShadCN) will be used here.
          </p>
          {/* Placeholder for charts */}
           <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border rounded-lg">
                    <h3 className="font-semibold mb-2">Lead Sources (Example)</h3>
                    {/* Chart placeholder */}
                    <div className="h-64 bg-muted rounded flex items-center justify-center">
                        <PieChart className="h-12 w-12 text-muted-foreground"/>
                    </div>
                    <pre className="mt-2 text-xs bg-slate-100 p-2 rounded overflow-auto">
                        {JSON.stringify(leadSourceData, null, 2)}
                    </pre>
                </div>
                <div className="p-4 border rounded-lg">
                    <h3 className="font-semibold mb-2">Conversion Funnel (Example)</h3>
                     {/* Chart placeholder */}
                    <div className="h-64 bg-muted rounded flex items-center justify-center">
                        <BarChart className="h-12 w-12 text-muted-foreground"/>
                    </div>
                     <pre className="mt-2 text-xs bg-slate-100 p-2 rounded overflow-auto">
                        {JSON.stringify(conversionFunnelData, null, 2)}
                    </pre>
                </div>
           </div>
        </CardContent>
      </Card>
    </div>
  );
}
