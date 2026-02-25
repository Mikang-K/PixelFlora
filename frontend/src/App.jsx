import { useCallback } from 'react';
import Canvas from './components/Canvas';
import ServerInfo from './components/ServerInfo';
import StormButton from './components/StormButton';
import InstanceLegend from './components/InstanceLegend';
import { useSocket } from './hooks/useSocket';

export default function App() {
  const { isConnected, serverInfo, pixels, stormActive, instances, placePixel, startStorm, stopStorm, backendUrl } =
    useSocket();

  const handlePixelClick = useCallback((x, y) => placePixel(x, y), [placePixel]);

  return (
    <div style={styles.app}>
      <header style={styles.header}>
        <h1 style={styles.title}>🌸 Pixel Flora</h1>
        <p style={styles.subtitle}>분산 시스템 기반의 실시간 협동 픽셀 아트 정원</p>
      </header>

      <div style={styles.toolbar}>
        <ServerInfo serverInfo={serverInfo} isConnected={isConnected} />
        <div style={{ flex: 1 }} />
        <div style={styles.hint}>캔버스를 클릭하여 꽃을 피워보세요</div>
      </div>

      <div style={styles.main}>
        <div style={styles.canvasWrapper}>
          <Canvas pixels={pixels} onPixelClick={handlePixelClick} />
        </div>

        <aside style={styles.sidebar}>
          <InstanceLegend instances={instances} />
          <StormButton stormActive={stormActive} onStart={startStorm} onStop={stopStorm} />

          <div style={styles.stats}>
            <div style={styles.statTitle}>캔버스 현황</div>
            <div style={styles.statRow}>
              <span>총 픽셀 수</span>
              <span style={styles.statValue}>{Object.keys(pixels).length.toLocaleString()}</span>
            </div>
            <div style={styles.statRow}>
              <span>활성 인스턴스</span>
              <span style={styles.statValue}>
                {Object.values(instances).filter((i) => i.active).length}
              </span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

const styles = {
  app: {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    padding: 16,
    gap: 12,
    overflow: 'hidden',
  },
  header: {
    textAlign: 'center',
    padding: '8px 0',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#e6edf3',
  },
  subtitle: {
    fontSize: 13,
    color: '#8b949e',
    marginTop: 4,
  },
  toolbar: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  hint: {
    fontSize: 13,
    color: '#8b949e',
    padding: '8px 16px',
    background: '#161b22',
    borderRadius: 8,
  },
  serverPicker: {
    display: 'flex',
    gap: 6,
  },
  serverBtn: {
    padding: '6px 14px',
    background: '#21262d',
    border: '1px solid #30363d',
    borderRadius: 6,
    color: '#8b949e',
    fontSize: 13,
    cursor: 'pointer',
  },
  serverBtnActive: {
    background: '#1f6feb',
    borderColor: '#1f6feb',
    color: '#fff',
  },
  main: {
    display: 'flex',
    gap: 16,
    alignItems: 'stretch',
    flex: 1,
    minHeight: 0,
    overflow: 'hidden',
  },
  canvasWrapper: {
    flex: 1,
    overflow: 'hidden',
    position: 'relative',
    minWidth: 0,
  },
  sidebar: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    minWidth: 240,
  },
  stats: {
    padding: '12px 16px',
    background: '#161b22',
    borderRadius: 8,
    border: '1px solid #30363d',
  },
  statTitle: {
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#e6edf3',
    fontSize: 14,
  },
  statRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: 13,
    color: '#8b949e',
    padding: '3px 0',
  },
  statValue: {
    color: '#e6edf3',
    fontWeight: 'bold',
    fontFamily: 'monospace',
  },
};
