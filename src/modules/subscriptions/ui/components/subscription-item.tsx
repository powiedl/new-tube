import { Skeleton } from '@/components/ui/skeleton';
import { UserAvatar } from '@/components/user-avatar';
import { SubscriptionButton } from './subscription-button';

interface SubscriptionItemProps {
  name: string;
  imageUrl: string;
  subscriberCount: number;
  onUnsubscribe: () => void;
  disabled: boolean;
}
export const SubscriptionItem = ({
  name,
  imageUrl,
  subscriberCount,
  onUnsubscribe,
  disabled,
}: SubscriptionItemProps) => {
  return (
    <div className='flex items-start gap-4'>
      <UserAvatar size='lg' imageUrl={imageUrl} name={name} />
      <div className='flex-1'>
        <div className='flex items-center justify-between'>
          <div>
            <h3 className='text-sm'>{name}</h3>
            <p className='text-xs text-muted-foreground'>
              {subscriberCount.toLocaleString()} subscribers
            </p>
          </div>
          <SubscriptionButton
            size='sm'
            onClick={(e) => {
              e.preventDefault();
              onUnsubscribe();
            }}
            disabled={disabled}
            isSubscribed
          />
        </div>
      </div>
    </div>
  );
};

export const SubscriptionItemSkeleton = () => {
  return (
    <div className='flex items-start gap-4 '>
      <Skeleton className='size-12 rounded-full' />
      <div className='flex-1'>
        <div className='flex items-center justify-between'>
          <div className=''>
            <Skeleton className='h-5 w-40 mb-1' />
            <Skeleton className='h-4 w-36' />
          </div>
          <SubscriptionButton
            size='sm'
            onClick={() => {}}
            disabled
            isSubscribed
          />
        </div>
      </div>
    </div>
  );
};
