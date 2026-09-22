import { usePlayer } from '../hooks/usePlayer';
import { TrackInfo } from './TrackInfo';
import { Controls } from './Controls';
import { ReportConfirm } from './ReportConfirm';
import styles from './Player.module.css';

interface PlayerProps {
  username: string;
  isAdmin?: boolean;
  onLogout: () => void;
}

export function Player({ username, isAdmin, onLogout }: PlayerProps) {
  const {
    currentTrack,
    status,
    isPlaying,
    progress,
    duration,
    showReportConfirm,
    togglePlay,
    skip,
    report,
  } = usePlayer();

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <span className={styles.username}>{username}</span>
        <div>
          {isAdmin && (
            <button
              className={styles.logout}
              onClick={() => (window.location.hash = '#/admin')}
              style={{ marginRight: '0.75rem' }}
            >
              admin
            </button>
          )}
          <button className={styles.logout} onClick={onLogout}>
            logout
          </button>
        </div>
      </div>

      <TrackInfo
        title={currentTrack?.title ?? null}
        progress={progress}
        duration={duration}
        status={status}
      />

      <Controls
        status={status}
        isPlaying={isPlaying}
        onTogglePlay={togglePlay}
        onSkip={skip}
        onReport={report}
      />

      <ReportConfirm visible={showReportConfirm} />
    </div>
  );
}
