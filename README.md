# **📋 프로젝트 명세서: Pixel Flora (픽셀 플로라)**

<aside>
💡

**부제:** 분산 시스템 기반의 실시간 협동 픽셀 아트 정원

</aside>

## **1. 프로젝트 개요**

사용자가 웹 캔버스에 클릭하여 픽셀 꽃을 피우는 인터랙티브 게임입니다. 각 접속 요청은 **로드밸런서(ALB)**를 통해 여러 **EC2 인스턴스**로 분산되며, 각 인스턴스는 고유한 색상 계통을 가집니다. 서버 부하가 높아지면 **오토스케일링(ASG)**이 작동하여 새로운 색상의 꽃을 피우는 서버가 자동으로 투입됩니다.

---

## **2. 주요 기능 (Core Features)**

### **🌸 실시간 픽셀 가드닝**

- **클릭 이벤트:** 캔버스 클릭 시 해당 좌표에 픽셀 형태의 꽃 생성.
- **색상 혼합:** 이미 피어있는 다른 색상의 꽃을 클릭할 경우, 두 색상이 섞인 중간 색 픽셀 생성.
    
    ![Image](https://github.com/user-attachments/assets/4bc36beb-af44-49c7-af07-16b2c7e31e22)

### **📈 오토스케일링 시각화**

- **부하 유발 (Storm Mode):** 사용자가 '폭풍우' 버튼을 누르면 서버에서 복잡한 연산을 수행하여 CPU 점유율 급증.
- **동적 확장:** CPU 임계치 초과 시 ASG가 새 인스턴스를 실행. 잠시 후 캔버스에 **새로운 색상의 꽃**이 등장하며 시스템 안정화 시각화.
- **서버 종료 (Scale-in):** 부하 감소로 서버가 종료되면 해당 색상의 꽃들이 회색(Grayscale)으로 변함.

<img width="1889" height="897" alt="Image" src="https://github.com/user-attachments/assets/b9489fdf-d900-4095-b0df-34d901f4e72c" />

<p align="center">
    <img src="https://github.com/user-attachments/assets/d1a345cc-020d-4fbb-a556-76c84fa4b667" width="33%"/>
    <img src="https://github.com/user-attachments/assets/7e115fd6-dc0f-49bc-8c29-9b2833a54ce8" width="33%"/>
    <img src="https://github.com/user-attachments/assets/94d78ffb-caa7-4582-8eb9-cf891a9b301a" width="33%"/>
</p>
---

## **3. 기술 스택 (Tech Stack)**

| **구분** | **기술** | **역할** |
| --- | --- | --- |
| **Frontend** | Vite, React, Canvas API | 픽셀 렌더링 및 실시간 인터렉션 |
| **Backend** | Node.js (Express) | API 처리 및 서버 고유 ID/색상 반환 |
| **Real-time** | Socket.io | 여러 사용자 간의 꽃 좌표 동기화 |
| **Infrastructure** | AWS (ALB, ASG, EC2), Terraform | 로드밸런싱 및 자동 확장 환경 구축 |
| **Database** | Redis (ElastiCache) | 모든 서버가 공유하는 꽃의 위치/색상 데이터 저장 |
| **로컬 개발** | Docker Compose (Redis 컨테이너) |  |

---

## **4. 아키텍처 및 데이터 흐름**  

<img width="1200" height="595" alt="Image" src="https://github.com/user-attachments/assets/831f3e63-786b-4ce0-bcf2-bd4ac52a4127" />

1. **사용자 접속:** ALB DNS로 접속 시, ALB가 현재 활성화된 EC2 중 하나로 연결.
2. **서버 식별:** 각 EC2는 시작 시 자신의 `Instance ID`를 기반으로 고유 색상(Red, Blue 등)을 결
3. **데이터 공유:** * 사용자가 꽃을 피우면 서버는 해당 좌표와 색상을 **Redis**에 저장.
    - Redis의 Pub/Sub 기능을 통해 모든 서버에 접속 중인 사용자에게 실시간 업데이트 전송.
4. **확장성:** CloudWatch가 CPU 사용량을 감시.
    - 부하 발생 시 ASG가 새 EC2를 띄우고, ALB가 이를 감지해 새로운 색상(예: 노란색)의 트래픽을 처리하기 시작.

## 전체 디렉터리 구조

```
/PixelFlora/
├── docker-compose.yml
├── .env.example
├── .gitignore
│
├── frontend/
│   ├── package.json
│   ├── vite.config.js
│   ├── index.html
│   └── src/
│       ├── main.jsx
│       ├── App.jsx
│       ├── components/
│       │   ├── Canvas.jsx          # Canvas API 픽셀 렌더링 (핵심)
│       │   ├── ServerInfo.jsx      # 연결된 인스턴스 정보 표시
│       │   ├── StormButton.jsx     # CPU 부하 유발 버튼
│       │   └── InstanceLegend.jsx  # 색상-인스턴스 범례
│       ├── hooks/
│       │   ├── useSocket.js        # Socket.io 연결·이벤트 관리
│       │   └── useCanvas.js        # Canvas 드로잉 로직
│       └── utils/
│           ├── colorMixer.js       # 색상 혼합·회색화 로직
│           └── pixelFlower.js      # 5x5 꽃 픽셀 패턴
│
├── backend/
│   ├── package.json
│   ├── server.js
│   ├── config/
│   │   ├── redis.js                # ioredis 클라이언트 2개 (일반용 + Pub/Sub용)
│   │   └── instanceConfig.js       # EC2 인스턴스 → 색상 결정 (핵심)
│   ├── routes/
│   │   ├── api.js
│   │   └── health.js               # ALB Health Check
│   ├── services/
│   │   ├── pixelService.js         # Redis HSET/HGETALL + 색상 혼합
│   │   ├── redisPublisher.js       # Redis PUBLISH
│   │   ├── redisSubscriber.js      # Redis SUBSCRIBE → io.emit (멀티 인스턴스 핵심)
│   │   └── stormService.js         # Worker Thread CPU 부하
│   ├── socket/
│   │   └── socketHandler.js        # Socket.io 이벤트 허브
│   └── scripts/
│       └── stressCpu.js            # CPU 스트레스 워커
│
└── infrastructure/
    ├── main.tf
    ├── variables.tf
    ├── outputs.tf
    ├── modules/
    │   ├── networking/             # VPC, Subnet, Security Groups
    │   ├── compute/                # EC2 Launch Template, ASG, ALB, Scaling Policy
    │   └── database/               # ElastiCache Redis (선택적)
    └── user_data/
        └── startup.sh              # EC2 부팅 시 앱 자동 시작
```

## Redis 데이터 스키마

`# 픽셀 맵 (Hash)
KEY:   pixels
FIELD: "x:y"          예) "42:31"
VALUE: JSON           {"color":"#FF4444","instanceId":"i-0abc123","timestamp":1708400000}

# 인스턴스 레지스트리 (Hash)
KEY:   instances
FIELD: instanceId
VALUE: JSON           {"color":"#FF4444","theme":"red","lastSeen":1708400000,"active":true}

# Pub/Sub 채널
CHANNEL: pixel-events
메시지 타입:
  { "type": "PIXEL_PLACED", "x": 42, "y": 31, "color": "#FF4444", "instanceId": "..." }
  { "type": "PIXEL_MIXED",  "x": 42, "y": 31, "color": "#AA2288", "instanceId": "..." }
  { "type": "GRAYSCALE",    "instanceId": "..." }  # 인스턴스 종료 시`

---

## API 설계

### REST API

| Method | Path | 용도 |
| --- | --- | --- |
| GET | /health | ALB Health Check → { status, instanceId, color } |
| GET | /api/pixels | 전체 픽셀 맵 반환 |
| GET | /api/server-info | 현재 인스턴스 색상/ID |
| POST | /api/storm/start | CPU 부하 시작 |
| POST | /api/storm/stop | CPU 부하 중단 |

### Socket.io 이벤트

| 방향 | 이벤트 | 데이터 |
| --- | --- | --- |
| S→C | `server:info` | `{ instanceId, color: { primary, secondary, theme } }` |
| S→C | `pixels:init` | `{ "x:y": { color, instanceId, timestamp }, ... }` |
| S→C | `pixel:update` | `{ type, x, y, color, instanceId }` |
| S→C | `instance:join` | `{ instanceId, color }` |
| S→C | `instance:leave` | `{ instanceId }` |
| C→S | `pixel:place` | `{ x: number, y: number }` |
| C→S | `storm:start` | `{ durationMs: number }` |
| C→S | `storm:stop` | `{}` |

---

## **5. 단계별 구현 계획**

1.  **1단계 (MVP):** 단일 EC2에서 캔버스에 점 찍기 구현 + Redis 연동.
2. **2단계 (AWS 구축):** AMI 생성 후 ALB와 ASG 설정. 수동으로 인스턴스를 늘려보며 색상이 바뀌는지 확인.
3. **3단계 (동기화):** Socket.io를 활용해 서로 다른 인스턴스에 접속한 유저끼리 꽃이 보이는지 테스트.
4. **4단계 (고도화):** CPU 부하 스크립트 작성 및 오토스케일링 정책(Target Tracking) 최적화.

### Phase 1 — MVP (로컬 단일 서버 + Redis)

**목표:** 클릭 → Redis 저장 → 실시간 동기화 동작 확인

`Backend:
□ backend/package.json (express, socket.io, ioredis, cors)
□ backend/config/redis.js
□ backend/config/instanceConfig.js
□ backend/services/pixelService.js  ← HSET/HGETALL + 색상 혼합
□ backend/services/redisPublisher.js
□ backend/services/redisSubscriber.js  ← Pub/Sub → io.emit (핵심)
□ backend/socket/socketHandler.js
□ backend/routes/health.js
□ backend/routes/api.js
□ backend/server.js

Frontend:
□ frontend/package.json (vite, react, socket.io-client)
□ frontend/src/utils/colorMixer.js   ← RGB 혼합, 회색화
□ frontend/src/utils/pixelFlower.js  ← 5x5 꽃 패턴
□ frontend/src/hooks/useSocket.js
□ frontend/src/components/Canvas.jsx ← 핵심 컴포넌트
□ frontend/src/components/ServerInfo.jsx
□ frontend/src/App.jsx

공통:
□ docker-compose.yml
□ .env.example
□ .gitignore`

**검증:** 브라우저 2개(3001/3002 포트 각각)에서 한쪽 클릭 시 양쪽에 꽃 등장

### Phase 2 — AWS 인프라 (Terraform)

**목표:** AMI 생성 → Terraform으로 ALB + ASG 배포

`□ backend/Dockerfile
□ frontend/Dockerfile + nginx.conf
□ infrastructure/modules/networking/main.tf  (VPC, Subnet, SG)
□ infrastructure/modules/compute/main.tf     (LT, ASG, ALB, Scaling Policy)
□ infrastructure/modules/database/main.tf    (ElastiCache Redis)
□ infrastructure/user_data/startup.sh        (Node.js 설치 + systemd 등록)
□ infrastructure/main.tf, variables.tf, outputs.tf

AWS 수동 작업:
  1. EC2에서 앱 설치 후 AMI 생성
  2. ElastiCache Redis 클러스터 생성 (t3.micro)
  3. terraform init → plan → apply

ALB WebSocket 주의:
  - idle_timeout = 3600 (WebSocket 장기 연결)
  - Sticky Session 비활성화 (Redis 중앙 저장소 사용)`

### Phase 3 — Socket.io 멀티 인스턴스 동기화

**목표:** 다른 인스턴스에 연결된 사용자 간 실시간 동기화 확인

`□ Redis Pub/Sub 멀티 인스턴스 실제 환경 테스트
□ ALB WebSocket 지원 설정 확인 (Upgrade 헤더)
□ 신규 인스턴스 접속 시 pixels:init 로 기존 픽셀 로드 확인
□ InstanceLegend 컴포넌트 (활성 인스턴스 색상 범례)
□ instance:join / instance:leave 이벤트 구현`

### Phase 4 — 고도화 (Storm Mode + Auto Scaling 시각화)

**목표:** CPU 부하 → Auto Scaling → 시각적 확인

`□ backend/scripts/stressCpu.js        (Worker Thread 기반)
□ backend/services/stormService.js    (CPU × Core 수만큼 Worker 실행)
□ frontend/src/components/StormButton.jsx

Graceful Shutdown (인스턴스 종료 시각화 핵심):
□ SIGTERM 수신 → grayscaleByInstance() 호출
□ Redis PUBLISH { type: 'GRAYSCALE', instanceId }
□ 2초 대기 후 프로세스 종료
□ 클라이언트에서 해당 색상 꽃 → 회색 전환

Auto Scaling 정책 (Terraform):
□ TargetTrackingScaling: CPU 40% 초과 시 스케일 아웃
□ CloudWatch 대시보드 설정`



