'use client';

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { UserAvatar } from '@/components/user-avatar';
import { DEFAULT_LIMIT } from '@/constants';
import { trpc } from '@/trpc/client';
import { Separator } from '@radix-ui/react-separator';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { ListIcon } from 'lucide-react';

export const LoadingSkeleton = () => {
  return (
    <>
      {[1, 2, 3].map((i) => {
        const w = 4 * (4 * 8 + 6 * (i % 3));
        const width = `${w}px`;
        return (
          <SidebarMenuItem key={i} className='w-full'>
            <SidebarMenuButton disabled className='w-full'>
              <Skeleton className='size-4 rounded-full' />
              <Skeleton className='h-4' style={{ width }} />
            </SidebarMenuButton>
          </SidebarMenuItem>
        );
      })}
    </>
  );
};
export const SubscriptionsSidebar = () => {
  const { open } = useSidebar();
  const pathname = usePathname();
  if (!open) return;
  const { data, isLoading } = trpc.subscriptions.getMany.useInfiniteQuery(
    { limit: DEFAULT_LIMIT },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    }
  );
  return (
    <SidebarGroup>
      <SidebarGroupLabel>Subscriptions</SidebarGroupLabel>
      <SidebarGroupContent>
        <Separator />
        <SidebarMenu>
          {isLoading && <LoadingSkeleton />}
          {!isLoading &&
            data?.pages
              .flatMap((page) => page.items)
              .map((subscription) => (
                <SidebarMenuItem
                  key={`${subscription.creatorId}-${subscription.viewerId}`}
                >
                  <SidebarMenuButton
                    tooltip={subscription.user.name}
                    asChild
                    isActive={pathname === `/users/${subscription.user.id}`}
                  >
                    <Link
                      prefetch
                      href={`/users/${subscription.user.id}`}
                      className='flex items-center gap-4'
                    >
                      <UserAvatar
                        size='xs'
                        name={`${subscription.user.name}`}
                        imageUrl={`${subscription.user.imageUrl}`}
                      />
                      <span className='text-sm'>{`${subscription.user.name}`}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
          {!isLoading && (
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={pathname === '/subscriptions'}
              >
                <Link
                  prefetch
                  href='/subscriptions'
                  className='flex items-center gap-4'
                >
                  <ListIcon className='size-4' />
                  <span className='text-sm'>All subscriptions</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
};
