// src/app/(app)/support/page.tsx
'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useTranslations } from 'next-intl'; // Import useTranslations
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { LifeBuoy, BookOpen, MessageSquare } from 'lucide-react';

export default function SupportPage() {
  const t = useTranslations('SupportPage');

  // Placeholder state and handlers
  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    // TODO: Implement support ticket submission logic (e.g., send email, API call)
    alert(t('submitSuccessMessage')); // Use translated message
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-semibold flex items-center gap-2">
        <LifeBuoy className="h-6 w-6 text-primary" /> {t('title')}
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* FAQ/Knowledge Base Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" /> {t('knowledgeBaseTitle')}
            </CardTitle>
            <CardDescription>{t('knowledgeBaseDescription')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input placeholder={t('searchPlaceholder')} />
            {/* Placeholder Links */}
            <ul className="space-y-1 text-sm text-primary underline">
              <li>
                <a href="#" onClick={e => e.preventDefault()}>
                  {t('gettingStartedLink')}
                </a>
              </li>
              <li>
                <a href="#" onClick={e => e.preventDefault()}>
                  {t('managingContactsLink')}
                </a>
              </li>
              <li>
                <a href="#" onClick={e => e.preventDefault()}>
                  {t('aiScoringLink')}
                </a>
              </li>
              <li>
                <a href="#" onClick={e => e.preventDefault()}>
                  {t('billingLink')}
                </a>
              </li>
            </ul>
            <Button variant="outline" className="w-full" disabled>
              {t('browseArticlesButton')}
            </Button>
          </CardContent>
        </Card>

        {/* Contact Support Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" /> {t('contactSupportTitle')}
            </CardTitle>
            <CardDescription>{t('contactSupportDescription')}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="support-subject">{t('subjectLabel')}</Label>
                <Input id="support-subject" placeholder={t('subjectPlaceholder')} required />
              </div>
              <div>
                <Label htmlFor="support-message">{t('messageLabel')}</Label>
                <Textarea
                  id="support-message"
                  placeholder={t('messagePlaceholder')}
                  rows={5}
                  required
                />
              </div>
              <Button type="submit" className="w-full">
                {t('submitButton')}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Additional Info (Optional) */}
      <Card>
        <CardHeader>
          <CardTitle>{t('additionalResourcesTitle')}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{t('additionalResourcesDescription')}</p>
        </CardContent>
      </Card>
    </div>
  );
}
