import styles from './ReportConfirm.module.css';

interface ReportConfirmProps {
  visible: boolean;
}

export function ReportConfirm({ visible }: ReportConfirmProps) {
  if (!visible) return null;

  return (
    <div className={styles.container}>
      Reported — skipping
    </div>
  );
}
