// src/app/(app)/contacts/[id]/page.tsx
'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/components/providers/auth-provider';
import { collection, doc, getDoc, FirestoreError } from 'firebase/firestore';
import { Contact } from '@/types/contact';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ArrowLeft } from 'lucide-react';
import { db } from '@/lib/firebase';

export default function ContactDetailsPage() {
  const [contact, setContact] = useState<Contact | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const contactId = params.id as string;
  const { toast } = useToast();
  const t = useTranslations('ContactDetailsPage');
  const tGeneric = useTranslations('Generic');

  React.useEffect(() => {
    const fetchContact = async () => {
      if (!user || !contactId) {
        setLoading(false);
        return;
      }

      try {
        const companyId = user.uid;
        const contactRef = doc(db, 'companies', companyId, 'contacts', contactId);
        const docSnap = await getDoc(contactRef);

        if (docSnap.exists()) {
          setContact({ id: docSnap.id, ...docSnap.data() } as Contact);
        } else {
          toast({
            variant: 'destructive',
            title: t('notFoundTitle'),
            description: t('notFoundDescription'),
          });
          router.push('/contacts');
        }
      } catch (error) {
        const firestoreError = error as FirestoreError;
        toast({
          variant: 'destructive',
          title: t('loadingErrorTitle'),
          description: firestoreError.message || tGeneric('unexpectedError'),
        });
      } finally {
        setLoading(false);
      }
    };

    fetchContact();
  }, [user, contactId, router, toast, t, tGeneric]);

  if (loading) {
    return (
      <div className="container mx-auto py-10">
        <div className="flex items-center space-x-4 mb-8">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="h-8 w-48 bg-gray-200 animate-pulse rounded"></div>
        </div>
        <Card>
          <CardHeader>
            <div className="h-6 w-32 bg-gray-200 animate-pulse rounded mb-2"></div>
            <div className="h-4 w-24 bg-gray-200 animate-pulse rounded"></div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-4 w-full bg-gray-200 animate-pulse rounded"></div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!contact) {
    return (
      <div className="container mx-auto py-10">
        <div className="flex items-center space-x-4 mb-8">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-3xl font-bold">{t('notFoundTitle')}</h1>
        </div>
        <Card>
          <CardContent className="py-8">
            <p className="text-center text-muted-foreground">{t('notFoundDescription')}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10">
      <div className="flex items-center space-x-4 mb-8">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-3xl font-bold">{contact.name}</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('detailsTitle')}</CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline">{contact.type}</Badge>
            {contact.score !== undefined && (
              <Badge
                variant={
                  contact.score >= 70
                    ? 'default'
                    : contact.score >= 40
                      ? 'secondary'
                      : 'destructive'
                }
              >
                {t('score')}: {contact.score}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div>
              <h3 className="font-semibold mb-1">{t('contactInfo')}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">{t('email')}</p>
                  <p>{contact.email || tGeneric('na')}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t('phone')}</p>
                  <p>{contact.phone || tGeneric('na')}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t('jobTitle')}</p>
                  <p>{contact.jobTitle || tGeneric('na')}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t('timezone')}</p>
                  <p>{contact.timezone || tGeneric('na')}</p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-1">{t('tags')}</h3>
              <div className="flex flex-wrap gap-1">
                {contact.tags && contact.tags.length > 0 ? (
                  contact.tags.map(tag => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))
                ) : (
                  <p className="text-muted-foreground">{t('noTags')}</p>
                )}
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-1">{t('lastCommunication')}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">{t('lastCommDate')}</p>
                  <p>
                    {contact.lastCommunicationDate
                      ? format(new Date(contact.lastCommunicationDate.seconds * 1000), 'PPP')
                      : tGeneric('na')}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t('lastCommMethod')}</p>
                  <p>{contact.lastCommunicationMethod || tGeneric('na')}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t('communicatedBy')}</p>
                  <p>{contact.communicatedBy || tGeneric('na')}</p>
                </div>
              </div>
            </div>

            {contact.communicationSummary && (
              <div>
                <h3 className="font-semibold mb-1">{t('commSummary')}</h3>
                <p className="whitespace-pre-wrap">{contact.communicationSummary}</p>
              </div>
            )}

            {contact.scoreJustification && (
              <div>
                <h3 className="font-semibold mb-1">{t('scoreJustification')}</h3>
                <p className="whitespace-pre-wrap">{contact.scoreJustification}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
