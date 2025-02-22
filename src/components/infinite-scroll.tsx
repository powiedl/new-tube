import { useIntersectionObserver } from '@/hooks/use-intersection-observer';
import { useEffect } from 'react';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';

interface InfiniteScrollProps {
  isManual?: boolean;
  hasNextPage: boolean;
  className?: string;
  isFetchingNextPage: boolean;
  fetchNextPage: () => void;
  showReachedTheEndInformation?: boolean;
}

export const InfiniteScroll = ({
  isManual = false,
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
  className = '',
  showReachedTheEndInformation = true,
}: InfiniteScrollProps) => {
  const { targetRef, isIntersecting } = useIntersectionObserver({
    threshold: 0.5,
    rootMargin: '100px',
  });
  useEffect(() => {
    if (isIntersecting && hasNextPage && !isFetchingNextPage && !isManual) {
      fetchNextPage();
    }
  }, [
    isIntersecting,
    hasNextPage,
    isFetchingNextPage,
    isManual,
    fetchNextPage,
  ]);
  return (
    <div className={cn('flex flex-col items-center gap-4 p-4', className)}>
      <div ref={targetRef} className='h-1' />
      {hasNextPage ? (
        <Button
          variant='secondary'
          disabled={!hasNextPage || isFetchingNextPage}
          onClick={() => fetchNextPage()}
        >
          {isFetchingNextPage ? 'Loading ...' : 'Load more'}
        </Button>
      ) : (
        showReachedTheEndInformation && (
          <p className='text-xs text-muted-foreground'>
            You have reached the end of the list
          </p>
        )
      )}
    </div>
  );
};
