import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { ThumbsDownIcon, ThumbsUpIcon } from 'lucide-react';
import { VideoGetOneOutput } from '../../types';
import { useClerk } from '@clerk/nextjs';
import { trpc } from '@/trpc/client';
import { toast } from 'sonner';
// TODO: Properly implement video reactions
interface VideoReactionsProps {
  videoId: string;
  likes: number;
  dislikes: number;
  viewerReaction: VideoGetOneOutput['viewerReaction'];
}
export const VideoReactions = ({
  videoId,
  likes,
  dislikes,
  viewerReaction,
}: VideoReactionsProps) => {
  const clerk = useClerk();
  const utils = trpc.useUtils();
  const like = trpc.videoReactions.like.useMutation({
    onSuccess: () => {
      utils.videos.getOne.invalidate({ id: videoId });
      // TODO: Invalidate "liked" playlist
    },
    onError: (error) => {
      toast.error('Something went wrong');
      if (error.data?.code === 'UNAUTHORIZED') {
        clerk.openSignIn();
      }
    },
  });
  const dislike = trpc.videoReactions.dislike.useMutation({
    onSuccess: () => {
      utils.videos.getOne.invalidate({ id: videoId });
      // TODO: Invalidate "liked" playlist
    },
    onError: (error) => {
      toast.error('Something went wrong');
      if (error.data?.code === 'UNAUTHORIZED') {
        clerk.openSignIn();
      }
    },
  });
  console.log('video-reaction,viewerReaction:', viewerReaction);
  return (
    <div className='flex items-center flex-none'>
      <Button
        className='rounded-l-full rounded-r-none gap-2 pr-4'
        variant='secondary'
        onClick={() => like.mutate({ videoId })}
        disabled={like.isPending || dislike.isPending}
      >
        <ThumbsUpIcon
          className={cn('size-5', viewerReaction === 'like' && 'fill-gray-600')}
        />
        {likes}
      </Button>
      <Separator orientation='vertical' className='h-7' />
      <Button
        className='rounded-l-none rounded-r-full pl-3'
        variant='secondary'
        onClick={() => dislike.mutate({ videoId })}
        disabled={like.isPending || dislike.isPending}
      >
        <ThumbsDownIcon
          className={cn(
            'size-5',
            viewerReaction === 'dislike' && 'fill-gray-600'
          )}
        />
        {dislikes}
      </Button>
    </div>
  );
};
