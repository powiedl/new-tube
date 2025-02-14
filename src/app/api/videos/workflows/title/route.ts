import { serve } from '@upstash/workflow/nextjs';

export const { POST } = serve(async (context) => {
  console.log('in da route');
});
