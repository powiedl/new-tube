import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '@/trpc/init';
import { db } from '@/db';
import { videoViews } from '@/db/schema';
import { and, eq } from 'drizzle-orm';

export const videoViewsRouter = createTRPCRouter({
  create: protectedProcedure
    .input(z.object({ videoId: z.string().uuid() }))
    .mutation(async ({ input, ctx }) => {
      // we store only views for logged in users and we store each user-video combination only once
      const { id: userId } = ctx.user;
      const { videoId } = input;
      const [existingVideoView] = await db
        .select()
        .from(videoViews)
        .where(
          and(eq(videoViews.videoId, videoId), eq(videoViews.userId, userId))
        );
      if (existingVideoView) {
        return existingVideoView; // if there is already a view for the user and the video in question - simply return it
      }

      const [createdVideoView] = await db
        .insert(videoViews)
        .values({ userId, videoId })
        .returning();
      return createdVideoView;
    }),
});
