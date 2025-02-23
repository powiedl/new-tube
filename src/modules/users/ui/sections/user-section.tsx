'use client';

import { trpc } from '@/trpc/client';
import { Suspense } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import {
  UserPageBanner,
  UserPageBannerSkeleton,
} from '../components/user-page-banner';
import {
  UserPageInfo,
  UserPageInfoSkeleton,
} from '../components/user-page-info';
import { Separator } from '@/components/ui/separator';
import ErrorFallback from '@/components/error-fallback';

interface UserSectionProps {
  userId: string;
}
export const UserSection = (props: UserSectionProps) => {
  return (
    <Suspense fallback={<UserSectionSkeleton />}>
      <ErrorBoundary fallback={<ErrorFallback />}>
        <UserSectionSuspense {...props} />
      </ErrorBoundary>
    </Suspense>
  );
};

const UserSectionSuspense = ({ userId }: UserSectionProps) => {
  const [user] = trpc.users.getOne.useSuspenseQuery({ id: userId });
  return (
    <div className='flex flex-col'>
      <UserPageBanner user={user} />
      <UserPageInfo user={user} />
      <Separator />
    </div>
  );
};

const UserSectionSkeleton = () => {
  return (
    <div className='flex flex-col'>
      <UserPageBannerSkeleton />
      <UserPageInfoSkeleton />
      <Separator />
    </div>
  );
};
