import React from 'react';
import './globals.css';

export const metadata = { title: 'Tirbeo Admin', description: 'Manage the Tirbeo platform' };

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body>{children}</body>
    </html>
  );
}
