interface ProgressBarProps {
  progress: number;
  step?: string;
}

export default function ProgressBar({ progress, step }: ProgressBarProps) {
  return (
    <div className="progress-bar-container">
      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${Math.min(progress, 100)}%` }} />
      </div>
      <span className="progress-text">{step || `${Math.round(progress)}%`}</span>
    </div>
  );
}