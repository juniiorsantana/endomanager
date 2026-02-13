import type { Metadata } from 'next';
import { Poppins, PT_Sans } from 'next/font/google';
import './globals.css';
import { Toaster } from "@/components/ui/toaster"
import { ThemeProvider } from 'next-themes';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-poppins',
  display: 'swap',
});

const ptSans = PT_Sans({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-pt-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'Endoscam - Gestão de Serviços',
    template: '%s | Endoscam',
  },
  description: 'Painel de controle de serviços da Endoscam. Gestão eficiente de ordens de serviço e manutenção de equipamentos endoscópicos.',
  openGraph: {
    title: 'Endoscam - Gestão de Serviços',
    description: 'Painel de controle de serviços da Endoscam. Gestão eficiente de ordens de serviço e manutenção de equipamentos endoscópicos.',
    type: 'website',
    locale: 'pt_BR',
    siteName: 'Endoscam',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Endoscam - Gestão de Serviços',
    description: 'Painel de controle de serviços da Endoscam. Gestão eficiente de ordens de serviço e manutenção.',
  },
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={`${ptSans.variable} ${poppins.variable} font-body antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
