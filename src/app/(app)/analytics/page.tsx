'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { BarChart, PieChart, TrendingDown, Users } from 'lucide-react';
import { useTranslations } from 'next-intl'; // Import useTranslations

export default function AnalyticsPage() {
  const t = useTranslations('AnalyticsPage');

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
      <h1 className="text-2xl font-semibold">{t('title')}</h1>

       <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {/* Placeholder KPI Cards - Using translation keys */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t('avgSalesCycleCardTitle')}</CardTitle>
                 <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                 {/* Placeholder values passed to translation */}
                <div className="text-2xl font-bold">{t('avgSalesCycleCardValue', { days: 45 })}</div>
                 <p className="text-xs text-muted-foreground">{t('avgSalesCycleCardChange', { change: '+2' })}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t('leadVelocityCardTitle')}</CardTitle>
                 <TrendingDown className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                 {/* Placeholder values passed to translation */}
                <div className="text-2xl font-bold">{t('leadVelocityCardValue', { rate: '8.2' })}</div>
                <p className="text-xs text-muted-foreground">{t('leadVelocityCardChange', { change: '-1.5' })}</p>
              </CardContent>
            </Card>
             <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t('topLeadSourceCardTitle')}</CardTitle>
                 <PieChart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                 {/* Placeholder values passed to translation */}
                <div className="text-2xl font-bold">{t('topLeadSourceCardValue', { source: 'Website' })}</div>
                 <p className="text-xs text-muted-foreground">{t('topLeadSourceCardDescription', { percentage: 40 })}</p>
              </CardContent>
            </Card>
             <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t('activityScoreCardTitle')}</CardTitle>
                 <BarChart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                 {/* Placeholder values passed to translation */}
                <div className="text-2xl font-bold">{t('activityScoreCardValue', { score: 78 })}</div>
                 <p className="text-xs text-muted-foreground">{t('activityScoreCardDescription')}</p>
              </CardContent>
            </Card>
       </div>


      <Card>
        <CardHeader>
          <CardTitle>{t('dashboardCardTitle')}</CardTitle>
          <CardDescription>{t('dashboardCardDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            {t('dashboardContent')}
          </p>
          {/* Placeholder for charts */}
           <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border rounded-lg">
                    <h3 className="font-semibold mb-2">{t('leadSourcesExampleTitle')}</h3>
                    {/* Chart placeholder */}
                    <div className="h-64 bg-muted rounded flex items-center justify-center">
                        <PieChart className="h-12 w-12 text-muted-foreground"/>
                    </div>
                    <pre className="mt-2 text-xs bg-slate-100 p-2 rounded overflow-auto">
                        {JSON.stringify(leadSourceData, null, 2)}
                    </pre>
                </div>
                <div className="p-4 border rounded-lg">
                    <h3 className="font-semibold mb-2">{t('conversionFunnelExampleTitle')}</h3>
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
