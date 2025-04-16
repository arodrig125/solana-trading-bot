import { useEffect, useState } from 'react';
import Head from 'next/head';

export default function AdminUsers() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [token, setToken] = useState('');

  // Fetch users on mount if token is set
  useEffect(() => {
    if (!token) return;
    setLoading(true);
    fetch('/api/users', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(async (res) => {
        if (!res.ok) throw new Error((await res.json()).error || 'Failed to fetch users');
        return res.json();
      })
      .then(setUsers)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [token]);

  // Simple login form for JWT
  function LoginForm() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loginError, setLoginError] = useState('');
    const handleLogin = async (e: React.FormEvent) => {
      e.preventDefault();
      setLoginError('');
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (res.ok && data.token) {
        setToken(data.token);
      } else {
        setLoginError(data.error || 'Login failed');
      }
    };
    return (
      <form className="max-w-sm mx-auto mt-10 p-6 bg-white rounded shadow" onSubmit={handleLogin}>
        <h2 className="text-xl font-bold mb-4">Admin Login</h2>
        <input
          className="block w-full mb-2 p-2 border rounded"
          type="text"
          placeholder="Username"
          value={username}
          onChange={e => setUsername(e.target.value)}
        />
        <input
          className="block w-full mb-4 p-2 border rounded"
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
        />
        {loginError && <div className="text-red-500 mb-2">{loginError}</div>}
        <button className="bg-blue-600 text-white px-4 py-2 rounded w-full" type="submit">Login</button>
      </form>
    );
  }

  return (
    <>
      <Head>
        <title>User Management Console</title>
      </Head>
      <div className="min-h-screen bg-gray-100">
        {!token ? (
          <LoginForm />
        ) : (
          <div className="max-w-3xl mx-auto py-10">
            <h1 className="text-3xl font-bold mb-6">User Management</h1>
            {loading ? (
              <div>Loading users...</div>
            ) : error ? (
              <div className="text-red-500">{error}</div>
            ) : (
              <table className="min-w-full bg-white rounded shadow">
                <thead>
                  <tr>
                    <th className="py-2 px-4 border-b">Username</th>
                    <th className="py-2 px-4 border-b">Role</th>
                    <th className="py-2 px-4 border-b">Active</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u._id}>
                      <td className="py-2 px-4 border-b">{u.username}</td>
                      <td className="py-2 px-4 border-b">{u.role}</td>
                      <td className="py-2 px-4 border-b">{u.active ? 'Yes' : 'No'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            <button className="mt-6 bg-gray-300 px-4 py-2 rounded" onClick={() => setToken('')}>Logout</button>
          </div>
        )}
      </div>
    </>
  );
}
