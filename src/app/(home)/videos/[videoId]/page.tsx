import { VideoView } from '@/modules/videos/ui/views/video-view';
import { HydrateClient, trpc } from '@/trpc/server';

interface PageProps {
  params: Promise<{ videoId: string }>;
}
const VideoPage = async ({ params }: PageProps) => {
  const { videoId } = await params;
  void trpc.videos.getOne.prefetch({ id: videoId });
  // TODO: don't forget to change to 'prefetchInfinite'
  void trpc.comments.getMany.prefetch({ videoId: videoId });

  return (
    <HydrateClient>
      <VideoView videoId={videoId} />
    </HydrateClient>
  );
};
export default VideoPage;
