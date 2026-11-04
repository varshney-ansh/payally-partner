import type { Metadata } from "next";
import localFont from 'next/font/local'
import "@cloudscape-design/global-styles/index.css"
import "./payally-theme.css"
import "./globals.css"

import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";

const geist = Geist({ subsets: ['latin'], variable: '--font-sans' });

const googleSansFlex = localFont({
  src: '../../public/fonts/Google_Sans_Flex/GoogleSansFlex-VariableFont_GRAD,ROND,opsz,slnt,wdth,wght.ttf', // Adjust path to your font file
  variable: '--font-google-sans-flex',
  display: 'swap',
})

export const metadata: Metadata = {
  title: "Payally Partner",
  description: "Payally partner",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn("font-sans", geist.variable)}>
      <head>
        <link rel="icon" type="image/png" href="/favicon-96x96.png" sizes="96x96" />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="shortcut icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <meta name="apple-mobile-web-app-title" content="Partners" />
        <link rel="manifest" href="/site.webmanifest" />
      </head>
      <body className={`${googleSansFlex.variable}`}>
        {children}
      </body>
    </html>
  );
}
