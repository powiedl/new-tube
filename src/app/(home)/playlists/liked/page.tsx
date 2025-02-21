import { DEFAULT_LIMIT } from '@/constants';
import { LikedView } from '@/modules/playlists/server/ui/views/liked-view';
import { HydrateClient, trpc } from '@/trpc/server';

const LikedPage = async () => {
  void trpc.playlists.getLiked.prefetchInfinite({ limit: DEFAULT_LIMIT });
  return (
    <HydrateClient>
      <LikedView />
    </HydrateClient>
  );
};
export default LikedPage;
