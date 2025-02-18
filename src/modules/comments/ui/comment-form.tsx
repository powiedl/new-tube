import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { trpc } from '@/trpc/client';
import { commentInsertSchema } from '@/db/schema';
import { useUser, useClerk } from '@clerk/nextjs';
import { UserAvatar } from '@/components/user-avatar';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import { CommentsSection } from '@/modules/videos/ui/section/comments-section';

interface CommentFormProps {
  videoId: string;
  variant?: 'comment' | 'reply';
  parentId?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}
export const CommentForm = ({
  videoId,
  variant = 'comment',
  parentId,
  onSuccess,
  onCancel,
}: CommentFormProps) => {
  const utils = trpc.useUtils();
  const clerk = useClerk();
  const create = trpc.comments.create.useMutation({
    onSuccess: () => {
      utils.comments.getMany.invalidate({ videoId });
      utils.comments.getMany.invalidate({ videoId, parentId }); // maybe this is not needed, because it is covered by the invalidation above - but not sure about this
      form.reset();
      toast.success('Comment added');
      onSuccess?.();
    },
    onError: (error) => {
      toast.error('Something went wrong');
      if (error.data?.code === 'UNAUTHORIZED') {
        clerk.openSignIn();
      }
    },
  });
  const { user } = useUser();
  const form = useForm<z.infer<typeof commentInsertSchema>>({
    resolver: zodResolver(commentInsertSchema.omit({ userId: true })),
    defaultValues: {
      parentId: parentId,
      videoId,
      value: '',
    },
  });

  const handleSubmit = (values: z.infer<typeof commentInsertSchema>) => {
    create.mutate(values);
  };
  const handleCancel = () => {
    form.reset();
    onCancel?.();
  };
  return (
    <Form {...form}>
      <form
        className='flex gap-4 group'
        onSubmit={form.handleSubmit(handleSubmit)}
      >
        <UserAvatar
          size='lg'
          imageUrl={user?.imageUrl || '/user-placeholder.svg'}
          name={user?.username || 'User'}
        />
        <div className='flex-1'>
          <FormField
            name='value'
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Textarea
                    {...field}
                    placeholder={
                      variant === 'reply'
                        ? 'Reply to this comment ...'
                        : 'Add a comment...'
                    }
                    className='resize-none bg-transparent overflow-hidden min-h-0'
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className='justify-end gap-2 mt-2 flex'>
            {onCancel && (
              <Button variant='ghost' type='button' onClick={handleCancel}>
                Cancel
              </Button>
            )}
            <Button
              type='submit'
              size='sm'
              disabled={create.isPending || form.getValues('value').length < 1}
            >
              {/* {variant.charAt(0).toUpperCase() + variant.slice(1)} */}
              {variant === 'reply' ? 'Reply' : 'Comment'}
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
};
