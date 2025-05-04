// src/app/(app)/support/page.tsx
'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { LifeBuoy, BookOpen, MessageSquare } from 'lucide-react';

export default function SupportPage() {
  // Placeholder state and handlers
  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    // TODO: Implement support ticket submission logic (e.g., send email, API call)
    alert('Support request submitted (placeholder).');
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-semibold flex items-center gap-2">
        <LifeBuoy className="h-6 w-6 text-primary" /> Support Center
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* FAQ/Knowledge Base Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" /> Knowledge Base & FAQs
            </CardTitle>
            <CardDescription>Find answers to common questions and learn how to use LeadWise CRM effectively.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input placeholder="Search documentation..." />
            {/* Placeholder Links */}
            <ul className="space-y-1 text-sm text-primary underline">
              <li><a href="#" onClick={(e) => e.preventDefault()}>Getting Started Guide</a></li>
              <li><a href="#" onClick={(e) => e.preventDefault()}>Managing Contacts</a></li>
              <li><a href="#" onClick={(e) => e.preventDefault()}>Understanding AI Scoring</a></li>
              <li><a href="#" onClick={(e) => e.preventDefault()}>Billing & Plans</a></li>
            </ul>
             <Button variant="outline" className="w-full" disabled>Browse All Articles (Coming Soon)</Button>
          </CardContent>
        </Card>

        {/* Contact Support Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" /> Contact Support
            </CardTitle>
            <CardDescription>Can't find what you need? Submit a support request.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="support-subject">Subject</Label>
                <Input id="support-subject" placeholder="e.g., Issue with contact import" required />
              </div>
              <div>
                <Label htmlFor="support-message">Describe your issue</Label>
                <Textarea id="support-message" placeholder="Please provide as much detail as possible..." rows={5} required />
              </div>
              <Button type="submit" className="w-full">Submit Request</Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Additional Info (Optional) */}
       <Card>
          <CardHeader>
            <CardTitle>Additional Resources</CardTitle>
          </CardHeader>
          <CardContent>
              <p className="text-sm text-muted-foreground">
                Check our status page for service updates or join the community forum (links coming soon).
              </p>
          </CardContent>
       </Card>

    </div>
  );
}
