import { QueryClient, isServer } from '@tanstack/react-query';

const makeQueryClient = () => {
  return new QueryClient({});
};

let browserClient: QueryClient | undefined = undefined;

export const getQueryClient = () => {
  if (isServer) {
    return makeQueryClient();
  }

  if (!browserClient) {
    browserClient = makeQueryClient();
  }

  return browserClient;
};
