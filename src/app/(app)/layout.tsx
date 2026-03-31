import type { Metadata } from 'next';
import { ClientShell } from '@/components/layout/client-shell';
import { ApiKeyBanner } from '@/components/layout/api-key-banner';
import { BusinessProvider } from '@/contexts/business-context';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <BusinessProvider>
      <ClientShell>
        <ApiKeyBanner />
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 bg-background">
          {children}
        </main>
      </ClientShell>
    </BusinessProvider>
  );
}
