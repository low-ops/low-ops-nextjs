'use client';

import { getQueryClient } from '@/lib/get-query-client';
import { QueryClientProvider } from '@tanstack/react-query';
import { FC } from 'react';

type IProps = {
  children: React.ReactNode;
};

const Providers: FC<IProps> = (props) => {
  const { children } = props;

  return <QueryClientProvider client={getQueryClient()}>{children}</QueryClientProvider>;
};

export default Providers;
