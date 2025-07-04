// src/app/(app)/contacts/[id]/page.tsx
'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Contact } from '@/types/contact';
import { useAuth } from '@/components/providers/auth-provider';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ArrowLeft,
  Edit,
  Trash2,
  Mail,
  Phone,
  Calendar,
  MessageSquare,
  Zap,
  BrainCircuit,
} from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { scoreLead } from '@/ai/flows/score-lead';
import { generateSalesStrategyForContact } from '@/ai/flows/generate-sales-strategy';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useLocale, useTranslations } from 'next-intl';
import { safeFormatTimestamp, safeTimestampToDate } from '@/lib/utils';

// Type for Sales Strategy Result (consider moving to types)
interface SalesStrategyResult {
  emailSequences: string[];
  followUps: string[];
  priorities: string[];
}

export default function ContactDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const contactId = params.id as string;
  const t = useTranslations('ContactDetailsPage');
  const tGeneric = useTranslations('Generic');
  const locale = useLocale();

  const [strategySheetOpen, setStrategySheetOpen] = useState(false);
  const [strategyResult, setStrategyResult] = useState<SalesStrategyResult | null>(null);
  const [isGeneratingStrategy, setIsGeneratingStrategy] = useState(false);
  const [isScoring, setIsScoring] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Fetch contact details
  const {
    data: contact,
    isLoading,
    error,
  } = useQuery<Contact | null>({
    queryKey: ['contact', contactId, user?.uid],
    queryFn: async () => {
      if (!user || !contactId) return null;
      const companyId = user.uid; // Replace with actual company ID logic
      const contactRef = doc(db, 'companies', companyId, 'contacts', contactId);
      const contactSnap = await getDoc(contactRef);
      if (contactSnap.exists()) {
        return { id: contactSnap.id, ...contactSnap.data() } as Contact;
      }
      return null;
    },
    enabled: !!user && !!contactId,
  });

  // --- Mutations ---
  const updateScoreMutation = useMutation({
    mutationFn: async ({ score, justification }: { score: number; justification: string }) => {
      if (!user || !contactId) throw new Error(t('missingUserOrContactError'));
      const companyId = user.uid;
      const contactRef = doc(db, 'companies', companyId, 'contacts', contactId);
      await updateDoc(contactRef, {
        score: score,
        scoreJustification: justification,
        lastScoredAt: new Date(),
      });
      return { score, justification };
    },
    onSuccess: data => {
      queryClient.invalidateQueries({ queryKey: ['contact', contactId, user?.uid] });
      queryClient.invalidateQueries({ queryKey: ['contacts', user?.uid] }); // Invalidate list view too
      toast({
        title: t('scoreUpdateSuccessTitle'),
        description: t('scoreUpdateSuccessDescription', { score: data.score }),
      });
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: t('scoreUpdateFailedTitle'),
        description: error.message,
      });
    },
    onSettled: () => setIsScoring(false),
  });

  const deleteContactMutation = useMutation({
    mutationFn: async () => {
      if (!user || !contactId) throw new Error(t('missingUserOrContactError'));
      const companyId = user.uid;
      const contactRef = doc(db, 'companies', companyId, 'contacts', contactId);
      await deleteDoc(contactRef);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts', user?.uid] });
      toast({ title: t('deleteSuccessTitle'), description: t('deleteSuccessDescription') });
      router.push('/contacts'); // Redirect after deletion
    },
    onError: (error: any) => {
      toast({ variant: 'destructive', title: t('deleteFailedTitle'), description: error.message });
    },
    onSettled: () => setShowDeleteConfirm(false),
  });

  // --- Handlers ---
  const handleScoreContact = async () => {
    if (!contact) return;
    setIsScoring(true);
    try {
      const scoreInput = {
        engagement: contact.lastCommunicationMethod || 'N/A',
        exchanges: contact.communicationSummary || t('noSummary'),
        history: `Last contacted: ${safeFormatTimestamp(
          contact.lastCommunicationDate,
          'PPP',
          'N/A'
        )}`,
        otherCriteria: `${t('type')}: ${contact.type}, ${t('tags')}: ${
          contact.tags?.join(', ') || t('noTags')
        }`,
        locale: locale,
      };
      const result = await scoreLead(scoreInput);
      if (result && typeof result.score === 'number') {
        await updateScoreMutation.mutateAsync({
          score: result.score,
          justification: result.justification,
        });
      } else {
        throw new Error(t('invalidAIScoreError'));
      }
    } catch (error: any) {
      console.error('Scoring error:', error);
      toast({
        variant: 'destructive',
        title: t('scoreUpdateFailedTitle'),
        description: error.message || t('scoreUpdateFailedDescription'),
      });
      setIsScoring(false); // Ensure loading state is reset on error
    }
  };

  const handleGenerateStrategy = async () => {
    if (!contact) return;
    setStrategySheetOpen(true);
    setIsGeneratingStrategy(true);
    setStrategyResult(null);
    try {
      const strategyInput = {
        contactSummary: contact.communicationSummary || t('noSummary'),
        locale: locale,
      };
      const result = await generateSalesStrategyForContact(strategyInput);
      if (result && result.salesStrategy) {
        setStrategyResult(result.salesStrategy);
      } else {
        throw new Error(t('invalidAIStrategyError'));
      }
    } catch (error: any) {
      console.error('Strategy generation error:', error);
      toast({
        variant: 'destructive',
        title: t('strategyGenFailedTitle'),
        description: error.message || t('strategyGenFailedDescription'),
      });
    } finally {
      setIsGeneratingStrategy(false);
    }
  };

  const handleDeleteConfirm = () => {
    deleteContactMutation.mutate();
  };

  // --- Rendering ---
  if (isLoading) {
    return (
      <div className="space-y-4 max-w-3xl mx-auto p-4">
        <Skeleton className="h-8 w-1/4" />
        <Skeleton className="h-6 w-1/2" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <p className="text-red-500 text-center">
        {t('loadingErrorTitle')}: {(error as Error).message}
      </p>
    );
  }

  if (!contact) {
    return (
      <div className="text-center py-10">
        <p className="text-muted-foreground mb-4">{t('notFoundTitle')}</p>
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" /> {tGeneric('goBack')}
        </Button>
      </div>
    );
  }

  const displayValue = (value: any, fallback = 'N/A') => {
    if (value === undefined || value === null || value === '') return fallback;
    if (value instanceof Date) return format(value, 'PPP');
    // Handle Firestore Timestamp
    if (typeof value === 'object' && 'seconds' in value && 'nanoseconds' in value) {
      return safeFormatTimestamp(value, 'PPP p', 'N/A'); // Format date and time
    }
    if (Array.isArray(value)) return value.length > 0 ? value.join(', ') : fallback;
    return String(value);
  };

  const renderStrategyList = (title: string, items: string[]) => {
    if (!items || items.length === 0) return null;
    return (
      <div>
        <h3 className="font-semibold mb-1">{title}</h3>
        <ul className="list-disc list-inside space-y-1 text-sm">
          {items.map((item, i) => (
            <li key={`${title}-${i}`}>{item}</li>
          ))}
        </ul>
      </div>
    );
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="-ml-2">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => router.push(`/contacts/edit/${contact.id}`)}>
            <Edit className="mr-2 h-4 w-4" /> {tGeneric('edit')}
          </Button>
          <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">
                <Trash2 className="mr-2 h-4 w-4" /> {tGeneric('delete')}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t('deleteConfirmTitle')}</AlertDialogTitle>
                <AlertDialogDescription>
                  {t('deleteConfirmDescription', { name: contact.fullName })}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={deleteContactMutation.isPending}>
                  {tGeneric('cancel')}
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteConfirm}
                  disabled={deleteContactMutation.isPending}
                  className="bg-destructive hover:bg-destructive/90"
                >
                  {deleteContactMutation.isPending
                    ? tGeneric('deleting')
                    : t('confirmDeleteButton')}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Contact Info Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">{contact.fullName}</CardTitle>
              <CardDescription>{displayValue(contact.jobTitle, t('noJobTitle'))}</CardDescription>
            </div>
            <div className="text-right">
              <Badge
                variant={
                  contact.score && contact.score > 70
                    ? 'default'
                    : contact.score && contact.score > 40
                      ? 'secondary'
                      : 'outline'
                }
                className={`text-lg ${
                  contact.score && contact.score > 70
                    ? 'bg-green-500 text-white hover:bg-green-600'
                    : contact.score && contact.score > 40
                      ? 'bg-yellow-500 text-white hover:bg-yellow-600'
                      : ''
                }`}
              >
                {displayValue(contact.score, tGeneric('na'))}
              </Badge>
              <p className="text-xs text-muted-foreground">{t('leadScore')}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-1 mt-2">
            <Badge variant={contact.type === 'Customer' ? 'default' : 'secondary'}>
              {displayValue(contact.type)}
            </Badge>
            {contact.tags?.map(tag => (
              <Badge key={tag} variant="outline">
                {tag}
              </Badge>
            ))}
          </div>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 text-sm">
          <div className="flex items-start gap-2">
            <Mail className="h-4 w-4 mt-1 text-muted-foreground flex-shrink-0" />
            <div>
              <span className="font-medium">{t('email')}:</span>{' '}
              {contact.email ? (
                <a href={`mailto:${contact.email}`} className="text-primary hover:underline">
                  {contact.email}
                </a>
              ) : (
                displayValue(contact.email)
              )}
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Phone className="h-4 w-4 mt-1 text-muted-foreground flex-shrink-0" />
            <div>
              <span className="font-medium">{t('phone')}:</span>{' '}
              {contact.phone ? (
                <a href={`tel:${contact.phone}`} className="text-primary hover:underline">
                  {contact.phone}
                </a>
              ) : (
                displayValue(contact.phone)
              )}
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Calendar className="h-4 w-4 mt-1 text-muted-foreground flex-shrink-0" />
            <div>
              <span className="font-medium">{t('lastCommDate')}:</span>{' '}
              {displayValue(contact.lastCommunicationDate)}
            </div>
          </div>
          <div className="flex items-start gap-2">
            <MessageSquare className="h-4 w-4 mt-1 text-muted-foreground flex-shrink-0" />
            <div>
              <span className="font-medium">{t('lastCommMethod')}:</span>{' '}
              {displayValue(contact.lastCommunicationMethod)}
            </div>
          </div>
          <div className="flex items-start gap-2">
            <div>
              <span className="font-medium">{t('timezone')}:</span> {displayValue(contact.timezone)}
            </div>
          </div>
          <div className="flex items-start gap-2">
            <div>
              <span className="font-medium">{t('communicatedBy')}:</span>{' '}
              {displayValue(contact.communicatedBy)}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Communication Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle>{t('commSummary')}</CardTitle>
          {contact.lastScoredAt && (
            <CardDescription>
              {t('scoreJustification')}{' '}
              {`(${t('lastScored')}: ${safeFormatTimestamp(contact.lastScoredAt, 'PPP', 'N/A')}):`}{' '}
              {displayValue(contact.scoreJustification, t('noJustification'))}
            </CardDescription>
          )}
        </CardHeader>
        <CardContent>
          <p className="text-sm whitespace-pre-wrap">
            {displayValue(contact.communicationSummary, t('noSummary'))}
          </p>
        </CardContent>
      </Card>

      {/* AI Actions Card */}
      <Card>
        <CardHeader>
          <CardTitle>{t('aiAssistantTitle')}</CardTitle>
          <CardDescription>{t('aiAssistantDescription')}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row gap-4">
          <Button
            onClick={handleScoreContact}
            disabled={isScoring || updateScoreMutation.isPending}
            className="flex-1"
          >
            {isScoring || updateScoreMutation.isPending ? (
              <BrainCircuit className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <BrainCircuit className="mr-2 h-4 w-4" />
            )}
            {isScoring || updateScoreMutation.isPending
              ? t('recalculatingScore')
              : t('recalculateScore')}
          </Button>
          <Button
            onClick={handleGenerateStrategy}
            disabled={isGeneratingStrategy}
            className="flex-1"
          >
            {isGeneratingStrategy ? (
              <Zap className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Zap className="mr-2 h-4 w-4" />
            )}
            {isGeneratingStrategy ? t('generatingStrategy') : t('generateSalesStrategy')}
          </Button>
        </CardContent>
      </Card>

      {/* Sales Strategy Sheet */}
      <Sheet open={strategySheetOpen} onOpenChange={setStrategySheetOpen}>
        <SheetContent className="w-full sm:max-w-lg">
          <ScrollArea className="h-full pr-6">
            <SheetHeader>
              <SheetTitle>{t('strategySheetTitle', { name: contact.fullName })}</SheetTitle>
              <SheetDescription>{t('strategySheetDescription')}</SheetDescription>
            </SheetHeader>
            <div className="py-4 space-y-4">
              {isGeneratingStrategy ? (
                <div className="space-y-2">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-4 w-1/4" />
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-4 w-1/5" />
                  <Skeleton className="h-8 w-full" />
                </div>
              ) : strategyResult ? (
                <>
                  {renderStrategyList(t('prioritizedActions'), strategyResult.priorities)}
                  {renderStrategyList(t('emailSequences'), strategyResult.emailSequences)}
                  {renderStrategyList(t('followUps'), strategyResult.followUps)}
                </>
              ) : (
                <p className="text-muted-foreground">{t('strategyGenFailedDescription')}</p>
              )}
            </div>
            <SheetFooter>
              <Button variant="outline" onClick={() => setStrategySheetOpen(false)}>
                {tGeneric('close')}
              </Button>
            </SheetFooter>
          </ScrollArea>
        </SheetContent>
      </Sheet>
    </div>
  );
}
