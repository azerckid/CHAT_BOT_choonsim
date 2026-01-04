# 통합 결제 UI/UX 디자인 명세서 (Payment UI/UX Specification)

## 1. 개요 (Overview)
본 문서는 '바이춘심' 서비스의 통합 결제 시스템(PayPal, Coinbase Commerce, Solana Pay, NEAR Protocol)에 대한 UI/UX 디자인 명세서입니다.
사용자에게 다양한 결제 옵션을 제공하면서도 일관된 사용자 경험을 제공하는 것이 핵심 목표입니다.

**프로젝트 컨텍스트:**
- **Framework**: React Router v7 (Vite)
- **Styling**: Tailwind CSS v4, shadcn/ui (Nova Preset)
- **Payment Systems**: PayPal, Coinbase Commerce, Solana Pay, NEAR Protocol
- **Design System**: Stitch Theme (Cyberpunk/Neon/Dark) 기반
- **Components**: shadcn/ui 컴포넌트 활용

---

## 2. 디자인 목표 (Design Goals)

### 2.1 핵심 원칙
*   **Premium & Trustworthy**: 결제 페이지는 사용자의 신뢰가 가장 중요합니다. Stitch 디자인 시스템의 아이덴티티(Cyberpunk/Neon/Dark)를 유지하되, 결제 섹션만큼은 깔끔하고 정돈된 "Financial Premium" 느낌을 주어야 합니다.
*   **Clear Value Proposition**: 각 등급(Tier)의 차이를 직관적으로 인지할 수 있도록 시각적 위계를 명확히 합니다.
*   **Seamless Experience**: 채팅 도중 흐름이 끊기지 않도록, 토큰 충전은 모달 형태로 빠르고 간편하게 처리합니다.
*   **Payment Method Flexibility**: 사용자가 선호하는 결제 방식을 쉽게 선택할 수 있도록 명확한 UI를 제공합니다.

### 2.2 사용자 여정 (User Journey)
1. **크레딧 부족 감지**: 채팅 중 크레딧 부족 시 자동 알림
2. **결제 방법 선택**: 통합 결제 모달에서 원하는 결제 방식 선택
3. **결제 진행**: 선택한 결제 방식에 따라 최적화된 플로우 제공
4. **결제 완료**: 즉시 크레딧 지급 및 사용 가능 상태로 전환

---

## 3. 디자인 시스템 (Design System)

### 3.1 색상 팔레트 (Color Palette)
*   **Background**: `bg-slate-950` (Deep Dark) - 메인 배경
*   **Card Surface**: `bg-slate-900/50` + `backdrop-blur-md` (Glassmorphism)
*   **Primary Accent**: `#FF00FF` (Neon Pink) - CTA 버튼, 활성 상태 표시, "Popular" 배지
*   **Secondary Accent**: `#00D1FF` (Cyan) - 보조 정보, 링크
*   **Crypto Accent**: `#14F195` (Solana Green) - Solana 관련 UI
*   **Crypto Accent 2**: `#00C1DE` (NEAR Blue) - NEAR 관련 UI
*   **Text Primary**: `text-white` (High Emphasis)
*   **Text Secondary**: `text-slate-400` (Medium Emphasis)
*   **Border**: `border-slate-800` (Subtle) -> Hover시 `border-pink-500/50`
*   **Success**: `text-green-400` (결제 성공)
*   **Error**: `text-red-400` (결제 실패)

### 3.2 타이포그래피 (Typography)
*   **Font Family**: Inter (Variable) - `@fontsource-variable/inter`
*   **Pricing Numbers**: 크게, 굵게 (Bold), `tracking-tight`
*   **Headings**: 간결하고 명확하게
*   **Body Text**: `text-sm` 또는 `text-base` (가독성 우선)

### 3.3 컴포넌트 라이브러리
*   **shadcn/ui Nova Preset** 사용
*   주요 컴포넌트: `Dialog`, `Tabs`, `Button`, `Card`, `Badge`, `Table`, `Skeleton`
*   **Toast**: Sonner 사용 (결제 피드백)

