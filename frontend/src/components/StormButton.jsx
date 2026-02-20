import { useState } from 'react';

export default function StormButton({ stormActive, onStart, onStop }) {
  const [duration, setDuration] = useState(30);

  return (
    <div style={styles.container}>
      <div style={styles.label}>⛈ Storm Mode</div>
      <div style={styles.row}>
        <label style={styles.durationLabel}>
          지속 시간:
          <input
            type="number"
            min={5}
            max={120}
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
            style={styles.input}
            disabled={stormActive}
          />
          초
        </label>
        {stormActive ? (
          <button onClick={onStop} style={{ ...styles.btn, ...styles.stopBtn }}>
            ■ 폭풍 중단
          </button>
        ) : (
          <button onClick={() => onStart(duration * 1000)} style={{ ...styles.btn, ...styles.startBtn }}>
            ▶ 폭풍 시작
          </button>
        )}
      </div>
      {stormActive && (
        <div style={styles.warning}>
          CPU 부하 중... Auto Scaling 트리거 대기 중
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    padding: '12px 16px',
    background: '#161b22',
    borderRadius: 8,
    border: '1px solid #30363d',
  },
  label: { fontWeight: 'bold', marginBottom: 8, color: '#e6edf3' },
  row: { display: 'flex', alignItems: 'center', gap: 12 },
  durationLabel: { display: 'flex', alignItems: 'center', gap: 6, color: '#8b949e', fontSize: 14 },
  input: {
    width: 56,
    padding: '4px 8px',
    background: '#0d1117',
    border: '1px solid #30363d',
    borderRadius: 4,
    color: '#e6edf3',
    textAlign: 'center',
  },
  btn: {
    padding: '6px 16px',
    border: 'none',
    borderRadius: 6,
    cursor: 'pointer',
    fontWeight: 'bold',
    fontSize: 14,
  },
  startBtn: { background: '#1f6feb', color: '#fff' },
  stopBtn: { background: '#f85149', color: '#fff' },
  warning: {
    marginTop: 8,
    fontSize: 12,
    color: '#d29922',
    animation: 'pulse 1.5s infinite',
  },
};
