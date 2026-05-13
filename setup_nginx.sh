#!/bin/bash

# Voda-Backend Nginx & SSL 자동 설정 스크립트
# 작성자: Antigravity AI

echo "------------------------------------------------"
echo "🚀 Nginx 및 SSL 자동 설정을 시작합니다..."
echo "------------------------------------------------"

# 1. 패키지 업데이트 및 필수 도구 설치
echo "📦 패키지 업데이트 및 Nginx, Certbot 설치 중..."
sudo apt update
sudo apt install -y nginx certbot python3-certbot-nginx

# 2. Nginx 설정 파일 복사
# 프로젝트 내 nginx/voda.conf 파일이 있다고 가정합니다.
if [ -f "nginx/voda.conf" ]; then
    echo "📄 Nginx 설정 파일 복사 중..."
    sudo cp nginx/voda.conf /etc/nginx/sites-available/voda
else
    echo "❌ 오류: nginx/voda.conf 파일을 찾을 수 없습니다."
    exit 1
fi

# 3. 설정 활성화 및 기본 설정 제거
echo "🔗 Nginx 설정 활성화 중..."
sudo ln -sf /etc/nginx/sites-available/voda /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# 4. Nginx 문법 검사 및 재시작
echo "🔄 Nginx 재시작 중..."
sudo nginx -t && sudo systemctl restart nginx

# 5. SSL 인증서 발급 (사용자 입력 필요할 수 있음)
echo "🔒 SSL 인증서 발급을 시작합니다 (Let's Encrypt)..."
echo "주의: 도메인의 A 레코드가 현재 서버 IP(52.79.241.23)를 가리키고 있어야 합니다."
sudo certbot --nginx -d voda-backend.p-e.kr

echo "------------------------------------------------"
echo "✅ 모든 설정이 완료되었습니다!"
echo "도메인: https://voda-backend.p-e.kr"
echo "------------------------------------------------"