---

## 4. 페이지별 상세 디자인 (Detailed Specifications)

### 4.1 가격 정책 페이지 (`/pricing`)

**파일 경로**: `app/routes/pricing.tsx`

**Layout**:
*   상단 중앙 정렬: "Choose Your Plan" 헤드라인 + "Unleash the full potential of AI" 서브카피
*   **Billing Toggle**: [Monthly] <-> [Yearly (Save 20%)] 스위치. Neon Pink 액센트로 선택 상태 표시
*   **Current Plan Badge**: 현재 구독 중인 플랜 표시 (상단 우측)

**Pricing Cards (Grid Layout)**:
*   **Card Structure**:
    1.  **Header**: Tier 이름 (FREE, BASIC, PREMIUM, ULTIMATE) + 아이콘
    2.  **Price**: 큰 폰트 ($14.99) + `/mo` (작은 폰트)
    3.  **Credits Info**: 제공 크레딧 표시 (예: "10,000 Credits/month")
    4.  **Action Button**: 전체 너비
        *   Free: "Current Plan" (Disabled, Gray)
        *   Current Plan: "Current Plan" (Disabled, Gray)
        *   Upgrade: "Upgrade Now" (Solid Pink, Glow Effect)
        *   Downgrade: "Downgrade" (Outlined, Muted)
    5.  **Features List**: 체크 아이콘(Pink) + 혜택 텍스트
        *   Gemini Flash 모델 사용
        *   광고 제거 (FREE 제외)
        *   고급 모델 접근 (PREMIUM 이상)
        *   이미지 생성 (PREMIUM 이상)
        *   우선 서포트 (ULTIMATE)

*   **Design Details**:
    *   **Popular Plan (PREMIUM)**: 카드 테두리에 `border-pink-500` 적용 + 상단에 "MOST POPULAR" 뱃지 부착. 은은한 Pink Glow (`shadow-[0_0_30px_-5px_rgba(255,0,255,0.3)]`) 효과
    *   **Hover Effect**: 카드 호버 시 살짝 위로 떠오름 (`-translate-y-1`) + 배경색 약간 밝아짐
    *   **Current Plan**: 현재 구독 중인 플랜은 `border-cyan-500` 적용

**크레딧 가치 표시**:
*   각 카드에 크레딧 가치 정보 표시
*   예: "10 Credits = 1 Gemini Flash 대화"
*   "GPT-4o: 500 Credits per message" (PREMIUM 이상)

---

### 4.2 통합 결제 모달 (Unified Payment Modal)

**파일 경로**: `app/components/payment/PaymentModal.tsx`

**Trigger**: 
*   채팅 입력창 하단 "크레딧 부족" 경고 클릭
*   크레딧 충전 버튼 클릭
*   토스트 알림 클릭

**UI Component**: `Dialog` (Centered Modal with Backdrop Blur)

**Content Structure**:

1. **Header**:
   *   "Recharge Credits" 또는 "Choose Payment Method"
   *   현재 잔액 표시 (우측 상단, 강조된 텍스트)
   *   예: "Current Balance: 1,250 Credits"

2. **Package Selection** (크레딧 충전인 경우):
   *   **Package Grid** (2x2 또는 3x1):
     *   각 패키지 박스 (선택 가능 라디오 버튼 역할)
     *   **Visual**: 토큰 아이콘(코인 모양) + 수량 (5,000 Credits) + 가격 ($5.00) + 보너스 표시
     *   **Selection**: 클릭 시 `ring-2 ring-pink-500` 및 배경색 변경
   *   **패키지 옵션** (PRICING_AND_MARGIN_ANALYSIS.md 기준):
     *   소액: $5 → 5,000 Credits
     *   표준: $10 → 12,000 Credits (20% 보너스)
     *   대량: $20 → 26,000 Credits (30% 보너스)
     *   프리미엄: $50 → 70,000 Credits (40% 보너스)

