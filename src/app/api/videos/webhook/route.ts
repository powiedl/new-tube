import { eq } from 'drizzle-orm';
import { headers } from 'next/headers';
import {
  VideoAssetCreatedWebhookEvent,
  VideoAssetErroredWebhookEvent,
  VideoAssetReadyWebhookEvent,
  VideoAssetTrackReadyWebhookEvent,
  VideoAssetDeletedWebhookEvent,
} from '@mux/mux-node/resources/webhooks';
import { mux } from '@/lib/mux';
import { UTApi } from 'uploadthing/server';
import { db } from '@/db';
import { videos } from '@/db/schema';
const SIGNING_SECRET = process.env.MUX_WEBHOOK_SECRET!;
const UPLOADTHING_URL = process.env.UPLOADTHING_URL!;

type WebhookEvent =
  | VideoAssetCreatedWebhookEvent
  | VideoAssetErroredWebhookEvent
  | VideoAssetReadyWebhookEvent
  | VideoAssetTrackReadyWebhookEvent
  | VideoAssetDeletedWebhookEvent;

export const POST = async (request: Request) => {
  console.log(
    `${new Date().getHours()}:${new Date().getMinutes()}:${new Date().getSeconds()} HITTING MUX WEBHOOK ...`
  );
  if (!SIGNING_SECRET) throw new Error('MUX_WEBHOOK_SECRET is not set');

  const headersPayload = await headers();
  const muxSignature = headersPayload.get('mux-signature');

  if (!muxSignature) {
    return new Response('No signature found', { status: 401 });
  }

  const payload = await request.json();
  console.log('  event type:', payload.type);
  const body = JSON.stringify(payload);

  // Check if the request is valid (it was raised by mux) - if not it throws an error
  mux.webhooks.verifySignature(
    body,
    { 'mux-signature': muxSignature },
    SIGNING_SECRET
  );
  switch (payload.type as WebhookEvent['type']) {
    case 'video.asset.created': {
      // a new video asset was created in mux - the payload contains the muxAssetId and a muxStatus
      const data = payload.data as VideoAssetCreatedWebhookEvent['data'];
      if (!data.upload_id) {
        return new Response('No upload ID found', { status: 400 });
      }
      // update the video in the database
      await db
        .update(videos)
        .set({
          muxAssetId: data.id,
          muxStatus: data.status,
        })
        .where(eq(videos.muxUploadId, data.upload_id));
      break;
    }
    case 'video.asset.ready': {
      const data = payload.data as VideoAssetReadyWebhookEvent['data'];
      console.log('payload.data', data);
      const playbackId = data.playback_ids?.[0].id;
      if (!data.upload_id) {
        return new Response('Missing upload ID', { status: 400 });
      }
      if (!playbackId) {
        return new Response('Missing playback ID', { status: 400 });
      }
      const [existingVideo] = await db
        .select()
        .from(videos)
        .where(eq(videos.muxUploadId, data.upload_id));
      console.log('Database videoId', existingVideo?.id);
      if (!existingVideo)
        return new Response('Unknown Video ID', { status: 404 });
      if (existingVideo.previewKey) {
        console.log(
          `  ES IST BEREITS EIN PREVIEW IN DER DATENBANK GESPEICHERT (${existingVideo.previewKey})`
        );
      }
      if (existingVideo.thumbnailKey) {
        console.log(
          `  ES IST BEREITS EIN THUMBNAIL IN DER DATENBANK GESPEICHERT (${existingVideo.thumbnailKey})`
        );
      }
      const tempThumbnailUrl = `https://image.mux.com/${playbackId}/thumbnail.jpg`;
      const tempPreviewUrl = `https://image.mux.com/${playbackId}/animated.gif`;
      const duration = data.duration ? Math.round(data.duration * 1000) : 0;

      console.log('  temp Urls:', { tempThumbnailUrl, tempPreviewUrl });
      const utapi = new UTApi();
      const [uploadedThumbnail, uploadedPreview] =
        await utapi.uploadFilesFromUrl([tempThumbnailUrl, tempPreviewUrl]);

      console.log('data', {
        thumb: uploadedThumbnail.data,
        preview: uploadedPreview.data,
      });
      console.log('error', {
        thumb: uploadedThumbnail.error,
        preview: uploadedPreview.error,
      });
      if (!uploadedThumbnail.data || !uploadedPreview.data) {
        console.log('Failed to upload thumbnail or preview');
        return new Response('Failed to upload thumbnail or preview', {
          status: 500,
        });
      }
      const { key: thumbnailKey, url: thumbnailUrl } = uploadedThumbnail.data;
      const { key: previewKey, url: previewUrl } = uploadedPreview.data;
      await db
        .update(videos)
        .set({
          muxStatus: data.status,
          muxPlaybackId: playbackId,
          muxAssetId: data.id,
          thumbnailUrl,
          thumbnailKey,
          previewUrl,
          previewKey,
          duration,
        })
        .where(eq(videos.muxUploadId, data.upload_id));
      break;
    }
    case 'video.asset.errored': {
      const data = payload.data as VideoAssetErroredWebhookEvent['data'];

      if (!data.upload_id) {
        return new Response('Missing upload ID', { status: 400 });
      }
      await db
        .update(videos)
        .set({
          muxStatus: data.status,
        })
        .where(eq(videos.muxUploadId, data.upload_id));
      break;
    }
    case 'video.asset.deleted': {
      const data = payload.data as VideoAssetDeletedWebhookEvent['data'];

      if (!data.upload_id) {
        return new Response('Missing upload ID', { status: 400 });
      }

      const [deletedVideo] = await db
        .select()
        .from(videos)
        .where(eq(videos.muxUploadId, data.upload_id));
      const filesToDelete: string[] = [];
      if (
        deletedVideo?.previewUrl?.startsWith(UPLOADTHING_URL) &&
        deletedVideo?.previewKey
      ) {
        filesToDelete.push(deletedVideo?.previewKey);
      }
      if (
        deletedVideo?.thumbnailUrl?.startsWith(UPLOADTHING_URL) &&
        deletedVideo?.thumbnailKey
      ) {
        filesToDelete.push(deletedVideo?.thumbnailKey);
      }

      if (filesToDelete) {
        const utapi = new UTApi();
        const uploadThingDeleteFilesResponse = await utapi.deleteFiles(
          filesToDelete
        );
        if (
          uploadThingDeleteFilesResponse.success &&
          uploadThingDeleteFilesResponse.deletedCount === filesToDelete.length
        ) {
          // we successfully removed the associated files from Uploadthing - delete the video in the database
          await db.delete(videos).where(eq(videos.muxUploadId, data.upload_id));
        } else {
          // we can't remove the associated files from Uploadthing - clear mux Info in database and set the muxStatus to deleted
          // we have to deal with this in some way ...
          const [updatedVideo] = await db
            .update(videos)
            .set({
              muxStatus: 'deleted',
              muxAssetId: null,
              muxUploadId: null,
              muxTrackId: null,
              muxTrackStatus: null,
              duration: 0,
            })
            .where(eq(videos.muxUploadId, data.upload_id))
            .returning();
        }
      } else {
        await db.delete(videos).where(eq(videos.muxUploadId, data.upload_id));
      }
      break;
    }
    case 'video.asset.track.ready': {
      const data = payload.data as VideoAssetTrackReadyWebhookEvent['data'] & {
        asset_id: string; // Typescript incorrectly says that asset_id does not exist in this event, but it does, so we add it to the type
      };
      const assetId = data.asset_id;
      const trackId = data.id;
      const status = data.status;

      if (!assetId) return new Response('Missing asset id', { status: 400 });

      await db
        .update(videos)
        .set({
          muxTrackId: trackId,
          muxTrackStatus: status,
        })
        .where(eq(videos.muxAssetId, assetId));
      break;
    }
  }

  // it is important to return a response to a webhook. If you don't, you risk that the service stops sending webhooks to your endpoint
  return new Response('Webhook received', { status: 200 });
};
