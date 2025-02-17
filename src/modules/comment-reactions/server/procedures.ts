import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '@/trpc/init';
import { db } from '@/db';
import { commentReactions } from '@/db/schema';
import { and, eq } from 'drizzle-orm';

export const commentReactionsRouter = createTRPCRouter({
  like: protectedProcedure
    .input(z.object({ commentId: z.string().uuid() }))
    .mutation(async ({ input, ctx }) => {
      // we store only views for logged in users and we store each user-video combination only once
      const { id: userId } = ctx.user;
      const { commentId } = input;
      const [existingCommentReactionLike] = await db
        .select()
        .from(commentReactions)
        .where(
          and(
            eq(commentReactions.type, 'like'),
            eq(commentReactions.commentId, commentId),
            eq(commentReactions.userId, userId)
          )
        );
      if (existingCommentReactionLike) {
        const [deletedViewerReaction] = await db
          .delete(commentReactions)
          .where(
            and(
              eq(commentReactions.userId, userId),
              eq(commentReactions.commentId, commentId)
            )
          )
          .returning();
        return deletedViewerReaction;
      }

      const [createdCommentReaction] = await db
        .insert(commentReactions)
        .values({ userId, commentId, type: 'like' })
        .onConflictDoUpdate({
          // needed, if the user disliked the video before - we could also change the delete above to delete every reaction of the user to the video
          target: [commentReactions.userId, commentReactions.commentId],
          set: {
            type: 'like',
          },
        })
        .returning();
      return createdCommentReaction;
    }),
  dislike: protectedProcedure
    .input(z.object({ commentId: z.string().uuid() }))
    .mutation(async ({ input, ctx }) => {
      // we store only views for logged in users and we store each user-video combination only once
      const { id: userId } = ctx.user;
      const { commentId } = input;
      const [existingCommentReactionLike] = await db
        .select()
        .from(commentReactions)
        .where(
          and(
            eq(commentReactions.type, 'dislike'),
            eq(commentReactions.commentId, commentId),
            eq(commentReactions.userId, userId)
          )
        );
      if (existingCommentReactionLike) {
        const [deletedViewerReaction] = await db
          .delete(commentReactions)
          .where(
            and(
              eq(commentReactions.userId, userId),
              eq(commentReactions.commentId, commentId)
            )
          )
          .returning();
        return deletedViewerReaction;
      }

      const [createdCommentReaction] = await db
        .insert(commentReactions)
        .values({ userId, commentId, type: 'dislike' })
        .onConflictDoUpdate({
          // needed, if the user disliked the video before - we could also change the delete above to delete every reaction of the user to the video
          target: [commentReactions.userId, commentReactions.commentId],
          set: {
            type: 'dislike',
          },
        })
        .returning();
      return createdCommentReaction;
    }),
});
