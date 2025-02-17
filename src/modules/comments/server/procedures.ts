import { z } from 'zod';
import {
  baseProcedure,
  createTRPCRouter,
  protectedProcedure,
} from '@/trpc/init';
import { db } from '@/db';
import { commentReactions, comments, users } from '@/db/schema';
import {
  and,
  count,
  desc,
  eq,
  getTableColumns,
  inArray,
  lt,
  or,
} from 'drizzle-orm';
import { TRPCError } from '@trpc/server';

export const commentsRouter = createTRPCRouter({
  remove: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // we store only views for logged in users and we store each user-video combination only once
      const { id: userId } = ctx.user;
      const { id } = input;

      const [deletedComment] = await db
        .delete(comments)
        .where(and(eq(comments.userId, userId), eq(comments.id, id)))
        .returning();
      if (!deletedComment) throw new TRPCError({ code: 'NOT_FOUND' });
      return deletedComment;
    }),
  create: protectedProcedure
    .input(
      z.object({
        videoId: z.string().uuid(),
        value: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // we store only views for logged in users and we store each user-video combination only once
      const { id: userId } = ctx.user;
      const { videoId, value } = input;

      const [createdComment] = await db
        .insert(comments)
        .values({ userId, videoId, value })
        .returning();
      return createdComment;
    }),
  getMany: baseProcedure
    .input(
      z.object({
        videoId: z.string().uuid(),
        cursor: z
          .object({
            id: z.string().uuid(),
            updatedAt: z.date(),
          })
          .nullish(),
        limit: z.number().min(1).max(100),
      })
    )
    .query(async ({ input, ctx }) => {
      const { videoId, cursor, limit } = input;
      const { clerkUserId } = ctx;
      let userId;

      const [user] = await db
        .select()
        .from(users)
        .where(inArray(users.clerkId, clerkUserId ? [clerkUserId] : []));
      if (user) {
        userId = user.id;
      }
      const viewerReactions = db.$with('viewer_reactions').as(
        db
          .select({
            commentId: commentReactions.commentId,
            type: commentReactions.type,
          })
          .from(commentReactions)
          .where(inArray(commentReactions.userId, userId ? [userId] : []))
      );
      const [[totalData], data] = await Promise.all([
        // Promise.all returns an array with the resolved Promise for each element in the parameter array
        // And as the first query only has one element, but still is an array, we need a second pair of [] to only get this first element of totalData
        db
          .select({ count: count() })
          .from(comments)
          .where(eq(comments.videoId, videoId)),
        db
          .with(viewerReactions)
          .select({
            ...getTableColumns(comments),
            user: users,
            viewerReaction: viewerReactions.type,
            likeCount: db.$count(
              commentReactions,
              and(
                eq(commentReactions.type, 'like'),
                eq(commentReactions.commentId, comments.id)
              )
            ),
            dislikeCount: db.$count(
              commentReactions,
              and(
                eq(commentReactions.type, 'dislike'),
                eq(commentReactions.commentId, comments.id)
              )
            ),
            //totalCount: db.$count(comments, eq(comments.videoId, videoId)), // technical correct, but in this way the total number of comments gets an attribute to every comment!
          })
          .from(comments)
          .where(
            and(
              eq(comments.videoId, videoId),
              cursor
                ? or(
                    lt(comments.updatedAt, cursor.updatedAt),
                    and(
                      eq(comments.updatedAt, cursor.updatedAt),
                      lt(comments.id, cursor.id)
                    )
                  )
                : undefined
            )
          )
          .innerJoin(users, eq(comments.userId, users.id))
          .leftJoin(viewerReactions, eq(comments.id, viewerReactions.commentId))
          .orderBy(desc(comments.updatedAt), desc(comments.id))
          .limit(limit + 1),
      ]);

      const hasMore = data.length > limit;
      // Remove the last item if there is more data

      const items = hasMore ? data.slice(0, -1) : data;

      // Set the next cursor to the last item if there is more data
      const lastItem = items[items.length - 1];
      const nextCursor = hasMore
        ? { id: lastItem.id, updatedAt: lastItem.updatedAt }
        : null;

      return { totalCount: totalData.count, items, nextCursor };
    }),
});
