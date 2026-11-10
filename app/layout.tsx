import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata={title:"The Daily List — NPR, then done",description:"A text-only daily list of NPR stories with a clear stopping point."};
export default function RootLayout({children}:Readonly<{children:React.ReactNode}>){return <html lang="en"><body>{children}</body></html>}
