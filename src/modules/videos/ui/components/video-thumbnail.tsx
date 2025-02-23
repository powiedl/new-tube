import { formatDuration } from '@/lib/utils';
import Image from 'next/image';
import { THUMBNAIL_FALLBACK } from '../../constants';
import { Skeleton } from '@/components/ui/skeleton';

interface VideoThumbnailProps {
  title: string;
  imageUrl?: string | null;
  previewUrl?: string | null;
  duration: number;
}
export const VideoThumbnailSkeleton = () => {
  return (
    <div className='relative w-full overflow-hidden rounded-xl aspect-video'>
      <Skeleton className='size-full' />
    </div>
  );
};
export const VideoThumbnail = ({
  imageUrl,
  previewUrl,
  duration,
}: VideoThumbnailProps) => {
  return (
    <div className='relative group'>
      {/* Thumbnail wrapper */}
      <div className='relative w-full overflow-hidden rounded-xl aspect-video'>
        <Image
          src={imageUrl || THUMBNAIL_FALLBACK}
          alt='Thumbnail'
          fill
          className='size-full object-cover group-hover:opacity-0'
        />
        <Image
          src={previewUrl || THUMBNAIL_FALLBACK}
          alt='Preview'
          fill
          className='size-full object-cover group-hover:opacity-100 opacity-0'
          unoptimized={!!previewUrl}
        />
      </div>
      {/* Video duration box */}
      <div className='absolute bottom-2 right-2 px-1 py-0.5 bg-black/80 text-white text-xs font-medium'>
        {formatDuration(duration)}
      </div>
    </div>
  );
};
