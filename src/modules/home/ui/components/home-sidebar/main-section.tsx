'use client';

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { FlameIcon, HomeIcon, PlaySquareIcon } from 'lucide-react';
import Link from 'next/link';
import { useAuth, useClerk } from '@clerk/nextjs';
import { usePathname } from 'next/navigation';

const items = [
  { title: 'Home', url: '/', icon: HomeIcon },
  {
    title: 'Subscriptions',
    url: '/feed/subscriptions',
    icon: PlaySquareIcon,
    auth: true,
  },
  { title: 'Trending', url: '/feed/trending', icon: FlameIcon },
];
export const MainSection = () => {
  const clerk = useClerk();
  const { isSignedIn } = useAuth();
  const pathname = usePathname();
  return (
    <SidebarGroup>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((i) => (
            <SidebarMenuItem key={i.title}>
              <SidebarMenuButton
                tooltip={i.title}
                asChild
                isActive={pathname === i.url}
                onClick={(e) => {
                  if (!isSignedIn && i.auth) {
                    e.preventDefault();
                    return clerk.openSignIn();
                  }
                }}
              >
                <Link href={i.url} className='flex items-center gap-4'>
                  <i.icon />
                  <span className='text-sm'>{i.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
};
