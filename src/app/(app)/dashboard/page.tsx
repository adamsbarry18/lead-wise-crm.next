'use client';

import { useTranslations } from 'next-intl';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart';
import {
  Users,
  TrendingUp,
  CheckSquare,
  Calendar,
  Mail,
  Activity,
  AlertTriangle,
} from 'lucide-react';
import { useAuth } from '@/components/providers/auth-provider';
import { useQuery } from '@tanstack/react-query';
import { Contact } from '@/types/contact';
import { collection, getDocs, query, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import React, { useMemo } from 'react';
import { format, subDays } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';

// Mock data (will be replaced by Firebase data)
const totalContacts = 1256;
const newLeads = 184;
const conversionRate = 15.2;

const activityData = [
  { name: 'Emails', value: 45 },
  { name: 'Calls', value: 30 },
  { name: 'Meetings', value: 15 },
  { name: 'Tasks', value: 10 },
];

const performanceData = [
  { date: 'Jan 24', sent: 400, calls: 240, meetings: 24 },
  { date: 'Feb 24', sent: 300, calls: 139, meetings: 30 },
  { date: 'Mar 24', sent: 200, calls: 980, meetings: 48 },
  { date: 'Apr 24', sent: 278, calls: 390, meetings: 39 },
  { date: 'May 24', sent: 189, calls: 480, meetings: 48 },
];

export default function DashboardPage() {
  const t = useTranslations('DashboardPage');
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
        // Manually convert Timestamps to Dates for client-side processing
        return {
          ...data,
          id: doc.id,
          createdAt: (data.createdAt as Timestamp)?.toDate(),
          updatedAt: (data.updatedAt as Timestamp)?.toDate(),
          lastCommunicationDate: (data.lastCommunicationDate as Timestamp)?.toDate(),
          lastScoredAt: (data.lastScoredAt as Timestamp)?.toDate(),
        } as Contact;
      });
      return fetchedContacts;
    },
    enabled: !!user,
  });

  const stats = useMemo(() => {
    if (!contacts) {
      return {
        totalContacts: 0,
        newLeads: 0,
        conversionRate: 0,
        activityData: [],
        performanceData: [],
      };
    }

    const totalContacts = contacts.length;

    const thirtyDaysAgo = subDays(new Date(), 30);
    const newLeads = contacts.filter(
      c => c.createdAt && c.createdAt > thirtyDaysAgo && (c.type === 'Lead' || c.type === 'MQL')
    ).length;

    const totalCustomers = contacts.filter(c => c.type === 'Customer').length;
    const conversionRate =
      totalContacts > 0 ? Math.round((totalCustomers / totalContacts) * 100) : 0;

    const activityCounts = contacts.reduce(
      (acc, contact) => {
        const method = contact.lastCommunicationMethod || t('activityUnknown');
        acc[method] = (acc[method] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );
    const activityData = Object.entries(activityCounts).map(([name, value]) => ({ name, value }));

    const performanceDataMap = contacts.reduce(
      (acc, contact) => {
        if (!contact.lastCommunicationDate) return acc;
        const commDate =
          contact.lastCommunicationDate instanceof Timestamp
            ? contact.lastCommunicationDate.toDate()
            : contact.lastCommunicationDate;
        const monthKey = format(commDate, 'yyyy-MM');

        if (!acc[monthKey]) {
          acc[monthKey] = {
            date: format(commDate, 'MMM yy'),
            sent: 0,
            calls: 0,
            meetings: 0,
          };
        }

        const method = contact.lastCommunicationMethod?.toLowerCase() || '';
        if (method.includes('email')) acc[monthKey].sent++;
        else if (method.includes('call') || method.includes('phone')) acc[monthKey].calls++;
        else if (method.includes('person') || method.includes('demo') || method.includes('meeting'))
          acc[monthKey].meetings++;
        return acc;
      },
      {} as Record<string, { date: string; sent: number; calls: number; meetings: number }>
    );

    const performanceData = Object.values(performanceDataMap).sort((a, b) =>
      a.date.localeCompare(b.date)
    );

    return { totalContacts, newLeads, conversionRate, activityData, performanceData };
  }, [contacts, t]);

  // Mock task data (as there's no task entity yet)
  const tasks = [
    { id: 1, text: t('mockTask1'), icon: CheckSquare, color: 'text-primary' },
    { id: 2, text: t('mockTask2'), icon: Calendar, color: 'text-blue-500' },
    { id: 3, text: t('mockTask3'), icon: Mail, color: 'text-green-500' },
  ];

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <h1 className="text-2xl font-semibold">{t('title')}</h1>
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-2/3" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-1/3" />
              <Skeleton className="h-3 w-full mt-2" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-2/3" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-1/3" />
              <Skeleton className="h-3 w-full mt-2" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-2/3" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-1/3" />
              <Skeleton className="h-3 w-full mt-2" />
            </CardContent>
          </Card>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-1/2" />
              <Skeleton className="h-4 w-3/4 mt-2" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-[300px] w-full" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-1/2" />
              <Skeleton className="h-4 w-3/4 mt-2" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-[300px] w-full" />
            </CardContent>
          </Card>
        </div>
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

      {/* Global Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('totalContactsCardTitle')}</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalContacts}</div>
            <p className="text-xs text-muted-foreground">{t('totalContactsCardDescription')}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('newLeadsCardTitle')}</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+{stats.newLeads}</div>
            <p className="text-xs text-muted-foreground">{t('newLeadsCardDescription')}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('conversionRateCardTitle')}</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.conversionRate}%</div>
            <p className="text-xs text-muted-foreground">{t('conversionRateCardDescription')}</p>
          </CardContent>
        </Card>
      </div>

      {/* Activity Performance */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t('activityOverviewCardTitle')}</CardTitle>
            <CardDescription>{t('activityOverviewCardDescription')}</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ChartContainer config={{ activity: {} }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={stats.activityData}
                  margin={{ top: 5, right: 20, left: -20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="name"
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={value => `${value}`}
                  />
                  <Tooltip
                    cursor={{ fill: 'hsl(var(--muted))', radius: 4 }}
                    content={<ChartTooltipContent hideLabel />}
                  />
                  <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('performanceTrendCardTitle')}</CardTitle>
            <CardDescription>{t('performanceTrendCardDescription')}</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ChartContainer config={{ performance: {} }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={stats.performanceData}
                  margin={{ top: 5, right: 20, left: -20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="date"
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    cursor={{ stroke: 'hsl(var(--border))', strokeWidth: 1.5 }}
                    content={<ChartTooltipContent indicator="line" />}
                  />
                  <Line
                    type="monotone"
                    dataKey="sent"
                    stroke="hsl(var(--chart-1))"
                    strokeWidth={2}
                    dot={false}
                    name="Emails Sent"
                  />
                  <Line
                    type="monotone"
                    dataKey="calls"
                    stroke="hsl(var(--chart-2))"
                    strokeWidth={2}
                    dot={false}
                    name="Calls Made"
                  />
                  <Line
                    type="monotone"
                    dataKey="meetings"
                    stroke="hsl(var(--chart-3))"
                    strokeWidth={2}
                    dot={false}
                    name="Meetings"
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Tasks */}
      <Card>
        <CardHeader>
          <CardTitle>{t('upcomingTasksCardTitle')}</CardTitle>
          <CardDescription>{t('upcomingTasksCardDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {tasks.map(task => (
              <li key={task.id} className="flex items-center gap-2 text-sm">
                <task.icon className={`h-4 w-4 ${task.color}`} />
                {task.text}
              </li>
            ))}
          </ul>
          <p className="text-sm text-muted-foreground mt-4">{t('moreTasks', { count: 5 })}</p>
        </CardContent>
      </Card>
    </div>
  );
}
