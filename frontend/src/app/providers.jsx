import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '../config/queryClient';

export const AppProviders = ({ children }) => {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
};


