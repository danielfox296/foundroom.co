import styles from './TrackInfo.module.css';
import type { PlayerStatus } from '../hooks/usePlayer';

interface TrackInfoProps {
  title: string | null;
  progress: number;
  duration: number;
  status: PlayerStatus;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function TrackInfo({ title, progress, duration, status }: TrackInfoProps) {
  const displayTitle = status === 'loading' ? '...' : title || 'Now Playing';
  const pct = duration > 0 ? (progress / duration) * 100 : 0;

  return (
    <div className={styles.container}>
      <p className={styles.title}>{displayTitle}</p>
      <div className={styles.barOuter}>
        <div className={styles.barInner} style={{ width: `${pct}%` }} />
      </div>
      <div className={styles.times}>
        <span>{formatTime(progress)}</span>
        <span>{duration > 0 ? formatTime(duration) : '--:--'}</span>
      </div>
    </div>
  );
}
