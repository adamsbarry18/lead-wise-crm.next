'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Users, TrendingUp, Mail, Phone, Calendar, CheckSquare } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, LineChart, Line } from 'recharts';
import { ChartTooltipContent } from "@/components/ui/chart"; // Import ChartTooltipContent
import { ChartContainer } from "@/components/ui/chart"; // Import ChartContainer

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
  // TODO: Fetch actual data from Firebase

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Dashboard</h1>

      {/* Global Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Contacts</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalContacts}</div>
            <p className="text-xs text-muted-foreground">All contacts in the system</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">New Leads (Last 30d)</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" /> {/* Using Users again, consider a more specific icon if available */}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+{newLeads}</div>
            <p className="text-xs text-muted-foreground">Recently added prospects</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate (Avg)</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{conversionRate}%</div>
            <p className="text-xs text-muted-foreground">From lead to customer</p>
          </CardContent>
        </Card>
      </div>

      {/* Activity Performance */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Activity Overview (Last 30 days)</CardTitle>
            <CardDescription>Summary of key sales activities.</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ChartContainer config={{ activity: {} }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={activityData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`} />
                  <Tooltip
                    cursor={{ fill: 'hsl(var(--muted))', radius: 4 }}
                    content={<ChartTooltipContent hideLabel />} // Use ShadCN tooltip
                  />
                  <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
           <CardHeader>
             <CardTitle>Performance Trend (Last 4 Weeks)</CardTitle>
             <CardDescription>Activity volume over time.</CardDescription>
           </CardHeader>
           <CardContent className="h-[300px]">
             <ChartContainer config={{ performance: {} }}>
               <ResponsiveContainer width="100%" height="100%">
                 <LineChart data={performanceData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                   <CartesianGrid strokeDasharray="3 3" vertical={false}/>
                   <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                   <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                   <Tooltip
                      cursor={{ stroke: 'hsl(var(--border))', strokeWidth: 1.5 }}
                      content={<ChartTooltipContent indicator="line" />} // Use ShadCN tooltip
                   />
                   <Line type="monotone" dataKey="sent" stroke="hsl(var(--chart-1))" strokeWidth={2} dot={false} name="Emails Sent" />
                   <Line type="monotone" dataKey="calls" stroke="hsl(var(--chart-2))" strokeWidth={2} dot={false} name="Calls Made" />
                   <Line type="monotone" dataKey="meetings" stroke="hsl(var(--chart-3))" strokeWidth={2} dot={false} name="Meetings" />
                    <Line type="monotone" dataKey="tasks" stroke="hsl(var(--chart-4))" strokeWidth={2} dot={false} name="Tasks Completed" />
                 </LineChart>
               </ResponsiveContainer>
             </ChartContainer>
           </CardContent>
         </Card>
      </div>

      {/* Recent Activity Feed or Task List (Placeholder) */}
       <Card>
         <CardHeader>
           <CardTitle>Upcoming Tasks</CardTitle>
            <CardDescription>Your immediate follow-ups and actions.</CardDescription>
         </CardHeader>
         <CardContent>
           {/* Placeholder content - Replace with actual task list */}
           <ul className="space-y-2">
             <li className="flex items-center gap-2 text-sm"> <CheckSquare className="h-4 w-4 text-primary"/> Follow up with Acme Corp</li>
             <li className="flex items-center gap-2 text-sm"> <Calendar className="h-4 w-4 text-blue-500"/> Schedule demo for Beta Industries</li>
             <li className="flex items-center gap-2 text-sm"> <Mail className="h-4 w-4 text-green-500"/> Send proposal to Gamma Solutions</li>
           </ul>
           <p className="text-sm text-muted-foreground mt-4">More tasks...</p>
         </CardContent>
       </Card>

    </div>
  );
}

