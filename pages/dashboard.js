import Head from 'next/head';

export default function Dashboard() {
  return (
    <>
      <Head>
        <title>Dashboard | Solana Trading Bot</title>
      </Head>
      <main style={{
        minHeight: '100vh',
        padding: '2rem',
        background: 'linear-gradient(135deg, #232526 0%, #414345 100%)',
        color: '#fff',
        fontFamily: 'Inter, sans-serif',
      }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '2rem' }}>📊 Dashboard</h1>
        <section style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '2rem',
          justifyContent: 'center',
        }}>
          <div style={{
            background: '#222',
            padding: '2rem',
            borderRadius: '1rem',
            minWidth: '260px',
            boxShadow: '0 2px 16px rgba(0,0,0,0.15)'
          }}>
            <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>Bot Status</h2>
            <p>Status: <span style={{ color: '#00ffa3' }}>Online</span></p>
            <p>Mode: Simulation</p>
            <p>Uptime: 12h 45m</p>
          </div>
          <div style={{
            background: '#222',
            padding: '2rem',
            borderRadius: '1rem',
            minWidth: '260px',
            boxShadow: '0 2px 16px rgba(0,0,0,0.15)'
          }}>
            <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>Performance</h2>
            <p>24h Trades: 18</p>
            <p>24h Profit: <span style={{ color: '#00ffa3' }}>+2.34 SOL</span></p>
            <p>Opportunities: 7</p>
          </div>
          <div style={{
            background: '#222',
            padding: '2rem',
            borderRadius: '1rem',
            minWidth: '260px',
            boxShadow: '0 2px 16px rgba(0,0,0,0.15)'
          }}>
            <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>Quick Actions</h2>
            <button style={{
              background: '#00ffa3',
              color: '#232526',
              border: 'none',
              borderRadius: '6px',
              padding: '0.75rem 1.5rem',
              fontWeight: 600,
              cursor: 'pointer',
              marginBottom: '1rem',
              width: '100%'
            }}>Pause Bot</button>
            <button style={{
              background: '#fff',
              color: '#232526',
              border: 'none',
              borderRadius: '6px',
              padding: '0.75rem 1.5rem',
              fontWeight: 600,
              cursor: 'pointer',
              width: '100%'
            }}>Resume Bot</button>
          </div>
        </section>
      </main>
    </>
  );
}
