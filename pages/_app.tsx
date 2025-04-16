import '../styles/globals.css';
import '../styles/custom.css';
import type { AppProps } from 'next/app';
import { AuthProvider } from '../contexts/AuthContext';
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';

// Dynamically import SolanaConnectionProvider with no SSR
const SolanaConnectionProvider = dynamic(
  () => import('../dashboard/src/components/SolanaConnectionProvider').then(mod => mod.SolanaConnectionProvider),
  { ssr: false }
);

function MyApp({ Component, pageProps }: AppProps) {
  const router = useRouter();

  // Add analytics or other global effects here
  useEffect(() => {
    const handleRouteChange = (url: string) => {
      // Track page views here if needed
      console.log(`Route changed to: ${url}`);
    };

    router.events.on('routeChangeComplete', handleRouteChange);

    return () => {
      router.events.off('routeChangeComplete', handleRouteChange);
    };
  }, [router.events]);

  // Only use SolanaConnectionProvider for dashboard routes
  const isDashboardRoute = router.pathname.startsWith('/dashboard') ||
                          router.pathname === '/' ||
                          router.pathname === '/login';

  return (
    <AuthProvider>
      {isDashboardRoute ? (
        <SolanaConnectionProvider>
          <Component {...pageProps} />
        </SolanaConnectionProvider>
      ) : (
        <Component {...pageProps} />
      )}
    </AuthProvider>
  );
}

export default MyApp;
