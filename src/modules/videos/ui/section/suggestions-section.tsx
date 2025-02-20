'use client';

import { DEFAULT_LIMIT } from '@/constants';
import { trpc } from '@/trpc/client';
import {
  VideoRowCard,
  VideoRowCardSkeleton,
} from '../components/video-row-card';
import {
  VideoGridCard,
  VideoGridCardSkeleton,
} from '../components/video-grid-card';
import { InfiniteScroll } from '@/components/infinite-scroll';
import { Suspense } from 'react';
import { ErrorBoundary } from 'react-error-boundary';

interface SuggestionsSectionProps {
  videoId: string;
  isManual?: boolean;
}

const SuggestionsSectionSkeleton = () => {
  return (
    <>
      <div className='hidden md:block space-y-3'>
        {Array.from({ length: 5 }).map((_, index) => (
          <VideoRowCardSkeleton key={index} size='default' />
        ))}
      </div>
      <div className='block md:hidden space-y-10'>
        {Array.from({ length: 3 }).map((_, index) => (
          <VideoGridCardSkeleton key={index} />
        ))}
      </div>
    </>
  );
};
export const SuggestionsSection = ({
  videoId,
  isManual = false,
}: SuggestionsSectionProps) => {
  return (
    <Suspense fallback={<SuggestionsSectionSkeleton />}>
      <ErrorBoundary fallback={<p>Error</p>}>
        <SuggestionsSectionSuspense videoId={videoId} isManual={isManual} />
      </ErrorBoundary>
    </Suspense>
  );
};
const SuggestionsSectionSuspense = ({
  videoId,
  isManual = false,
}: SuggestionsSectionProps) => {
  const [suggestions, query] =
    trpc.suggestions.getMany.useSuspenseInfiniteQuery(
      {
        videoId,
        limit: DEFAULT_LIMIT,
      },
      {
        getNextPageParam: (lastPage) => lastPage.nextCursor,
      }
    );
  if (suggestions.pages[0].items.length === 0)
    return (
      <div className='space-y-3 text-sm text-muted-foreground text-center border-y-2 my-3 p-2 xl:border-0'>
        No suggestions available
      </div>
    );
  return (
    <>
      <div className='hidden md:block space-y-3 border-t-2 my-4 p-2 xl:border-0 xl:my-0 xl:p-0'>
        {suggestions.pages.flatMap((page) =>
          page.items.map((video) => (
            <VideoRowCard key={video.id} data={video} size='default' />
          ))
        )}
      </div>
      <div className='block md:hidden space-y-10 border-t-2 my-3 p-2'>
        {suggestions.pages.flatMap((page) =>
          page.items.map((video) => (
            <VideoGridCard key={video.id} data={video} />
          ))
        )}
      </div>
      <InfiniteScroll
        className='border-b-2 xl:border-0'
        hasNextPage={query.hasNextPage}
        isFetchingNextPage={query.isFetchingNextPage}
        fetchNextPage={query.fetchNextPage}
        isManual={isManual}
      />
    </>
  );
};
