import { useState, useEffect } from 'react';
import { useAuth } from './hooks/useAuth';
import { AuthGate } from './components/AuthGate';
import { Player } from './components/Player';
import { Admin } from './components/Admin';

function getRoute(): 'player' | 'admin' {
  return window.location.hash === '#/admin' ? 'admin' : 'player';
}

export default function App() {
  const { isAuthenticated, username, isAdmin, login, logout } = useAuth();
  const [route, setRoute] = useState(getRoute);

  useEffect(() => {
    const onHash = () => setRoute(getRoute());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  if (!isAuthenticated) {
    return <AuthGate onLogin={login} />;
  }

  if (route === 'admin' && isAdmin) {
    return (
      <Admin
        onBack={() => (window.location.hash = '')}
        onLogout={logout}
      />
    );
  }

  return (
    <Player
      username={username}
      isAdmin={isAdmin}
      onLogout={logout}
    />
  );
}
