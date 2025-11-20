"use client";
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

let client: QueryClient | null = null;
function getClient() {
  if (!client) {
    client = new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 30 * 1000,
          refetchOnWindowFocus: true,
          retry: 1,
        },
      },
    });
  }
  return client;
}

export const QueryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const qc = getClient();
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
};
