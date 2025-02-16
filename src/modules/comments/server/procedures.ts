import { z } from 'zod';
import {
  baseProcedure,
  createTRPCRouter,
  protectedProcedure,
} from '@/trpc/init';
import { db } from '@/db';
import { comments, users } from '@/db/schema';
import { eq, getTableColumns } from 'drizzle-orm';

export const commentsRouter = createTRPCRouter({
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
      })
    )
    .query(async ({ input }) => {
      const { videoId } = input;

      const data = await db
        .select({
          ...getTableColumns(comments),
          user: users,
        })
        .from(comments)
        .where(eq(comments.videoId, videoId))
        .innerJoin(users, eq(comments.userId, users.id));
      return data;
    }),
});
