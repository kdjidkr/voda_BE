#!/bin/bash
set -e # 에러 발생 시 즉시 중단

# 스크립트가 위치한 디렉토리 파악
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
CONF_PATH="$DIR/nginx/voda.conf"
DOMAIN="voda-backend.p-e.kr"

echo "------------------------------------------------"
echo "🚀 Nginx 및 SSL 자동 설정을 시작합니다..."
echo "------------------------------------------------"

# 1. 패키지 업데이트 및 필수 도구 설치
if [ -f /etc/debian_version ]; then
    echo "📦 패키지 업데이트 및 Nginx, Certbot 설치 중..."
    sudo apt update
    sudo apt install -y nginx certbot python3-certbot-nginx
else
    echo "❌ 오류: 이 스크립트는 Ubuntu/Debian 환경 전용입니다."
    exit 1
fi

# 2. Nginx 설정 파일 복사
if [ -f "$CONF_PATH" ]; then
    echo "📄 Nginx 설정 파일 복사 중..."
    sudo cp "$CONF_PATH" /etc/nginx/sites-available/voda
else
    echo "❌ 오류: $CONF_PATH 파일을 찾을 수 없습니다."
    exit 1
fi

# 3. 설정 활성화 및 기본 설정 안전하게 제거
echo "🔗 Nginx 설정 활성화 중..."
sudo ln -sf /etc/nginx/sites-available/voda /etc/nginx/sites-enabled/

if [ -L /etc/nginx/sites-enabled/default ]; then
    echo "🧹 기본 Nginx 설정 링크 제거 중..."
    sudo rm -f /etc/nginx/sites-enabled/default
fi

# 4. Nginx 문법 검사 및 재시작
echo "🔄 Nginx 재시작 중..."
sudo nginx -t && sudo systemctl restart nginx

# 5. SSL 인증서 발급
echo "🔒 SSL 인증서 발급을 시작합니다 (Let's Encrypt)..."
sudo certbot --nginx -d "$DOMAIN"

echo "------------------------------------------------"
echo "✅ 모든 설정이 완료되었습니다!"
echo "도메인: https://$DOMAIN"
echo "------------------------------------------------"
