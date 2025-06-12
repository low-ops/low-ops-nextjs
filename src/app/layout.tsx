import Providers from '@/components/Providers';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import type React from 'react';
import { FC } from 'react';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Task Management App',
  description: 'A simple task management app like Trello',
};

type TProps = {
  children: React.ReactNode;
};

const RootLayout: FC<TProps> = (props) => {
  const { children } = props;

  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
};

export default RootLayout;