3. **Payment Method Selection** (Tabs):
   *   **Tab 1: Credit/Debit (PayPal)**
     *   PayPal 로고 및 설명
     *   "Pay with PayPal" 버튼
     *   PayPal Smart Payment Buttons 영역
   
   *   **Tab 2: Crypto (Coinbase Commerce)**
     *   Coinbase Commerce 로고 및 설명
     *   "Pay with Crypto" 버튼
     *   클릭 시 Coinbase Commerce 호스팅 페이지로 이동
     *   지원 코인 표시: BTC, ETH, USDC, LTC
   
   *   **Tab 3: Solana Pay**
     *   Solana 로고 및 설명
     *   "Pay with SOL/USDC" 버튼
     *   지갑 연결 상태 표시
     *   QR 코드 표시 영역 (지갑 미연결 시)
     *   "Connect Wallet" 버튼 (Phantom, Solflare 등)
   
   *   **Tab 4: NEAR Protocol**
     *   NEAR 로고 및 설명
     *   "Pay with NEAR" 버튼
     *   NEAR Wallet Selector 모달 트리거
     *   계정 ID 표시 (연결 시)

4. **Summary Footer**:
   *   선택한 패키지 요약 ("5,000 Credits for $5.00")
   *   결제 수수료 안내 (해당되는 경우)
   *   결제 버튼 영역 (선택한 결제 방식에 따라 동적 변경)

**Design Details**:
*   **Tab Active State**: Neon Pink 액센트
*   **Loading State**: 각 탭별 로딩 스켈레톤
*   **Error State**: 결제 실패 시 에러 메시지 표시

---

### 4.3 크레딧 표시 및 관리 UI

#### 4.3.1 채팅 화면 크레딧 표시
**파일 경로**: `app/components/chat/ChatHeader.tsx`

**위치**: 채팅 헤더 우측 상단

**디자인**:
```
┌─────────────────────────┐
│ [Avatar] [Name]  💎 1,250 │
└─────────────────────────┘
```

*   **아이콘**: 다이아몬드 또는 코인 아이콘 (`💎`)
*   **크레딧 수**: 큰 폰트, 강조 색상
*   **저크레딧 경고**: 100 Credits 이하 시 노란색, 10 Credits 이하 시 빨간색
*   **클릭 가능**: 클릭 시 크레딧 충전 모달 열기

#### 4.3.2 크레딧 부족 경고
**파일 경로**: `app/components/chat/MessageInput.tsx`

**표시 조건**: 크레딧이 10 Credits 미만일 때

**디자인**:
```
┌─────────────────────────────────────┐
│ ⚠️ 크레딧이 부족합니다.              │
│    현재: 5 Credits (최소 필요: 10)   │
│    [크레딧 충전하기]                  │
└─────────────────────────────────────┘
```

*   **경고 배너**: 노란색 배경, 경고 아이콘
*   **현재 크레딧**: 강조 표시
*   **필요 크레딧**: 모델별 차감량 표시
*   **CTA 버튼**: "크레딧 충전하기" (Pink, Glow Effect)

#### 4.3.3 모델 선택 시 비용 표시
**파일 경로**: `app/components/chat/ModelSelector.tsx` (향후 구현)

**디자인**:
*   모델 선택 드롭다운에 각 모델별 크레딧 소모량 표시
*   예: "GPT-4o (500 Credits/message)"
*   크레딧 부족 시 비활성화 및 경고 표시

---

### 4.4 구독 및 결제 관리 페이지 (`/profile/subscription`)

**파일 경로**: `app/routes/profile/subscription.tsx`

**Layout**:

