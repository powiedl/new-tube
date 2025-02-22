import { InfiniteScroll } from '@/components/infinite-scroll';
import { ResponsiveModal } from '@/components/responsive-modal';
import { Button } from '@/components/ui/button';
import { DEFAULT_LIMIT } from '@/constants';
import { trpc } from '@/trpc/client';
import { Loader2Icon, SquareCheckIcon, SquareIcon } from 'lucide-react';
import { toast } from 'sonner';

interface PlaylistAddModalProps {
  videoId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const PlaylistAddModal = ({
  open,
  onOpenChange,
  videoId,
}: PlaylistAddModalProps) => {
  const utils = trpc.useUtils();
  const {
    data: playlists,
    isLoading,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = trpc.playlists.getManyForVideo.useInfiniteQuery(
    // here we only use the infinite query - we nowhere prefetch the data, which is ok - but we must not use useSuspenseInfiniteQuery
    { limit: DEFAULT_LIMIT, videoId },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
      enabled: !!videoId && open, // the query is only enabled, if we have a videoId and the modal is open (otherwise the query would be executed no matter if the modal is visible or not)
    }
  );
  const handleOpenChange = (newOpen: boolean) => {
    // the idea of this is, that it refetches the data every time the modal gets opened again (and that it is not cached, but this implementation does not work for that)
    utils.playlists.getManyForVideo.reset();
    onOpenChange(newOpen);
  };

  const addVideo = trpc.playlists.addVideo.useMutation({
    onSuccess: (data) => {
      toast.success('Video added to playlist');
      utils.playlists.getMany.invalidate();
      utils.playlists.getManyForVideo.invalidate();
      // TODO: invalidate playlists.getOne
    },
    onError: () => {
      toast.error('Something went wrong');
    },
  });
  const removeVideo = trpc.playlists.removeVideo.useMutation({
    onSuccess: (data) => {
      toast.success('Video removed from playlist');
      utils.playlists.getMany.invalidate();
      utils.playlists.getManyForVideo.invalidate();
      // TODO: invalidate playlists.getOne
    },
    onError: () => {
      toast.error('Something went wrong');
    },
  });

  return (
    <ResponsiveModal
      title='Add to playlist'
      open={open}
      onOpenChange={handleOpenChange}
    >
      <div className='flex flex-col gap-2'>
        {isLoading ? (
          <div className='flex justify-center p-4'>
            <Loader2Icon className='animate-spin size-5 text-muted-foreground' />
          </div>
        ) : (
          playlists?.pages
            .flatMap((page) => page.items)
            .map((playlist) => (
              <Button
                key={playlist.id}
                variant='ghost'
                className='w-full justify-start px-2 [&_svg]:size-5'
                size='lg'
                onClick={() => {
                  if (playlist.containsVideo) {
                    removeVideo.mutate({ playlistId: playlist.id, videoId });
                  } else {
                    addVideo.mutate({ playlistId: playlist.id, videoId });
                  }
                }}
                disabled={removeVideo.isPending || addVideo.isPending}
              >
                {playlist.containsVideo ? (
                  <SquareCheckIcon className='mr-2' />
                ) : (
                  <SquareIcon className='mr-2' />
                )}
                {playlist.name}
              </Button>
            ))
        )}
        {!isLoading && (
          <InfiniteScroll
            hasNextPage={hasNextPage}
            isFetchingNextPage={isFetchingNextPage}
            fetchNextPage={fetchNextPage}
            isManual
            showReachedTheEndInformation={false}
          />
        )}
      </div>
    </ResponsiveModal>
  );
};
