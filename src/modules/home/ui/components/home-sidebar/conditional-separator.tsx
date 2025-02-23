'use client';

import { Separator } from '@/components/ui/separator';
import { useSidebar } from '@/components/ui/sidebar';

export const ConditionalSeparator = () => {
  const { open } = useSidebar();

  if (!open) return null;

  return <Separator />;
};
