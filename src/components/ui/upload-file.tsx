'use client';

import React, { useCallback, useState } from 'react';
import { useDropzone, FileRejection } from 'react-dropzone';
import { UploadCloud, X, File as FileIcon } from 'lucide-react';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';

interface UploadFileProps {
  onFileChange: (file: File | null) => void;
  initialImageUrl?: string | null;
}

export function UploadFile({ onFileChange, initialImageUrl }: UploadFileProps) {
  const [preview, setPreview] = useState<string | null>(initialImageUrl || null);
  const { toast } = useToast();

  const onDrop = useCallback(
    (acceptedFiles: File[], fileRejections: FileRejection[]) => {
      if (fileRejections.length > 0) {
        toast({
          variant: 'destructive',
          title: 'File rejected',
          description: fileRejections[0].errors[0].message,
        });
        return;
      }

      const file = acceptedFiles[0];
      if (file) {
        onFileChange(file);
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreview(reader.result as string);
        };
        reader.readAsDataURL(file);
      }
    },
    [onFileChange, toast]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': [],
      'image/png': [],
      'image/gif': [],
      'image/webp': [],
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    multiple: false,
  });

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPreview(null);
    onFileChange(null);
  };

  return (
    <div
      {...getRootProps()}
      className={`relative border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors
      ${isDragActive ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'}`}
    >
      <input {...getInputProps()} />
      {preview ? (
        <div className="relative mx-auto w-28 h-28">
          <Image src={preview} alt="Upload preview" fill className="object-contain rounded-md" />
          <button
            onClick={handleRemove}
            type="button"
            className="absolute -top-2 -right-2 bg-background rounded-full p-1 shadow-md hover:bg-destructive hover:text-destructive-foreground z-10"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
          <UploadCloud className="h-10 w-10" />
          <p className="font-semibold">
            {isDragActive
              ? 'Drop the file here...'
              : "Drag 'n' drop a file here, or click to select"}
          </p>
          <p className="text-xs">PNG, JPG, GIF, WEBP up to 10MB</p>
        </div>
      )}
    </div>
  );
}
