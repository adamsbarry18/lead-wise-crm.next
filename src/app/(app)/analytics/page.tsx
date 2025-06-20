'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import {
  BarChart as BarChartIcon,
  PieChart as PieChartIcon,
  TrendingDown,
  Users,
} from 'lucide-react';
import { useTranslations } from 'next-intl'; // Import useTranslations
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

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

  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042'];

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
            <p className="text-xs text-muted-foreground">
              {t('avgSalesCycleCardChange', { change: '+2' })}
            </p>
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
            <p className="text-xs text-muted-foreground">
              {t('leadVelocityCardChange', { change: '-1.5' })}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('topLeadSourceCardTitle')}</CardTitle>
            <PieChartIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {/* Placeholder values passed to translation */}
            <div className="text-2xl font-bold">
              {t('topLeadSourceCardValue', { source: 'Website' })}
            </div>
            <p className="text-xs text-muted-foreground">
              {t('topLeadSourceCardDescription', { percentage: 40 })}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('activityScoreCardTitle')}</CardTitle>
            <BarChartIcon className="h-4 w-4 text-muted-foreground" />
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
          <p className="text-muted-foreground">{t('dashboardContent')}</p>
          {/* Placeholder for charts */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold mb-2">{t('leadSourcesExampleTitle')}</h3>
              {/* PieChart Recharts */}
              <div className="h-64 bg-muted rounded flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={leadSourceData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      label
                    >
                      {leadSourceData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold mb-2">{t('conversionFunnelExampleTitle')}</h3>
              {/* BarChart Recharts */}
              <div className="h-64 bg-muted rounded flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={conversionFunnelData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="stage" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
