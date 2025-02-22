'use client';

import { InfiniteScroll } from '@/components/infinite-scroll';
import { DEFAULT_LIMIT } from '@/constants';
import { trpc } from '@/trpc/client';
import { Suspense } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import Link from 'next/link';
import { VideoThumbnail } from '@/modules/videos/ui/components/video-thumbnail';
import { snakeCaseToTitle } from '@/lib/utils';
import { formatDate } from 'date-fns';
import { GlobeIcon, LockIcon } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export const VideosSection = () => {
  return (
    <Suspense fallback={<VideosSectionSkeleton />}>
      <ErrorBoundary fallback={<p>Error ...</p>}>
        <VideosSectionSuspense />
      </ErrorBoundary>
    </Suspense>
  );
};
const VideosSectionSuspense = () => {
  const [videos, query] = trpc.studio.getMany.useSuspenseInfiniteQuery(
    { limit: DEFAULT_LIMIT },
    { getNextPageParam: (lastPage) => lastPage.nextCursor }
  );
  console.log(
    videos.pages.flatMap((p) => p.items).map((v) => JSON.stringify(v))
  );
  return (
    <div>
      <div className='border-y'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className='pl-6 w-[510px]'>Video</TableHead>
              <TableHead>Visibility</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className='text-right'>Views</TableHead>
              <TableHead className='text-right'>Comments</TableHead>
              <TableHead className='text-right pr-6'>Likes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {videos.pages
              .flatMap((page) => page.items)
              .map((video) => (
                <Link
                  href={`/studio/videos/${video.id}`}
                  key={video.id}
                  legacyBehavior
                >
                  <TableRow className='cursor-pointer'>
                    <TableCell className='pl-6'>
                      <div className='flex items-center gap-4'>
                        <div className='relative aspect-video w-36 shrink-0'>
                          <VideoThumbnail
                            imageUrl={video.thumbnailUrl}
                            previewUrl={video.previewUrl}
                            title={video.title}
                            duration={video.duration || 0}
                          />
                        </div>
                        <div className='flex flex-col overflow-hidden gap-y-1'>
                          <span className='text-sm line-clamp-1'>
                            {video.title}
                          </span>
                          <span className='text-xs text-muted-foreground line-clamp-1'>
                            {video.description || 'No description'}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className='flex items-center'>
                        {video.visibility === 'private' ? (
                          <LockIcon className='size-4 mr-2' />
                        ) : (
                          <GlobeIcon className='size-4 mr-2' />
                        )}
                        {snakeCaseToTitle(video.visibility)}
                      </div>
                    </TableCell>
                    <TableCell>{snakeCaseToTitle(video.muxStatus)}</TableCell>
                    <TableCell className='text-sm truncate'>
                      {formatDate(video.createdAt, 'dd MMM yyyy')}
                    </TableCell>
                    <TableCell className='text-right text-sm'>
                      {video.viewCount}
                    </TableCell>
                    <TableCell className='text-right text-sm'>
                      {video.commentCount}
                    </TableCell>
                    <TableCell className='text-right text-sm pr-6'>
                      {video.likeCount}
                    </TableCell>
                  </TableRow>
                </Link>
              ))}
          </TableBody>
        </Table>
      </div>

      <InfiniteScroll
        hasNextPage={query.hasNextPage}
        isFetchingNextPage={query.isFetchingNextPage}
        fetchNextPage={query.fetchNextPage}
      />
    </div>
  );
};

const VideosSectionSkeleton = () => {
  return (
    <>
      <div className='border-y'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className='pl-6 w-[510px]'>Video</TableHead>
              <TableHead>Visibility</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className='text-right'>Views</TableHead>
              <TableHead className='text-right'>Comments</TableHead>
              <TableHead className='text-right pr-6'>Likes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 3 }).map((_, index) => (
              <TableRow key={index}>
                <TableCell className='pl-6'>
                  <div className='flex items-center gap-4'>
                    <Skeleton className='h-20 w-36' />
                    <div className='flex-flex-col gap-2'>
                      <Skeleton className='h-4 w[100px]' />
                      <Skeleton className='h-3 w[150px]' />
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Skeleton className='h-4 w-20' />
                </TableCell>
                <TableCell>
                  <Skeleton className='h-4 w-16' />
                </TableCell>
                <TableCell>
                  <Skeleton className='h-4 w-24' />
                </TableCell>
                <TableCell className='text-right'>
                  <Skeleton className='h-4 w-12 ml-auto' />
                </TableCell>
                <TableCell className='text-right'>
                  <Skeleton className='h-4 w-8 ml-auto' />
                </TableCell>
                <TableCell className='text-right pr-6'>
                  <Skeleton className='h-4 w-10 ml-auto' />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
};
