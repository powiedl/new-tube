import { DEFAULT_LIMIT } from '@/constants';
import { PlaylistView } from '@/modules/home/ui/views/playlists-view';
import { HydrateClient, trpc } from '@/trpc/server';

export const dynamic = 'force-dynamic';

const PlaylistsPage = async () => {
  void trpc.playlists.getMany.prefetchInfinite({ limit: DEFAULT_LIMIT });
  return (
    <HydrateClient>
      <PlaylistView />
    </HydrateClient>
  );
};
export default PlaylistsPage;
