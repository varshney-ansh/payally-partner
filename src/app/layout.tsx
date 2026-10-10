import type { Metadata } from "next";
import localFont from 'next/font/local'
import "./globals.css";

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
    <html lang="en">
      <body className={`${googleSansFlex.variable}`}>
        {children}
      </body>
    </html>
  );
}
