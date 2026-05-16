import { RootProvider } from 'fumadocs-ui/provider/next';
import type { ReactNode } from 'react';
import './global.css';

export const metadata = {
  title: {
    default: 'Documentacion Farmacia POS',
    template: '%s | Documentacion Farmacia POS',
  },
  description: 'Documentacion tecnica y operativa para la aplicacion Pharmacy POS.',
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
