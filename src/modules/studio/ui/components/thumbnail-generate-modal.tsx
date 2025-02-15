import { ResponsiveModal } from '@/components/responsive-modal';
import { trpc } from '@/trpc/client';
import { z } from 'zod';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

interface ThumbnailGenerateModalProps {
  videoId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const formSchema = z.object({
  prompt: z
    .string()
    .min(10, 'Please provide at least a prompt with 10 characters'),
});
export const ThumbnailGenerateModal = ({
  videoId,
  open,
  onOpenChange,
}: ThumbnailGenerateModalProps) => {
  const utils = trpc.useUtils();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      prompt: '', //'A sunset at the sea. At the horizon there should be a steamship and on the left side of the picture there should be a city with a harbour.'
    },
  });
  const generateThumbnail = trpc.videos.generateThumbnail.useMutation({
    onSuccess: () => {
      toast.success('Background job started', {
        description: 'This may take some time ...',
      });
    },
    onError: () => {
      toast.error('Something went wrong');
    },
  });
  const onSubmit = (values: z.infer<typeof formSchema>) => {
    generateThumbnail.mutate({
      prompt: values.prompt,
      id: videoId,
    });
    onOpenChange(false);
    utils.studio.getOne.invalidate({ id: videoId });
  };
  return (
    <ResponsiveModal
      title='Generate a thumbnail'
      open={open}
      onOpenChange={onOpenChange}
    >
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className='flex flex-col gap-4'
        >
          <FormField
            control={form.control}
            name='prompt'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Prompt</FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    className='resize-none'
                    rows={10}
                    cols={5}
                    placeholder='Add a prompt to describe the thumbnail, which should be generated. At the moment I am not able to send formData from Upstash to imagine.art, so the generate Thumbnail is temporary unavailable'
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className='flex justify-end'>
            <Button disabled={false} type='submit'>
              Generate Thumbnail
            </Button>
          </div>
        </form>
      </Form>
    </ResponsiveModal>
  );
};
