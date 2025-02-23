'use client';

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { useAuth } from '@clerk/clerk-react';
import { useClerk } from '@clerk/nextjs';
import {
  ClapperboardIcon,
  HistoryIcon,
  ListVideoIcon,
  ThumbsUpIcon,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const items = [
  {
    title: 'History',
    url: '/playlists/history',
    icon: HistoryIcon,
    auth: true,
  },
  {
    title: 'Liked videos',
    url: '/playlists/liked',
    icon: ThumbsUpIcon,
    auth: true,
  },
  {
    title: 'All playlists',
    url: '/playlists',
    icon: ListVideoIcon,
    auth: true,
  },
  {
    title: 'Studio',
    url: '/studio',
    icon: ClapperboardIcon,
    auth: true,
  },
];
export const PersonalSidebar = () => {
  const clerk = useClerk();
  const pathname = usePathname();
  const { isSignedIn } = useAuth();
  return (
    <SidebarGroup>
      <SidebarGroupLabel>You</SidebarGroupLabel>
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
                <Link prefetch href={i.url} className='flex items-center gap-4'>
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
