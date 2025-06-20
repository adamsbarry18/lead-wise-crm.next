'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Users, TrendingUp, Mail, Phone, Calendar, CheckSquare } from 'lucide-react';
import { useTranslations } from 'next-intl'; // Import useTranslations
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  LineChart,
  Line,
} from 'recharts';
import { ChartTooltipContent } from '@/components/ui/chart'; // Import ChartTooltipContent
import { ChartContainer } from '@/components/ui/chart'; // Import ChartContainer

// Mock data - replace with actual data fetching
const totalContacts = 1250;
const newLeads = 45;
const conversionRate = 15.3;

const activityData = [
  { name: 'Emails', value: 350 },
  { name: 'Calls', value: 120 },
  { name: 'Meetings', value: 55 },
  { name: 'Tasks', value: 210 },
];

const performanceData = [
  { date: 'Week 1', sent: 80, calls: 25, meetings: 10, tasks: 50 },
  { date: 'Week 2', sent: 95, calls: 30, meetings: 12, tasks: 60 },
  { date: 'Week 3', sent: 110, calls: 35, meetings: 15, tasks: 70 },
  { date: 'Week 4', sent: 120, calls: 40, meetings: 18, tasks: 80 },
];

export default function DashboardPage() {
  const t = useTranslations('DashboardPage');
  // TODO: Fetch actual data from Firebase

  // Mock task data (consider translating these if they become dynamic)
  const tasks = [
    { id: 1, text: 'Follow up with Acme Corp', icon: CheckSquare, color: 'text-primary' },
    { id: 2, text: 'Schedule demo for Beta Industries', icon: Calendar, color: 'text-blue-500' },
    { id: 3, text: 'Send proposal to Gamma Solutions', icon: Mail, color: 'text-green-500' },
  ];

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
            <div className="text-2xl font-bold">{totalContacts}</div>
            <p className="text-xs text-muted-foreground">{t('totalContactsCardDescription')}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('newLeadsCardTitle')}</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+{newLeads}</div>
            <p className="text-xs text-muted-foreground">{t('newLeadsCardDescription')}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('conversionRateCardTitle')}</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{conversionRate}%</div>
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
                <BarChart data={activityData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
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
                  data={performanceData}
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
                  {/* Consider translating series names if needed */}
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
                  <Line
                    type="monotone"
                    dataKey="tasks"
                    stroke="hsl(var(--chart-4))"
                    strokeWidth={2}
                    dot={false}
                    name="Tasks Completed"
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
          {/* Placeholder content - Replace with actual task list */}
          <ul className="space-y-2">
            {tasks.map(task => (
              <li key={task.id} className="flex items-center gap-2 text-sm">
                <task.icon className={`h-4 w-4 ${task.color}`} />
                {task.text} {/* Note: Task text is currently hardcoded */}
              </li>
            ))}
          </ul>
          <p className="text-sm text-muted-foreground mt-4">{t('moreTasks')}</p>
        </CardContent>
      </Card>
    </div>
  );
}
