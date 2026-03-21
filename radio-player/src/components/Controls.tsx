import styles from './Controls.module.css';
import type { PlayerStatus } from '../hooks/usePlayer';

interface ControlsProps {
  status: PlayerStatus;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onSkip: () => void;
  onReport: () => void;
}

export function Controls({
  status,
  isPlaying,
  onTogglePlay,
  onSkip,
  onReport,
}: ControlsProps) {
  const disabled = status === 'loading' || status === 'idle';

  return (
    <div className={styles.container}>
      <button
        className={styles.btn}
        onClick={onTogglePlay}
        disabled={status === 'loading'}
        title={isPlaying ? 'Pause' : 'Play'}
      >
        {isPlaying ? '\u2590\u2590' : '\u25B6'}
        <span className={styles.label}>
          {status === 'idle' ? 'Play' : isPlaying ? 'Pause' : 'Play'}
        </span>
      </button>
      <button
        className={styles.btn}
        onClick={onSkip}
        disabled={disabled}
        title="Skip"
      >
        {'\u25B6\u25B6'}
        <span className={styles.label}>Skip</span>
      </button>
      <button
        className={`${styles.btn} ${styles.reportBtn}`}
        onClick={onReport}
        disabled={disabled}
        title="Report"
      >
        {'\u2691'}
        <span className={styles.label}>Report</span>
      </button>
    </div>
  );
}
