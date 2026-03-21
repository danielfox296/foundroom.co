import { usePlayer } from '../hooks/usePlayer';
import { TrackInfo } from './TrackInfo';
import { Controls } from './Controls';
import { ReportConfirm } from './ReportConfirm';
import styles from './Player.module.css';

interface PlayerProps {
  username: string;
  onLogout: () => void;
}

export function Player({ username, onLogout }: PlayerProps) {
  const {
    currentTrack,
    status,
    isPlaying,
    progress,
    duration,
    showReportConfirm,
    start,
    togglePlay,
    skip,
    report,
  } = usePlayer();

  // Don't auto-start — browsers block audio.play() without a user gesture.
  // User clicks the play button → togglePlay → start() runs from a click handler.

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <span className={styles.username}>{username}</span>
        <button className={styles.logout} onClick={onLogout}>
          logout
        </button>
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

      {status === 'error' && (
        <p style={{ color: '#ff6b6b', fontSize: '0.85rem', textAlign: 'center', marginTop: '0.5rem' }}>
          Playback error — check browser console (F12) for details
        </p>
      )}
    </div>
  );
}
