export default function InstanceLegend({ instances }) {
  const entries = Object.entries(instances);
  if (entries.length === 0) return null;

  return (
    <div style={styles.container}>
      <div style={styles.title}>활성 인스턴스</div>
      <div style={styles.list}>
        {entries.map(([id, { color, active }]) => (
          <div key={id} style={{ ...styles.item, opacity: active ? 1 : 0.4 }}>
            <span
              style={{
                width: 12,
                height: 12,
                borderRadius: '50%',
                background: active ? color.primary : '#8b949e',
                display: 'inline-block',
                flexShrink: 0,
              }}
            />
            <span style={styles.id}>{id}</span>
            <span
              style={{
                padding: '1px 6px',
                borderRadius: 10,
                background: (active ? color.primary : '#8b949e') + '33',
                color: active ? color.primary : '#8b949e',
                fontSize: 11,
              }}
            >
              {color.theme}
            </span>
            {!active && <span style={{ fontSize: 11, color: '#8b949e' }}>종료됨</span>}
          </div>
        ))}
      </div>
    </div>
  );
}

const styles = {
  container: {
    padding: '12px 16px',
    background: '#161b22',
    borderRadius: 8,
    border: '1px solid #30363d',
    minWidth: 220,
  },
  title: { fontWeight: 'bold', marginBottom: 8, color: '#e6edf3', fontSize: 14 },
  list: { display: 'flex', flexDirection: 'column', gap: 6 },
  item: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontSize: 13,
    color: '#e6edf3',
  },
  id: {
    fontFamily: 'monospace',
    fontSize: 12,
    color: '#8b949e',
    flex: 1,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
};
