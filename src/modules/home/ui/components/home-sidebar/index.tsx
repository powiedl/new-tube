import { Sidebar, SidebarContent } from '@/components/ui/sidebar';
import { MainSidebar } from './main-sidebar';
import { Separator } from '@/components/ui/separator';
import { PersonalSidebar } from './personal-sidebar';
import { DemoAssetsSidebar } from './demo-assets-sidebar';
import { SubscriptionsSidebar } from './subscriptions-sidebar';
import { SignedIn } from '@clerk/nextjs';

export const HomeSidebar = () => {
  return (
    <Sidebar className='pt-16 z-40 border-none' collapsible='icon'>
      <SidebarContent className='bg-background'>
        <MainSidebar />
        <Separator />
        <PersonalSidebar />
        <SignedIn>
          <SubscriptionsSidebar />
        </SignedIn>
        <DemoAssetsSidebar />
      </SidebarContent>
    </Sidebar>
  );
};
