import { AppGate } from "@/components/app-gate";
import { ChatLauncher, FinlioChat } from "@/components/chat/finlio-chat";
import { DateRangeProvider } from "@/lib/date-range-context";
import { PreferencesBoundary } from "@/components/preferences-boundary";
import { MobileNav, Sidebar } from "@/components/shell/sidebar";

// The app shell: sidebar, page card and the Finlio chat.
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppGate>
      <DateRangeProvider>
        <div className="flex min-h-screen flex-col md:flex-row md:gap-2 md:p-2">
          <Sidebar />
          <MobileNav />
          <main className="min-w-0 flex-1 bg-cream md:rounded-3xl md:border md:border-line">
            <div className="mx-auto w-full max-w-[1180px] px-4 py-6 md:px-8 md:py-10 xl:px-12">
              <PreferencesBoundary>{children}</PreferencesBoundary>
            </div>
          </main>
          <FinlioChat />
        </div>
        <ChatLauncher />
      </DateRangeProvider>
    </AppGate>
  );
}
