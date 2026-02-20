export default function ServerInfo({ serverInfo, isConnected }) {
  if (!isConnected) {
    return (
      <div style={styles.container}>
        <span style={{ color: '#f85149' }}>● 연결 끊김</span>
      </div>
    );
  }

  if (!serverInfo) {
    return (
      <div style={styles.container}>
        <span style={{ color: '#8b949e' }}>● 연결 중...</span>
      </div>
    );
  }

  const { instanceId, color } = serverInfo;

  return (
    <div style={styles.container}>
      <span style={{ color: '#3fb950' }}>●</span>
      <span style={{ color: '#8b949e', marginLeft: 6 }}>연결된 서버:</span>
      <span
        style={{
          marginLeft: 8,
          color: color.primary,
          fontWeight: 'bold',
          fontFamily: 'monospace',
        }}
      >
        {instanceId}
      </span>
      <span
        style={{
          marginLeft: 8,
          padding: '2px 8px',
          borderRadius: 12,
          background: color.primary + '33',
          color: color.primary,
          fontSize: 12,
        }}
      >
        {color.theme}
      </span>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    alignItems: 'center',
    padding: '8px 16px',
    background: '#161b22',
    borderRadius: 8,
    fontSize: 14,
    gap: 2,
  },
};