1. **Current Subscription Card**:
   *   현재 구독 중인 플랜 이름 (큰 폰트)
   *   상태 표시: Active / Expired / Cancelled (Badge)
   *   다음 결제일 또는 만료일
   *   월별 제공 크레딧 정보
   *   현재 잔여 크레딧
   *   **Actions**:
     *   "Upgrade" 버튼 (PREMIUM 미만인 경우)
     *   "Downgrade" 버튼 (PREMIUM 이상인 경우)
     *   "Cancel Subscription" 버튼 (Destructive Red 계열, but muted)
     *   취소 확인 다이얼로그 필요

2. **Payment History Table**:
   *   **컬럼**: 
     *   날짜 (YYYY-MM-DD)
     *   항목 (구독/충전)
     *   결제 방식 (PayPal / Coinbase / Solana / NEAR)
     *   금액 (USD)
     *   크레딧 (지급된 크레딧)
     *   상태 (Completed / Pending / Failed)
     *   영수증 (Invoice) - 다운로드 버튼
   *   **스타일**: shadcn/ui Table 컴포넌트 변형
     *   Row hover 효과
     *   얇은 구분선
     *   상태별 색상 표시 (Completed: Green, Pending: Yellow, Failed: Red)
   *   **페이지네이션**: 10개씩 표시

3. **Credit Usage Statistics** (선택사항):
   *   월별 크레딧 사용량 그래프
   *   모델별 사용 비율 (Pie Chart)
   *   일일 사용량 추이 (Line Chart)

---

### 4.5 크립토 결제 전용 UI

#### 4.5.1 Solana Pay UI
**파일 경로**: `app/components/payment/SolanaPayButton.tsx`

**상태별 UI**:

1. **지갑 미연결**:
   *   "Connect Wallet" 버튼
   *   클릭 시 지갑 선택 모달 (Phantom, Solflare 등)
   *   연결 가이드 텍스트

2. **지갑 연결됨**:
   *   지갑 주소 표시 (축약형: `7xKX...9mNp`)
   *   "Pay with SOL" 또는 "Pay with USDC" 버튼
   *   환율 정보 표시 (예: "1 SOL = $150")

3. **QR 코드 표시** (모바일 또는 지갑 미연결 시):
   *   QR 코드 이미지 (중앙)
   *   "Scan with your wallet" 안내 텍스트
   *   Solana Pay URL 표시 (복사 가능)

4. **결제 진행 중**:
   *   "Waiting for transaction..." 메시지
   *   로딩 스피너
   *   트랜잭션 해시 표시 (클릭 시 Solana Explorer 링크)

5. **결제 완료**:
   *   "Payment Confirmed!" 메시지
   *   트랜잭션 해시 및 확인 링크
   *   자동으로 모달 닫기 (3초 후)

#### 4.5.2 NEAR Pay UI
**파일 경로**: `app/components/payment/NearPayButton.tsx`

**상태별 UI**:

1. **지갑 미연결**:
   *   "Connect NEAR Wallet" 버튼
   *   클릭 시 NEAR Wallet Selector 모달
   *   FastAuth 옵션 표시 (이메일/생체인증)

2. **지갑 연결됨**:
   *   계정 ID 표시 (예: `user.near`)
   *   "Pay with NEAR" 버튼
   *   환율 정보 표시

3. **결제 진행 중**:
   *   "Signing transaction..." 메시지
   *   NEAR 지갑 승인 대기

4. **결제 완료**:
   *   "Payment Confirmed!" 메시지
   *   트랜잭션 해시 및 확인 링크 (NEAR Explorer)

#### 4.5.3 Coinbase Commerce UI
**파일 경로**: `app/components/payment/CoinbaseCommerceButton.tsx`

**UI**:
*   "Pay with Crypto" 버튼
*   Coinbase Commerce 로고
*   지원 코인 목록 표시 (BTC, ETH, USDC, LTC)
*   클릭 시 새 창에서 Coinbase Commerce 호스팅 페이지 열기
*   "Payment page will open in a new window" 안내

---

## 5. 인터랙션 및 상태 (Micro-interactions)

### 5.1 Loading States

