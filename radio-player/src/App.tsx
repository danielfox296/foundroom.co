import { useAuth } from './hooks/useAuth';
import { AuthGate } from './components/AuthGate';
import { Player } from './components/Player';

export default function App() {
  const { isAuthenticated, username, login, logout } = useAuth();

  if (!isAuthenticated) {
    return <AuthGate onLogin={login} />;
  }

  return <Player username={username} onLogout={logout} />;
}
