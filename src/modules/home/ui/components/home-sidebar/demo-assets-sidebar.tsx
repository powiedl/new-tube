'use client';
import {
  SidebarContent,
  SidebarGroup,
  useSidebar,
} from '@/components/ui/sidebar';
import { Separator } from '@radix-ui/react-separator';
import Link from 'next/link';

export const DemoAssetsSidebar = () => {
  const { open } = useSidebar();
  if (!open) return;
  return (
    <>
      <SidebarGroup>
        <SidebarContent>
          <Separator />
          <div className='text-sm text-muted-foreground pl-4 flex flex-col gap-y-1'>
            <h2 className='text-lg font-semibold mb-1 text-foreground'>
              Demo assets
            </h2>
            <Link
              href='https://3o2zv01oem.ufs.sh/f/6Eq0u8jzPnYDJi6D5wrlDWIOLbZ5nA6XMi7yKewRE2SBat1d'
              target='_blank'
            >
              Demo Video #1
            </Link>
            <Link
              href='https://3o2zv01oem.ufs.sh/f/6Eq0u8jzPnYDXHnqCQN6vtwcECMP7m0hSTjsINHUqbVXQJri'
              target='_blank'
            >
              Demo Video #2
            </Link>
            <Link
              href='https://3o2zv01oem.ufs.sh/f/6Eq0u8jzPnYDkpfvLOhfVevhc0IuDpJayMx6l4NAmLK5SQqz'
              target='_blank'
            >
              Demo Video #3
            </Link>
            <Link
              href='https://3o2zv01oem.ufs.sh/f/6Eq0u8jzPnYD2JBWHoC053kiaEIVedhTlQDx29J1RLPot7N4'
              target='_blank'
            >
              Whiteboard Thumb
            </Link>
            <Link
              href='https://3o2zv01oem.ufs.sh/f/6Eq0u8jzPnYDmC99GQFLT9JU0XK6Dt8oVglNBuxYaH2jRrzI'
              target='_blank'
            >
              Globe Thumb
            </Link>
          </div>
        </SidebarContent>
      </SidebarGroup>
    </>
  );
};
