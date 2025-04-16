import { useState, useEffect } from 'react';
import MainLayout from '../components/layout/MainLayout';
import ProtectedRoute from '../components/auth/ProtectedRoute';
import { useAuth } from '../contexts/AuthContext';
import { tradingAPI } from '../utils/api';
import Link from 'next/link';
import dynamic from 'next/dynamic';

// Dynamically import ConnectionStatus with no SSR
const ConnectionStatus = dynamic(
  () => import('../dashboard/src/components/ConnectionStatus'),
  { ssr: false }
);

export default function Dashboard() {
  const { currentUser } = useAuth();
  const [botStatus, setBotStatus] = useState('online');
  const [performanceData, setPerformanceData] = useState({
    trades24h: 0,
    profit24h: 0,
    winRate: 0,
    opportunities: 0
  });
  const [recentTrades, setRecentTrades] = useState([]);
  const [activeStrategies, setActiveStrategies] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch data from the API
  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      setError('');

      try {
        // Fetch bot status
        const statusResponse = await tradingAPI.getBotStatus();
        setBotStatus(statusResponse.status);

        // Fetch performance metrics
        const metricsResponse = await tradingAPI.getPerformanceMetrics('24h');
        setPerformanceData({
          trades24h: metricsResponse.totalTrades || 0,
          profit24h: metricsResponse.totalProfit || 0,
          winRate: metricsResponse.winRate || 0,
          opportunities: metricsResponse.opportunities || 0
        });

        // Fetch recent trades
        const tradesResponse = await tradingAPI.getRecentTrades(5);
        setRecentTrades(tradesResponse.trades || []);

        // Fetch active strategies
        const strategiesResponse = await tradingAPI.getActiveStrategies();
        setActiveStrategies(strategiesResponse.strategies || []);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data. Please try again.');

        // Set some mock data for development
        setPerformanceData({
          trades24h: 18,
          profit24h: 2.34,
          winRate: 72,
          opportunities: 7
        });

        setRecentTrades([
          { id: 1, time: '10:23 AM', pair: 'SOL/USDC', type: 'Buy', price: 22.45, profit: 0.12 },
          { id: 2, time: '09:47 AM', pair: 'SOL/USDT', type: 'Sell', price: 22.38, profit: -0.05 },
          { id: 3, time: '09:12 AM', pair: 'SOL/USDC', type: 'Buy', price: 22.30, profit: 0.18 }
        ]);

        setActiveStrategies([
          { id: 1, name: 'Arbitrage Strategy', status: 'active', description: 'Exploits price differences between exchanges', profit: 1.45, trades: 12 },
          { id: 2, name: 'MACD Crossover', status: 'active', description: 'Trades based on MACD indicator crossovers', profit: 0.89, trades: 6 }
        ]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();

    // Set up polling to refresh data every 30 seconds
    const intervalId = setInterval(fetchDashboardData, 30000);

    // Clean up interval on component unmount
    return () => clearInterval(intervalId);
  }, []);

  const toggleBotStatus = async () => {
    try {
      const newStatus = botStatus === 'online' ? 'paused' : 'online';
      await tradingAPI.toggleBotStatus(newStatus);
      setBotStatus(newStatus);
    } catch (err) {
      console.error('Error toggling bot status:', err);
      setError('Failed to update bot status. Please try again.');
    }
  };

  return (
    <ProtectedRoute>
      <MainLayout title="Dashboard | SolarBot">
      <div className="dashboard-layout">
        <aside className="dashboard-sidebar">
          <div className="dashboard-logo">SolarBot</div>
          <nav className="dashboard-nav">
            <Link href="/dashboard" className="dashboard-nav-item active">
              <span className="dashboard-nav-icon">📊</span>
              Dashboard
            </Link>
            <Link href="/trading" className="dashboard-nav-item">
              <span className="dashboard-nav-icon">📈</span>
              Trading
            </Link>
            <Link href="/strategies" className="dashboard-nav-item">
              <span className="dashboard-nav-icon">⚙️</span>
              Strategies
            </Link>
            <Link href="/portfolio" className="dashboard-nav-item">
              <span className="dashboard-nav-icon">💰</span>
              Portfolio
            </Link>
            <Link href="/history" className="dashboard-nav-item">
              <span className="dashboard-nav-icon">📝</span>
              History
            </Link>
            <Link href="/risk-management" className="dashboard-nav-item">
              <span className="dashboard-nav-icon">⚠️</span>
              Risk Management
            </Link>
            <Link href="/alerts" className="dashboard-nav-item">
              <span className="dashboard-nav-icon">🔔</span>
              Alerts
            </Link>
            <Link href="/settings" className="dashboard-nav-item">
              <span className="dashboard-nav-icon">⚙️</span>
              Settings
            </Link>
          </nav>
        </aside>

        <main className="dashboard-content">
          <header className="dashboard-header">
            <div className="flex items-center">
              <h1 className="dashboard-title mr-4">Dashboard</h1>
              <ConnectionStatus />
            </div>
            <div className="dashboard-user">
              <div className="dashboard-user-avatar"></div>
              <span className="dashboard-user-name">{currentUser?.name || currentUser?.username || 'User'}</span>
            </div>
          </header>

          <div className="grid grid-cols-3 gap-6 mb-8 md:grid-cols-2 sm:grid-cols-1">
            <div className="dashboard-card">
              <h2 className="dashboard-card-title">Bot Status</h2>
              <p className="mb-2">Status: <span className={botStatus === 'online' ? 'text-green-500 font-medium' : 'text-yellow-500 font-medium'}>
                {botStatus === 'online' ? 'Online' : 'Paused'}
              </span></p>
              <p className="mb-2">Mode: <span className="font-medium">Simulation</span></p>
              <p className="mb-2">Uptime: <span className="font-medium">12h 45m</span></p>
              <p>Last Activity: <span className="font-medium">5 minutes ago</span></p>
            </div>

            <div className="dashboard-card">
              <h2 className="dashboard-card-title">Performance</h2>
              <p className="mb-2">24h Trades: <span className="font-medium">{performanceData.trades24h}</span></p>
              <p className="mb-2">24h Profit: <span className={`font-medium ${performanceData.profit24h >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {performanceData.profit24h >= 0 ? '+' : ''}{performanceData.profit24h} SOL
              </span></p>
              <p className="mb-2">Win Rate: <span className="font-medium">{performanceData.winRate}%</span></p>
              <p>Opportunities: <span className="font-medium">{performanceData.opportunities} available</span></p>
            </div>

            <div className="dashboard-card">
              <h2 className="dashboard-card-title">Quick Actions</h2>
              <button
                onClick={toggleBotStatus}
                className={`w-full mb-4 py-2 px-4 rounded-md font-medium ${botStatus === 'online' ? 'bg-yellow-500 text-white' : 'bg-green-500 text-white'}`}
              >
                {botStatus === 'online' ? 'Pause Bot' : 'Resume Bot'}
              </button>
              <button className="w-full py-2 px-4 bg-blue-500 text-white rounded-md font-medium">
                View Trading Logs
              </button>
            </div>
          </div>

          <div className="dashboard-card mb-8">
            <h2 className="dashboard-card-title">Trading Performance</h2>
            <div className="h-64 bg-gray-100 rounded-md flex items-center justify-center">
              <span className="text-gray-500">Performance Chart</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6 md:grid-cols-1">
            <div className="dashboard-card">
              <h2 className="dashboard-card-title">Recent Trades</h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="py-2 text-left">Time</th>
                      <th className="py-2 text-left">Pair</th>
                      <th className="py-2 text-left">Type</th>
                      <th className="py-2 text-left">Price</th>
                      <th className="py-2 text-left">Profit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentTrades.length > 0 ? (
                      recentTrades.map((trade) => (
                        <tr key={trade.id} className="border-b">
                          <td className="py-2">{trade.time}</td>
                          <td className="py-2">{trade.pair}</td>
                          <td className="py-2">{trade.type}</td>
                          <td className="py-2">${trade.price.toFixed(2)}</td>
                          <td className={`py-2 ${trade.profit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                            {trade.profit >= 0 ? '+' : ''}{trade.profit.toFixed(2)} SOL
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="5" className="py-4 text-center text-gray-500">
                          {isLoading ? 'Loading trades...' : 'No recent trades found'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="dashboard-card">
              <h2 className="dashboard-card-title">Active Strategies</h2>
              <div className="space-y-4">
                {activeStrategies.length > 0 ? (
                  activeStrategies.map((strategy) => (
                    <div key={strategy.id} className="p-4 border border-gray-200 rounded-md">
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="font-medium">{strategy.name}</h3>
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                          {strategy.status === 'active' ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{strategy.description}</p>
                      <div className="flex justify-between text-sm">
                        <span>Profit: <span className={strategy.profit >= 0 ? 'text-green-500' : 'text-red-500'}>
                          {strategy.profit >= 0 ? '+' : ''}{strategy.profit} SOL
                        </span></span>
                        <span>Trades: {strategy.trades}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-4 border border-gray-200 rounded-md text-center text-gray-500">
                    {isLoading ? 'Loading strategies...' : 'No active strategies found'}
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </MainLayout>
    </ProtectedRoute>
  );
}
