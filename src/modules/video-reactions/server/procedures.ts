import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '@/trpc/init';
import { db } from '@/db';
import { videoReactions } from '@/db/schema';
import { and, eq } from 'drizzle-orm';

export const videoReactionsRouter = createTRPCRouter({
  like: protectedProcedure
    .input(z.object({ videoId: z.string().uuid() }))
    .mutation(async ({ input, ctx }) => {
      // we store only views for logged in users and we store each user-video combination only once
      const { id: userId } = ctx.user;
      const { videoId } = input;
      const [existingVideoReactionLike] = await db
        .select()
        .from(videoReactions)
        .where(
          and(
            eq(videoReactions.videoId, videoId),
            eq(videoReactions.userId, userId),
            eq(videoReactions.type, 'like')
          )
        );
      if (existingVideoReactionLike) {
        const [deletedViewerReaction] = await db
          .delete(videoReactions)
          .where(
            and(
              eq(videoReactions.userId, userId),
              eq(videoReactions.videoId, videoId)
            )
          )
          .returning();
        return deletedViewerReaction;
      }

      const [createdVideoReaction] = await db
        .insert(videoReactions)
        .values({ userId, videoId, type: 'like' })
        .onConflictDoUpdate({
          // needed, if the user disliked the video before - we could also change the delete above to delete every reaction of the user to the video
          target: [videoReactions.userId, videoReactions.videoId],
          set: {
            type: 'like',
          },
        })
        .returning();
      return createdVideoReaction;
    }),
  dislike: protectedProcedure
    .input(z.object({ videoId: z.string().uuid() }))
    .mutation(async ({ input, ctx }) => {
      // we store only views for logged in users and we store each user-video combination only once
      const { id: userId } = ctx.user;
      const { videoId } = input;
      const [existingVideoReactionDislike] = await db
        .select()
        .from(videoReactions)
        .where(
          and(
            eq(videoReactions.videoId, videoId),
            eq(videoReactions.userId, userId),
            eq(videoReactions.type, 'dislike')
          )
        );
      if (existingVideoReactionDislike) {
        const [deletedViewerReaction] = await db
          .delete(videoReactions)
          .where(
            and(
              eq(videoReactions.userId, userId),
              eq(videoReactions.videoId, videoId)
            )
          )
          .returning();
        return deletedViewerReaction;
      }

      const [createdVideoReaction] = await db
        .insert(videoReactions)
        .values({ userId, videoId, type: 'dislike' })
        .onConflictDoUpdate({
          // needed, if the user disliked the video before - we could also change the delete above to delete every reaction of the user to the video
          target: [videoReactions.userId, videoReactions.videoId],
          set: {
            type: 'dislike',
          },
        })
        .returning();
      return createdVideoReaction;
    }),
});
