import Head from 'next/head';

export default function Home() {
  return (
    <>
      <Head>
        <title>Solana Trading Bot Dashboard</title>
        <meta name="description" content="Monitor and control your Solana trading bot from a modern web dashboard." />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
        color: '#fff',
        fontFamily: 'Inter, sans-serif'
      }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>
          🚀 Solana Trading Bot
        </h1>
        <p style={{ fontSize: '1.25rem', maxWidth: 500, textAlign: 'center', marginBottom: '2rem' }}>
          Welcome to your Solana Trading Bot dashboard. Here you can monitor your bot, view trading stats, and manage your settings.
        </p>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <a href="/dashboard" style={{
            padding: '0.75rem 1.5rem',
            background: '#00ffa3',
            color: '#1e3c72',
            borderRadius: '8px',
            textDecoration: 'none',
            fontWeight: 600
          }}>
            Go to Dashboard
          </a>
          <a href="/api/docs" style={{
            padding: '0.75rem 1.5rem',
            background: '#fff',
            color: '#2a5298',
            borderRadius: '8px',
            textDecoration: 'none',
            fontWeight: 600
          }}>
            API Docs
          </a>
        </div>
        <footer style={{ marginTop: '3rem', fontSize: '0.9rem', opacity: 0.7 }}>
          &copy; {new Date().getFullYear()} Solana Trading Bot
        </footer>
      </main>
    </>
  );
}
