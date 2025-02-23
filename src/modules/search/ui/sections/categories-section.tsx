'use client';
import { trpc } from '@/trpc/client';
import { ErrorBoundary } from 'react-error-boundary';
import { Suspense } from 'react';
import { FilterCarousel } from '@/components/filter-carousel';
import { useRouter } from 'next/navigation';
import ErrorFallback from '@/components/error-fallback';

interface CategoriesSectionProps {
  categoryId?: string;
}

export const CategoriesSection = ({ categoryId }: CategoriesSectionProps) => {
  return (
    <Suspense
      fallback={<FilterCarousel isLoading data={[]} onSelect={() => {}} />}
    >
      <ErrorBoundary fallback={<ErrorFallback />}>
        <CategoriesSectionSuspense categoryId={categoryId} />
      </ErrorBoundary>
    </Suspense>
  );
};
const CategoriesSectionSuspense = ({ categoryId }: CategoriesSectionProps) => {
  const router = useRouter();
  const [categories] = trpc.categories.getMany.useSuspenseQuery();
  const data = categories.map((c) => ({ value: c.id, label: c.name }));
  const onSelect = (value: string | null) => {
    const url = new URL(window.location.href);
    if (value) {
      url.searchParams.set('categoryId', value);
    } else {
      url.searchParams.delete('categoryId');
    }

    router.push(url.toString());
  };
  return <FilterCarousel onSelect={onSelect} value={categoryId} data={data} />;
};
