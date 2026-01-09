# NEAR Payment UI/UX Design Specification (Invisible Web3)

이 문서는 춘심(CHOONSIM) 프로젝트의 NEAR Protocol 기반 결제 시스템을 위한 UI/UX 디자인 사양을 정의합니다. 본 사양의 핵심 목표는 사용자가 블록체인 기술을 인식하지 못하게 하면서도, 직관적이고 감성적인 결제 경험을 제공하는 **"Invisible Web3"** 구현에 있습니다.

---

## 1. 디자인 원칙 (Core Principles)

### 1.1 No Crypto Jargon (용어의 완전한 추상화)
*   `NEAR`, `Token`, `Wallet`, `Transaction Hash`와 같은 기술적 용어를 철저히 배제합니다.
*   대신 `하트(Hearts)`, `초코(Choco)`, `보안 결제`, `구매 내역` 등 친숙한 Web2 용어를 사용합니다.

### 1.2 Emotional Interaction (감성적 상호작용)
*   결제는 단순한 금전 거래가 아닌, 캐릭터와의 관계를 위한 '선물' 또는 '지원'의 행위로 연출합니다.
*   성공적인 결제 시 시각적 보상(애니메이션)을 풍부하게 제공하여 심리적 만족감을 극대화합니다.

### 1.3 Zero-Friction (최소한의 마찰)
*   임베디드 지갑을 활용하여 복잡한 서명 과정을 배경으로 숨깁니다.
*   자율 결제 한도(Allowance) 내에서는 추가 승인 없이 즉시 처리가 이루어지는 'Silent Payment'를 지향합니다.

---

## 2. 주요 UI 컴포넌트 사양

### 2.1 자산 표시기 (Currency/Balance Indicator)
*   **Context**: 헤더(Header) 또는 유저 프로필 영역.
*   **Display**: `[하트 아이콘] 1,250` 식의 간단한 표기.
*   **Interactions**:
    *   클릭 시 작은 팝업(Tooltip/Popover) 노출.
    *   팝업 내용: "온체인 보안 기술로 보호되는 소중한 자산입니다."
    *   지갑 주소는 `near...a2b3` 형태의 마스킹된 형태로 최소한의 신뢰성만 제공.

### 2.2 하단 결제 시트 (One-Tap Payment Sheet)
*   **Context**: 아이템 구매 또는 유료 답변 요청 시.
*   **Design**: Bottom Sheet (Slide-up) 레이아웃.
*   **Structure**:
    *   **Header**: 상품명 및 가격 (예: "하트 50개 충전").
    *   **Body**: 현재 잔액과 결제 후 잔액 비교.
    *   **Action**: "원클릭 결제하기" (Glassmorphism 스타일의 커다란 버튼).
*   **Animation**: 버튼 클릭 시 지문 스캔 애니메이션이나 부드러운 펄스(Pulse) 효과를 주어 '보안 결제'의 신뢰감을 부여.

### 2.3 지능형 로딩 인디케이터 (Progressive Loading)
*   **Context**: 트랜잭션 전송 및 온체인 컨펌 대기 시간.
*   **Design**: 단순한 스피너 대신 캐릭터와 관련된 애니메이션 사용.
    *   예: "춘심이가 하트를 바구니에 담고 있어요...", "온체인 보안 확인 중..."
*   **Feedback**: 블록체인 전송 단계별 피드백 대신 "보안 연결 중" -> "결제 승인 중" -> "지급 완료" 순의 인간 친화적 메시지 노출.

### 2.4 자율 결제(Allowance) 설정 UI
*   **Context**: 첫 결제 시 또는 설정 메뉴.
*   **Function**: "오늘 하루 $10까지는 추가 확인 없이 즉시 결제 승인" 옵션 제공.
*   **Benefit**: X402 인터셉터와 결합하여 끊김 없는 대화 흐름(Flow) 유지.

---

## 3. 고급 설정: 지갑 내보내기 (The Escape Hatch)

### 3.1 은밀한 배치
*   **Location**: 설정 > 계정 및 보안 > 고급 데이터 관리 > 자산 소유권 확인.
*   **Design**: 일반적인 UI보다 더 엄격하고 진지한 톤의 디자인.

### 3.2 2단계 보안 해제 케이스
1.  **단계 1**: 2FA(OTP 또는 이메일) 인증 요청.
2.  **단계 2**: "이 정보는 타인에게 노출될 경우 자산 복구가 불가능합니다"라는 강력한 팝업.
3.  **단계 3**: 10초간의 강제 대기 후 '프라이빗 키 확인' 버튼 활성화.

---

## 4. 비주얼 가이드라인 (Aesthetics)

### 4.1 Color Palette
*   **Primary**: `#EC4899` (Deep Pink - 활기차고 감성적인 톤)
*   **Success**: `#10B981` (Emerald - 안전과 성공의 의미)
*   **Surface**: Semi-transparent Dark (Glassmorphism 스타일, 춘심의 다크모드와 연동)

### 4.2 Micro-Animations
*   **Particle Effect**: 결제 완료 시 버튼 주위에 금색 가루(Gold Dust)가 퍼지는 효과.
*   **Haptic Feedback**: 모바일 환경에서 결제 완료 시 부드러운 진동 피드백.

---

## 5. X402 인터셉터와의 연동 UX

1.  사용자가 유료 기능을 트리거합니다.
2.  프론트엔드 API 클라이언트가 요청을 보냅니다.
3.  서버가 `402 Payment Required`와 함께 인보이스를 응답합니다.
4.  **UI 인터셉터**:
    *   한도(Allowance) 내인 경우: 화면 변화 없이 하단 토스트로 "-5 Hearts"만 표시.
    *   한도 초과 시: 자동으로 **'2.2 하단 결제 시트'**를 띄워 유저 승인을 받습니다.
5.  결제 완료 후 원래 요청을 자동으로 재시도하여 중단 없는 경험을 제공합니다.

---
**최종 업데이트**: 2026-01-10
**버전**: 1.0 (디자인 원칙 수립)
**작성**: Antigravity AI Assistant
