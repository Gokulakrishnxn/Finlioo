import type { Metadata } from "next";
import { Geist, Geist_Mono, Noto_Sans_Devanagari, Noto_Sans_Kannada, Noto_Sans_Tamil, Noto_Sans_Telugu } from "next/font/google";
import { ChatProvider } from "@/components/chat/chat-context";
import { SettingsProvider } from "@/components/settings/settings-dialog";
import { TourProvider } from "@/components/tour/tour";
import { MotionRoot } from "@/components/motion-root";
import { ThemeRoot } from "@/components/theme-root";
import { PricesProvider } from "@/lib/prices";
import { StoreProvider } from "@/lib/store";
import { demoScript } from "@/lib/demo-mode";
import { themeScript } from "@/lib/theme";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Fonts for Indian scripts, used only when the chosen language needs them.
const devanagari = Noto_Sans_Devanagari({ variable: "--font-noto-devanagari", subsets: ["devanagari"], preload: false });
const tamil = Noto_Sans_Tamil({ variable: "--font-noto-tamil", subsets: ["tamil"], preload: false });
const telugu = Noto_Sans_Telugu({ variable: "--font-noto-telugu", subsets: ["telugu"], preload: false });
const kannada = Noto_Sans_Kannada({ variable: "--font-noto-kannada", subsets: ["kannada"], preload: false });

export const metadata: Metadata = {
  title: "Finlio",
  description: "All your money in one place: investments, assets, spending, goals and analytics.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${devanagari.variable} ${tamil.variable} ${telugu.variable} ${kannada.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <script dangerouslySetInnerHTML={{ __html: demoScript }} />
      </head>
      <body className="min-h-full bg-sand text-ink">
        <ThemeRoot />
        <StoreProvider>
          <PricesProvider>
            <ChatProvider>
              {/* Tour wraps Settings: the Settings window can replay the tour. */}
              <TourProvider>
                <SettingsProvider>
                  <MotionRoot>{children}</MotionRoot>
                </SettingsProvider>
              </TourProvider>
            </ChatProvider>
          </PricesProvider>
        </StoreProvider>
      </body>
    </html>
  );
}