#### 5.1.1 PayPal 버튼 로딩
*   버튼이 로드되기 전까지 해당 영역에 `Skeleton` (회색 박스 + Shimmer 효과) 표시
*   높이: 48px (표준 버튼 높이)

#### 5.1.2 결제 처리 중
*   화면 전체를 `bg-black/50`으로 덮고 중앙에 Neon Spinner 표시
*   문구: "Processing your payment securely..."
*   취소 불가 (보안상 이유)

#### 5.1.3 크립토 결제 확인 대기
*   Solana/NEAR: "Waiting for blockchain confirmation..."
*   Polling 상태 표시 (점 3개 애니메이션)
*   예상 대기 시간 표시 (Solana: ~1초, NEAR: ~2초)

### 5.2 Feedback (Toast)

#### 5.2.1 Success
*   **Icon**: 체크박스 (Green or Pink)
*   **Sound**: 경쾌한 긍정 효과음 (Optional)
*   **Message**: "Payment Successful! 5,000 Credits added."
*   **Duration**: 5초
*   **Action**: "View Details" 버튼 (선택사항)

#### 5.2.2 Error
*   **Icon**: 경고 삼각형 (Red)
*   **Message**: "Payment Failed. Please try again."
*   **Duration**: 7초 (에러는 더 길게)
*   **Action**: "Retry" 버튼 (선택사항)

#### 5.2.3 Info
*   **Icon**: 정보 아이콘 (Cyan)
*   **Message**: "Payment is being processed. Credits will be added shortly."
*   **Duration**: 5초

### 5.3 크레딧 실시간 업데이트
*   결제 완료 시 즉시 크레딧 잔액 업데이트
*   React Router의 `useRevalidator` 사용
*   부드러운 숫자 카운트 애니메이션 (선택사항)

---

## 6. 모바일 반응형 (Responsive)

### 6.1 Pricing Page
*   **Desktop**: 4열 그리드 (FREE, BASIC, PREMIUM, ULTIMATE)
*   **Tablet**: 2열 그리드
*   **Mobile**: 세로로 적층 (Stack)
  *   중요한 "PREMIUM" 카드가 너무 아래로 내려가지 않도록 순서 조정 고려
  *   비교 테이블은 아코디언(Accordion) 형식으로 변환하여 "Show Features" 클릭 시 펼쳐지도록 함

### 6.2 Payment Modal
*   **Desktop**: 중앙 모달 (최대 너비: 600px)
*   **Mobile**: 화면 하단에서 올라오는 **Drawer** (Bottom Sheet) 형태로 변경
  *   엄지손가락 영역(Thumb zone)에 구매 버튼 배치
  *   Swipe down으로 닫기 가능

### 6.3 Payment Method Tabs
*   **Desktop**: 가로 탭 (4개)
*   **Mobile**: 세로 아코디언 또는 드롭다운으로 변경
  *   각 결제 방식별 카드 형태로 표시
  *   선택 시 확장

### 6.4 QR Code (Solana Pay)
*   **Desktop**: 모달 내 중앙 표시
*   **Mobile**: 전체 화면 또는 큰 사이즈로 표시
  *   "Scan with your wallet" 안내 강조

---

## 7. 접근성 (Accessibility)

### 7.1 키보드 네비게이션
*   모든 인터랙티브 요소는 Tab 키로 접근 가능
*   Enter/Space로 선택 가능
*   Escape로 모달 닫기

### 7.2 스크린 리더
*   모든 버튼과 링크에 적절한 `aria-label` 제공
*   크레딧 잔액은 `aria-live="polite"`로 실시간 업데이트 알림
*   결제 상태 변경 시 `aria-live="assertive"`로 알림

### 7.3 색상 대비
*   WCAG AA 기준 준수 (최소 4.5:1)
*   텍스트와 배경의 명확한 대비
*   색상만으로 정보를 전달하지 않음 (아이콘/텍스트 병행)

---

## 8. 보안 고려사항 (Security Considerations)

