export default function StormButton({ stormActive, onStart, onStop }) {
  return (
    <div style={styles.container}>
      <div style={styles.label}>⛈ Storm Mode</div>
      <div style={styles.row}>
        {stormActive ? (
          <button onClick={onStop} style={{ ...styles.btn, ...styles.stopBtn }}>
            ■ 폭풍 중단
          </button>
        ) : (
          <button onClick={onStart} style={{ ...styles.btn, ...styles.startBtn }}>
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
