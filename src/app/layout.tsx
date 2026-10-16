import type { Metadata } from "next";
import localFont from 'next/font/local'
import "@cloudscape-design/global-styles/index.css"
import "./payally-theme.css"
import "./globals.css"

import TopNavigation from "@cloudscape-design/components/top-navigation";
import { Box, SpaceBetween } from "@cloudscape-design/components";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

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
      <body className={`${googleSansFlex.variable}`}>
        {children}
      </body>
    </html>
  );
}
