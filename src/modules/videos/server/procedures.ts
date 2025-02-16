import { db } from '@/db';
import {
  users,
  videoReactions,
  videos,
  videoUpdateSchema,
  videoViews,
} from '@/db/schema';
import { mux } from '@/lib/mux';
import { workflow } from '@/lib/workflow';
import {
  baseProcedure,
  createTRPCRouter,
  protectedProcedure,
} from '@/trpc/init';
import { TRPCError } from '@trpc/server';
import { and, eq, getTableColumns, inArray } from 'drizzle-orm';
import { UTApi } from 'uploadthing/server';
import { z } from 'zod';

export const videosRouter = createTRPCRouter({
  getOne: baseProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
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
            videoId: videoReactions.videoId,
            type: videoReactions.type,
          })
          .from(videoReactions)
          .where(inArray(videoReactions.userId, userId ? [userId] : []))
      );
      const [existingVideo] = await db
        .with(viewerReactions)
        .select({
          ...getTableColumns(videos),
          user: { ...getTableColumns(users) },
          viewCount: db.$count(videoViews, eq(videoViews.videoId, videos.id)), // TODO change to correct query
          likeCount: db.$count(
            videoReactions,
            and(
              eq(videoReactions.videoId, videos.id),
              eq(videoReactions.type, 'like')
            )
          ),
          dislikeCount: db.$count(
            videoReactions,
            and(
              eq(videoReactions.videoId, videos.id),
              eq(videoReactions.type, 'dislike')
            )
          ),
          viewerReaction: viewerReactions.type,
        })
        .from(videos)
        .innerJoin(users, eq(videos.userId, users.id))
        .leftJoin(viewerReactions, eq(videos.id, viewerReactions.videoId)) // viewerReactions only contains the reaction of the current user!
        .where(eq(videos.id, input.id));
      //.groupBy(videos.id, users.id, viewerReactions.type); // in my opinion this is not neccessary, because there can only be one viewerReaction for a particular user and video

      if (!existingVideo) throw new TRPCError({ code: 'NOT_FOUND' });
      return existingVideo;
    }),
  generateDescription: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const { id: userId } = ctx.user;
      const url = `${process.env.UPSTASH_WORKFLOW_URL}/api/videos/workflows/description`;
      console.log('generateThumbnail,url', url);
      const { workflowRunId } = await workflow.trigger({
        url,
        body: { userId, videoId: input.id },
        retries: 1,
      });
      return workflowRunId;
    }),
  generateTitle: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const { id: userId } = ctx.user;
      const url = `${process.env.UPSTASH_WORKFLOW_URL}/api/videos/workflows/title`;
      console.log('generateThumbnail,url', url);
      const { workflowRunId } = await workflow.trigger({
        url,
        body: { userId, videoId: input.id },
        retries: 1,
      });
      return workflowRunId;
    }),
  generateThumbnail: protectedProcedure
    .input(z.object({ id: z.string().uuid(), prompt: z.string().min(10) }))
    .mutation(async ({ ctx, input }) => {
      const { id: userId } = ctx.user;
      const url = `${process.env.UPSTASH_WORKFLOW_URL}/api/videos/workflows/thumbnail`;
      console.log('generateThumbnail,url', url);
      const { workflowRunId } = await workflow.trigger({
        url,
        body: { userId, videoId: input.id, prompt: input.prompt },
        retries: 1,
      });
      return workflowRunId;
    }),
  restoreThumbnail: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const { id: userId } = ctx.user;

      const [existingVideo] = await db
        .select()
        .from(videos)
        .where(and(eq(videos.id, input.id), eq(videos.userId, userId)));

      if (!existingVideo) return new TRPCError({ code: 'NOT_FOUND' });

      if (existingVideo.thumbnailKey) {
        const utapi = new UTApi();
        await utapi.deleteFiles(existingVideo.thumbnailKey);
        await db
          .update(videos)
          .set({ thumbnailKey: null, thumbnailUrl: null })
          .where(and(eq(videos.id, input.id), eq(videos.userId, userId)));
      }

      if (!existingVideo.muxPlaybackId) {
        throw new TRPCError({ code: 'BAD_REQUEST' });
      }

      const tempThumbnailUrl = `https://image.mux.com/${existingVideo.muxPlaybackId}/thumbnail.jpg`;
      const utapi = new UTApi();
      const uploadedThumbnail = await utapi.uploadFilesFromUrl(
        tempThumbnailUrl
      );
      if (!uploadedThumbnail.data)
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });

      const { key: thumbnailKey, url: thumbnailUrl } = uploadedThumbnail.data;

      const [updatedVideo] = await db
        .update(videos)
        .set({
          thumbnailUrl,
          thumbnailKey,
        })
        .where(and(eq(videos.id, input.id), eq(videos.userId, userId)))
        .returning();
      return updatedVideo;
    }),
  remove: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const { id: userId } = ctx.user;
      const [removedVideo] = await db
        .delete(videos)
        .where(and(eq(videos.id, input.id), eq(videos.userId, userId)))
        .returning();
      if (!removedVideo) throw new TRPCError({ code: 'NOT_FOUND' });
      return removedVideo;
    }),
  update: protectedProcedure
    .input(videoUpdateSchema)
    .mutation(async ({ ctx, input }) => {
      const { id: userId } = ctx.user;
      if (!input.id) throw new TRPCError({ code: 'BAD_REQUEST' });

      const [updatedVideo] = await db
        .update(videos)
        .set({
          title: input.title,
          description: input.description,
          categoryId: input.categoryId,
          visibility: input.visibility,
          updatedAt: new Date(),
        })
        .where(and(eq(videos.id, input.id), eq(videos.userId, userId)))
        .returning();
      if (!updatedVideo) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }
      return updatedVideo;
    }),
  create: protectedProcedure.mutation(async ({ ctx }) => {
    const { id: userId } = ctx.user;

    const upload = await mux.video.uploads.create({
      new_asset_settings: {
        passthrough: userId, // video.id would be better, but we don't have it right now, because we insert the record to the database afterwards
        playback_policy: ['public'],
        input: [
          {
            generated_subtitles: [
              {
                language_code: 'en',
                name: 'English',
              },
            ],
          },
        ],
        //mp4_support: 'standard',
      },
      cors_origin: '*', // TODO: In production, set to your url
    });
    const [video] = await db
      .insert(videos)
      .values({
        userId,
        title: 'Untitled',
        muxStatus: 'waiting',
        muxUploadId: upload.id,
      })
      .returning();
    return { video: video, url: upload.url };
  }),
});
