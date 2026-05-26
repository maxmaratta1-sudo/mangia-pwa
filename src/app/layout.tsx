// This file is required by Next.js App Router.
// The real layout lives in app/[locale]/layout.tsx
// Here we just export the minimal HTML shell.

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
