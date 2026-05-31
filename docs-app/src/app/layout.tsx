import { RootProvider } from 'fumadocs-ui/provider/next';
import type { ReactNode } from 'react';
import './global.css';

export const metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_DOCS_URL ?? 'http://localhost:3001'),
  icons: {
    icon: '/favicon.svg',
  },
  title: {
    default: 'Documentacion Farmacia POS',
    template: '%s | Documentacion Farmacia POS',
  },
  description: 'Documentacion operativa y farmacéutica para la aplicacion Pharmacy POS.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className="flex min-h-screen flex-col">
        <RootProvider>{children}</RootProvider>
      </body>
    </html>
  );
}
