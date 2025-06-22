'use client';

import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { CustomField } from '@/types/custom-field';
import { Loader2, Plus, X } from 'lucide-react';

// Zod Schema for validation
const formSchema = z
  .object({
    label: z.string().min(1, 'Label is required'),
    name: z
      .string()
      .min(1, 'Internal name is required')
      .regex(
        /^[a-z0-9_]+$/,
        'Internal name can only contain lowercase letters, numbers, and underscores.'
      ),
    type: z.enum(['text', 'number', 'date', 'select']),
    placeholder: z.string().optional(),
    required: z.boolean().default(false),
    options: z.array(z.string()).optional(),
  })
  .refine(
    data => {
      if (data.type === 'select') {
        return (
          Array.isArray(data.options) &&
          data.options.length > 0 &&
          data.options.every(opt => opt.length > 0)
        );
      }
      return true;
    },
    {
      message: 'At least one option is required for select type.',
      path: ['options'],
    }
  );

type CustomFieldFormValues = z.infer<typeof formSchema>;

interface CustomFieldDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSubmit: (values: CustomFieldFormValues, fieldId?: string) => Promise<void>;
  initialData?: CustomField | null;
  isSubmitting: boolean;
}

export function CustomFieldDialog({
  isOpen,
  onOpenChange,
  onSubmit,
  initialData,
  isSubmitting,
}: CustomFieldDialogProps) {
  const t = useTranslations('SettingsPage.customFields');
  const form = useForm<CustomFieldFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      label: '',
      name: '',
      type: 'text',
      placeholder: '',
      required: false,
      options: [''],
    },
  });

  const { watch, setValue, reset } = form;
  const fieldType = watch('type');

  useEffect(() => {
    if (initialData) {
      reset({
        ...initialData,
        options: initialData.options || [''],
      });
    } else {
      reset({
        label: '',
        name: '',
        type: 'text',
        placeholder: '',
        required: false,
        options: [''],
      });
    }
  }, [initialData, reset]);

  const handleFormSubmit = async (values: CustomFieldFormValues) => {
    // Sanitize options for select type
    if (values.type !== 'select') {
      values.options = [];
    }
    await onSubmit(values, initialData?.id);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{initialData ? t('editTitle') : t('addTitle')}</DialogTitle>
          <DialogDescription>{t('dialogDescription')}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="label"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('label')}</FormLabel>
                  <FormControl>
                    <Input placeholder={t('labelPlaceholder')} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('name')}</FormLabel>
                  <FormControl>
                    <Input placeholder={t('namePlaceholder')} {...field} />
                  </FormControl>
                  <FormDescription>{t('nameDescription')}</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('type')}</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t('typePlaceholder')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="text">{t('text')}</SelectItem>
                      <SelectItem value="number">{t('number')}</SelectItem>
                      <SelectItem value="date">{t('date')}</SelectItem>
                      <SelectItem value="select">{t('select')}</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            {fieldType === 'select' && (
              <FormField
                control={form.control}
                name="options"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('options')}</FormLabel>
                    <div className="space-y-2">
                      {field.value?.map((option, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <Input
                            value={option}
                            onChange={e => {
                              const newOptions = [...(field.value || [])];
                              newOptions[index] = e.target.value;
                              setValue('options', newOptions, { shouldValidate: true });
                            }}
                            placeholder={`${t('optionPlaceholder')} ${index + 1}`}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              const newOptions = [...(field.value || [])];
                              newOptions.splice(index, 1);
                              setValue('options', newOptions, { shouldValidate: true });
                            }}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setValue('options', [...(field.value || []), ''])}
                      className="mt-2"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      {t('addOption')}
                    </Button>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            <FormField
              control={form.control}
              name="required"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel>{t('required')}</FormLabel>
                    <FormDescription>{t('requiredDescription')}</FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  {t('cancel')}
                </Button>
              </DialogClose>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t('save')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