### 8.1 결제 정보 보호
*   결제 정보는 절대 클라이언트에 저장하지 않음
*   모든 결제는 서버 사이드에서 검증
*   HTTPS 필수

### 8.2 사용자 확인
*   구독 취소 시 확인 다이얼로그 필수
*   대액 결제 시 추가 확인 단계 (선택사항)

### 8.3 에러 처리
*   결제 실패 시 민감한 정보 노출 방지
*   일반적인 에러 메시지 제공
*   상세 에러는 서버 로그에만 기록

---

## 9. 구현 체크리스트 (Implementation Checklist)

### 9.1 컴포넌트 구현
- [ ] `app/routes/pricing.tsx`: 가격 정책 페이지
- [ ] `app/components/payment/PaymentModal.tsx`: 통합 결제 모달
- [ ] `app/components/payment/TokenTopUpModal.tsx`: 크레딧 충전 모달 (레거시, 통합 모달로 대체 가능)
- [ ] `app/components/payment/PayPalButton.tsx`: PayPal 버튼 래퍼
- [ ] `app/components/payment/CoinbaseCommerceButton.tsx`: Coinbase Commerce 버튼
- [ ] `app/components/payment/SolanaPayButton.tsx`: Solana Pay 버튼 및 QR 코드
- [ ] `app/components/payment/NearPayButton.tsx`: NEAR Pay 버튼
- [ ] `app/components/chat/ChatHeader.tsx`: 크레딧 표시 추가
- [ ] `app/components/chat/MessageInput.tsx`: 크레딧 부족 경고 추가
- [ ] `app/routes/profile/subscription.tsx`: 구독 관리 페이지

### 9.2 스타일링
- [ ] `app/app.css`: Neon Glow 유틸리티 클래스 확인/추가
- [ ] 다크 모드 최적화: 텍스트 가독성(Contrast) 검사
- [ ] 반응형 브레이크포인트 테스트
- [ ] 모바일 터치 영역 최적화 (최소 44x44px)

### 9.3 통합 테스트
- [ ] PayPal 결제 플로우 테스트
- [ ] Coinbase Commerce 결제 플로우 테스트
- [ ] Solana Pay 결제 플로우 테스트 (Devnet)
- [ ] NEAR Pay 결제 플로우 테스트 (Testnet)
- [ ] 크레딧 실시간 업데이트 테스트
- [ ] 에러 케이스 처리 테스트
- [ ] 모바일 반응형 테스트

### 9.4 접근성 테스트
- [ ] 키보드 네비게이션 테스트
- [ ] 스크린 리더 테스트 (NVDA/JAWS)
- [ ] 색상 대비 검사 (WebAIM Contrast Checker)

---

## 10. 참고 문서 (References)

*   **PayPal Implementation Plan**: `PAYPAL_IMPLEMENTATION_PLAN.md`
*   **Crypto Payment Plan**: `CRYPTO_PAYMENT_PLAN.md`
*   **Pricing & Margin Analysis**: `PRICING_AND_MARGIN_ANALYSIS.md`
*   **shadcn/ui Documentation**: https://ui.shadcn.com/
*   **PayPal React SDK**: https://developer.paypal.com/sdk/js/
*   **Solana Wallet Adapter**: https://github.com/solana-labs/wallet-adapter
*   **NEAR Wallet Selector**: https://github.com/near/wallet-selector

---

## 11. 향후 개선 사항 (Future Enhancements)

### 11.1 사용자 경험 개선
*   크레딧 사용량 예측 (AI 기반)
*   자동 충전 설정 (임계값 도달 시)
*   구독 갱신 알림 (만료 3일 전)

### 11.2 시각화
*   크레딧 사용량 대시보드
*   모델별 사용 비율 차트
*   월별 사용량 추이 그래프

### 11.3 프로모션
*   첫 구독 할인 배너
*   연간 구독 할인 옵션
*   친구 추천 보너스 크레딧

