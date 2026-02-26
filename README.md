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
    <img src="https://github.com/user-attachments/assets/0614f9a6-bd84-45db-be24-cf694a22983d" width="33%"/>
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
<p align="center">
    <img src="https://github.com/user-attachments/assets/9d6141bd-8aea-4218-b8af-2f34fb6ef13" width="50%"/>
    <img src="https://github.com/user-attachments/assets/07b6df93-50ec-4154-aed5-393a168a1714" witdh="50%"/>
</p>

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
□ TargetTrackingScaling: CPU 60% 초과 시 스케일 아웃
□ CloudWatch 대시보드 설정`

---

## 작업 내역

- **26.02.20**
    - **MVP (로컬 단일 서버 + Redis) 구현**
        
        
        ![image.png](attachment:97b38358-6009-43d8-85eb-86fdaff35593:image.png)
        
        ![image.png](attachment:3f79c82a-5a6d-4637-9d7e-bdbefb64553f:image.png)
        
    - **AWS 인프라(Terraform) 생성**
        
        **AMI 생성 → Terraform으로  ALB + ASG 배포**
        
        ![image.png](attachment:dd8e7222-7508-4ce6-bfad-015e93fd79eb:image.png)
        
        ![image.png](attachment:edfdf567-2a06-4c38-a316-1f59d7ec1e02:image.png)
        
    - **트러블슈팅**
        
        AWS에 배포 후 500 (Internal Server Error)와 함께접속에 이상이 생김.
        
        **원인:** `setup_ami_base.sh`로 AMI를 만들 때 cloud-init 실행 기록이 이미지에 같이 구워짐으로 인해 새 인스턴스가 뜰 때 cloud-init이 "이미 실행했음"으로 판단하고 `startup.sh`(user_data)를 **건너뜀.** 해당 문제로 인해 서비스는 enable만 되고 .env 파일이 생성되지 않음
        
        **해결 방식**: setup_ami_base.sh에 캐시 삭제 명령어 추가.
        
        ```bash
        cloud-init clean --logs
        ```
        
        **결과:** 인스턴스에 .env 설치와 시스템 정상 설치 및 실행 확인됨. 그럼에도 로드밸런서를 통한 접속이 안 됨. 
        
        ```bash
        [ec2-user@ip-10-0-1-154 ~]$ curl -s http://localhost:3001/health
        {"status":"ok","instanceId":"i-0518393b438c2882a","color":{"primary":"#FF4444","secondary":"#FF69B4","theme":"red"},"timestamp":"2026-02-20T06:53:59.414Z"}[ec2-user@ip-10-0-1-154 ~]$ curl -s http://localhost/health
        <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.1//EN" "http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd">
        
        <html xmlns="http://www.w3.org/1999/xhtml" xml:lang="en">
            <head>
                <title>The page is not found</title>
                <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />     
            </head>
        
            <body>
                <h1><strong>nginx error!</strong></h1>
        
                <div class="content">
        
                    <h3>The page you are looking for is not found.</h3>
        
                    <div class="alert">
                        <h2>Website Administrator</h2>
                        <div class="content">
                            <p>Something has triggered missing webpage on your
                            website. This is the default 404 error page for
                            <strong>nginx</strong> that is distributed with
                            Fedora.  It is located
                            <tt>/usr/share/nginx/html/404.html</tt></p>
        
                            <p>You should customize this error page for your own
                            site or edit the <tt>error_page</tt> directive in
                            the <strong>nginx</strong> configuration file
                            <tt>/etc/nginx/nginx.conf</tt>.</p>
                        </div>
                    </div>
        
                    <div class="logos">
                        <a href="http://nginx.net/"><img
                            src="/nginx-logo.png"
                            alt="[ Powered by nginx ]"
                            width="121" height="32" /></a>
        
                        <a href="http://fedoraproject.org/"><img
                            src="/poweredby.png"
                            alt="[ Powered by Fedora ]"
                            width="88" height="31" /></a>
                    </div>
                </div>
            </body>
        </html>
        ```
        
        **원인**: `nginx.conf` 안에 **기본 서버 블록**이 있어서 `pixelflora.conf`와 충돌.
        
        **해결 방식:** `setup_ami_base.sh`의 Nginx 설정에서 기본 서버 블록 제거. → pixelflora.conf 가 우선권을 가짐.
        
        ```
          # Remove the default server block from nginx.conf so it doesn't conflict
          # with pixelflora.conf (both claim server_name _ on port 80)
          cat > /etc/nginx/nginx.conf << 'NGINXMAINEOF'
        user nginx;
        worker_processes auto;
        error_log /var/log/nginx/error.log notice;
        pid /run/nginx.pid;
        
        include /usr/share/nginx/modules/*.conf;
        
        events {
            worker_connections 1024;
        }
        
        http {
            log_format  main  '$remote_addr - $remote_user [$time_local] "$request" '
                              '$status $body_bytes_sent "$http_referer" '
                              '"$http_user_agent" "$http_x_forwarded_for"';
        
            access_log  /var/log/nginx/access.log  main;
        
            sendfile            on;
            tcp_nopush          on;
            keepalive_timeout   65;
            types_hash_max_size 4096;
        
            include             /etc/nginx/mime.types;
            default_type        application/octet-stream;
        
            include /etc/nginx/conf.d/*.conf;
        }
        NGINXMAINEOF
        
          # ── Nginx: serves the React build + proxies /api and /socket.io to backend ──
          cat > /etc/nginx/conf.d/pixelflora.conf << 'NGINXEOF'
        server {
            listen 80;
            server_name _;
        ```
        
- **26.02.24**
    - Terraform을 사용한 인프라 설정 자동화
        
        ```jsx
        terraform {
          required_version = ">= 1.5"
          required_providers {
            aws = {
              source  = "hashicorp/aws"
              version = "~> 5.0"
            }
          }
          # Uncomment to use S3 backend for team collaboration:
          # backend "s3" {
          #   bucket = "your-tfstate-bucket"
          #   key    = "pixelflora/terraform.tfstate"
          #   region = "ap-northeast-2"
          # }
        }
        
        provider "aws" {
          region = var.aws_region
        }
        
        module "networking" {
          source       = "./modules/networking"
          project_name = var.project_name
        }
        
        module "database" {
          source       = "./modules/database"
          project_name = var.project_name
          vpc_id       = module.networking.vpc_id
          subnet_ids   = module.networking.private_subnet_ids
          ec2_sg_id    = module.compute.ec2_sg_id
        }
        
        module "compute" {
          source            = "./modules/compute"
          project_name      = var.project_name
          vpc_id            = module.networking.vpc_id
          public_subnet_ids = module.networking.public_subnet_ids
          ami_id            = var.ami_id
          instance_type     = var.instance_type
          key_name          = var.key_name
          min_size          = var.min_size
          max_size          = var.max_size
          desired_capacity  = var.desired_capacity
          cpu_target        = var.cpu_target
          redis_host        = module.database.redis_endpoint
        }
        ```
        
- **26.02.25**
    - Terraform에 키페어 설정 추가
    - CPU 부하(Storm mode)의 지속 시간 삭제 및 스케일 아웃 CPU 부하 기준 변경(60% → 40%)
        
        ```jsx
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
        
        // variables.tf
        variable "cpu_target" {
          description = "Target CPU utilization (%) for Target Tracking scaling policy"
          type        = number
          default     = 40
        }
        
        ```
        
    - 인스턴스의 색상 매핑 방식 변경(랜덤 → redis에서 사용하지 않는 색 우선)
        
        ```jsx
        // Pick a color key not already used by any active instance in Redis
        async function pickAvailableColorKey(instanceId) {
          const allKeys = Object.keys(INSTANCE_COLOR_MAP);
          try {
            const raw = await redisClient.hgetall('instances');
            if (!raw) return allKeys[0];
        
            const usedKeys = new Set();
            for (const [id, value] of Object.entries(raw)) {
              if (id === instanceId) continue; // skip self in case of re-registration
              const data = JSON.parse(value);
              if (!data.active) continue;
              for (const [key, colorConfig] of Object.entries(INSTANCE_COLOR_MAP)) {
                if (data.color && data.color.primary === colorConfig.primary) {
                  usedKeys.add(key);
                  break;
                }
              }
            }

        ```
