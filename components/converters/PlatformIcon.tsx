import React from 'react';
import { BrandIcon } from '@/components/ui/BrandIcon';

interface Props {
    platform: string;
    className?: string;
    format?: 'json' | 'csv' | 'xml' | 'excel' | 'xlsx' | 'tsv' | 'yaml' | 'html' | 'docx' | 'zip' | string;
}

export function PlatformIcon({ platform, className, format }: Props) {
    return <BrandIcon platform={platform} format={format} className={className} />;
}
