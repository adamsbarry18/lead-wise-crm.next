'use client';

import React, { useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import {
  BarChart as BarChartIcon,
  PieChart as PieChartIcon,
  TrendingDown,
  Users,
  AlertTriangle,
  Info,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
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
  Legend,
} from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { Contact } from '@/types/contact';
import { collection, getDocs, query, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/components/providers/auth-provider';
import { differenceInDays, subDays } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#a4de6c', '#d0ed57', '#ffc658'];

export default function AnalyticsPage() {
  const t = useTranslations('AnalyticsPage');
  const { user } = useAuth();

  const {
    data: contacts,
    isLoading,
    error,
  } = useQuery<Contact[]>({
    queryKey: ['contacts', user?.uid],
    queryFn: async () => {
      if (!user) return [];
      const contactsRef = collection(db, 'companies', user.uid, 'contacts');
      const q = query(contactsRef);
      const querySnapshot = await getDocs(q);
      const fetchedContacts = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          ...data,
          id: doc.id,
          createdAt: (data.createdAt as Timestamp)?.toDate(),
          updatedAt: (data.updatedAt as Timestamp)?.toDate(),
          lastCommunicationDate: (data.lastCommunicationDate as Timestamp)?.toDate(),
        } as Contact;
      });
      return fetchedContacts;
    },
    enabled: !!user,
  });

  const stats = useMemo(() => {
    if (!contacts) {
      return {
        avgSalesCycle: 0,
        leadVelocity: { rate: 0, change: 0 },
        topLeadSource: { source: t('noData'), percentage: 0 },
        leadSourceData: [],
        conversionFunnelData: [],
      };
    }

    // Avg Sales Cycle
    const customers = contacts.filter(c => c.type === 'Customer' && c.createdAt && c.updatedAt);
    const totalCycleDays = customers.reduce((sum, c) => {
      // Ensure dates are JS Date objects before calculating difference
      const createdAtDate =
        c.createdAt! instanceof Timestamp ? c.createdAt!.toDate() : c.createdAt!;
      const updatedAtDate =
        c.updatedAt! instanceof Timestamp ? c.updatedAt!.toDate() : c.updatedAt!;
      return sum + differenceInDays(updatedAtDate, createdAtDate);
    }, 0);
    const avgSalesCycle = customers.length > 0 ? Math.round(totalCycleDays / customers.length) : 0;

    // Lead Velocity
    const thirtyDaysAgo = subDays(new Date(), 30);
    const sixtyDaysAgo = subDays(new Date(), 60);
    const newLeadsLast30 = contacts.filter(
      c => c.createdAt && c.createdAt > thirtyDaysAgo && (c.type === 'Lead' || c.type === 'MQL')
    ).length;
    const newLeadsPrev30 = contacts.filter(
      c =>
        c.createdAt &&
        c.createdAt > sixtyDaysAgo &&
        c.createdAt <= thirtyDaysAgo &&
        (c.type === 'Lead' || c.type === 'MQL')
    ).length;
    const leadVelocityChange =
      newLeadsPrev30 > 0
        ? Math.round(((newLeadsLast30 - newLeadsPrev30) / newLeadsPrev30) * 100)
        : newLeadsLast30 > 0
          ? 100
          : 0;

    // Lead Sources from Tags (e.g., "source:website")
    const leadSources = contacts.reduce(
      (acc, c) => {
        const sourceTag = c.tags?.find(tag => tag.startsWith('source:'));
        const source = sourceTag ? sourceTag.split(':')[1] : t('unknownSource');
        acc[source] = (acc[source] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );
    const leadSourceData = Object.entries(leadSources)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    const topLeadSource =
      leadSourceData.length > 0
        ? {
            source: leadSourceData[0].name,
            percentage: Math.round((leadSourceData[0].value / contacts.length) * 100),
          }
        : { source: t('noData'), percentage: 0 };

    // Conversion Funnel
    const funnelStages = ['Prospect', 'Lead', 'MQL', 'Customer'];
    const conversionFunnelData = funnelStages.map(stage => ({
      stage,
      count: contacts.filter(c => c.type === stage).length,
    }));

    return {
      avgSalesCycle,
      leadVelocity: { rate: newLeadsLast30, change: leadVelocityChange },
      topLeadSource,
      leadSourceData,
      conversionFunnelData,
    };
  }, [contacts, t]);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <h1 className="text-2xl font-semibold">{t('title')}</h1>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-2/3" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-1/3" />
                <Skeleton className="h-3 w-full mt-2" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-1/2" />
            <Skeleton className="h-4 w-3/4 mt-2" />
          </CardHeader>
          <CardContent>
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <Skeleton className="h-[300px] w-full" />
              <Skeleton className="h-[300px] w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (contacts && contacts.length === 0) {
    return (
      <div className="flex flex-col gap-6">
        <h1 className="text-2xl font-semibold">{t('title')}</h1>
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>{t('noDataCard.title')}</AlertTitle>
          <AlertDescription>
            {t('noDataCard.description')}
            <Button asChild variant="link" className="p-0 h-auto ml-1">
              <Link href="/contacts">{t('noDataCard.link')}</Link>
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="flex flex-col items-center justify-center h-64 gap-4 bg-destructive/10 border-destructive/50">
        <CardHeader className="flex-row items-center gap-4">
          <AlertTriangle className="h-12 w-12 text-destructive" />
          <CardTitle>{t('errorTitle')}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">{t('errorDescription')}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">{t('title')}</h1>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* KPI Cards */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('avgSalesCycleCardTitle')}</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {t('avgSalesCycleCardValue', { days: stats.avgSalesCycle })}
            </div>
            <p className="text-xs text-muted-foreground">{t('avgSalesCycleCardDescription')}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('leadVelocityCardTitle')}</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {t('leadVelocityCardValue', { rate: stats.leadVelocity.rate })}
            </div>
            <p className="text-xs text-muted-foreground">
              {t('leadVelocityCardChange', { change: stats.leadVelocity.change })}%{' '}
              {t('vsLastMonth')}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('topLeadSourceCardTitle')}</CardTitle>
            <PieChartIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {t('topLeadSourceCardValue', { source: stats.topLeadSource.source })}
            </div>
            <p className="text-xs text-muted-foreground">
              {t('topLeadSourceCardDescription', { percentage: stats.topLeadSource.percentage })}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('conversionFunnelExampleTitle')}
            </CardTitle>
            <BarChartIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {t('totalCustomers', {
                count: stats.conversionFunnelData.find(s => s.stage === 'Customer')?.count || 0,
              })}
            </div>
            <p className="text-xs text-muted-foreground">{t('totalCustomersDescription')}</p>
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
          {/* Charts */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold mb-2">{t('leadSourcesExampleTitle')}</h3>
              <div className="h-64 rounded flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stats.leadSourceData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {stats.leadSourceData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold mb-2">{t('conversionFunnelExampleTitle')}</h3>
              <div className="h-64 rounded flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={stats.conversionFunnelData}
                    layout="vertical"
                    margin={{ left: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="stage" type="category" width={80} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="count" fill="#82ca9d" name={t('contactCountLegend')} />
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
