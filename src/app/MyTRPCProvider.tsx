// trpc-provider.tsx
import { TRPCProvider } from '@/trpc/client';

export function MyTRPCProvider({ children }) {
  return <TRPCProvider>{children}</TRPCProvider>;
}
