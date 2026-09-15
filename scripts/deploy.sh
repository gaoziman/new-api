#!/usr/bin/env bash
#
# 在服务器上部署二开镜像。
#
# 【与上游的差别】切到二开后不能再 `docker pull calciumion/new-api`，
# 镜像要自己构建。这个脚本把构建、验证、切换、回滚串起来，
# 关键是**先用平行容器验证、再动主容器**——不拿线上直接赌。
#
# 用法（在服务器上执行）：
#   scripts/deploy.sh build     # 构建镜像
#   scripts/deploy.sh verify    # 起平行容器验证（:3001，只绑回环）
#   scripts/deploy.sh cutover   # 切换主容器
#   scripts/deploy.sh rollback  # 回滚到上一个镜像
#
set -euo pipefail

SRC=/opt/galaxis-newapi-src
DEPLOY=/opt/new-api
VERSION=$(cat "$SRC/VERSION")
IMAGE="galaxis/new-api:${VERSION}"

case "${1:-}" in

build)
  cd "$SRC"
  echo "==> 构建 $IMAGE"
  docker build -t "$IMAGE" -t galaxis/new-api:latest .
  docker images galaxis/new-api --format '  {{.Repository}}:{{.Tag}}  {{.Size}}'
  ;;

verify)
  # 平行容器的要点：
  #   - NODE_TYPE=slave：从节点在 model.InitDB 里直接 return，跳过 migrateDB()，
  #     对生产库的表结构零风险
  #   - 只绑 127.0.0.1，外部访问不到
  #   - 独立的 /data 目录，不与生产容器争用
  #   - SESSION_COOKIE_SECURE=false：验证走本机 http，secure cookie 不会下发；
  #     生产编排里该项保持 true
  cat > /tmp/verify.yml <<YAML
services:
  new-api-verify:
    image: ${IMAGE}
    container_name: new-api-verify
    restart: "no"
    command: --log-dir /app/logs
    ports:
      - "127.0.0.1:3001:3000"
    volumes:
      - /tmp/verify-data:/data
      - /tmp/verify-logs:/app/logs
    environment:
      - SQL_DSN=postgresql://root:\${PG_PASSWORD}@postgres:5432/new-api
      - REDIS_CONN_STRING=redis://:\${REDIS_PASSWORD}@redis:6379
      - SESSION_SECRET=\${SESSION_SECRET}
      - TZ=Asia/Shanghai
      - NODE_NAME=verify
      - NODE_TYPE=slave
      - SESSION_COOKIE_SECURE=false
    networks:
      - new-api_new-api-network
networks:
  new-api_new-api-network:
    external: true
YAML
  mkdir -p /tmp/verify-data /tmp/verify-logs
  cd "$DEPLOY"
  docker compose --env-file .env -f /tmp/verify.yml up -d --force-recreate new-api-verify
  sleep 15
  echo "==> 版本"
  curl -s http://127.0.0.1:3001/api/status | grep -o '"version":"[^"]*"'
  echo "==> 三个页面"
  for p in / /sign-in /sign-up; do
    printf '  %-10s HTTP %s\n' "$p" "$(curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:3001$p)"
  done
  echo
  echo "浏览器验证： ssh -N -L 3001:127.0.0.1:3001 <本机>  然后开 http://127.0.0.1:3001/"
  echo "验证完记得： docker compose --env-file .env -f /tmp/verify.yml down"
  ;;

cutover)
  cd "$DEPLOY"
  TS=$(date +%Y%m%d-%H%M%S)
  echo "==> 备份"
  cp -a docker-compose.yml "docker-compose.yml.bak.$TS"
  echo "  docker-compose.yml.bak.$TS"

  OLD=$(grep -m1 '^    image: galaxis/new-api' docker-compose.yml | awk '{print $2}')
  echo "  当前镜像: $OLD"

  # 先换镜像再动 Caddy（本次已无 Caddy 拦截规则，仅保留顺序习惯）：
  # 反过来做会出现「页面已不由 Caddy 提供、但容器还是旧镜像」的可见空窗。
  sed -i "s|^    image: galaxis/new-api:.*$|    image: ${IMAGE}|" docker-compose.yml
  docker compose up -d new-api

  echo "==> 等待健康"
  for i in $(seq 1 20); do
    s=$(docker inspect -f '{{.State.Health.Status}}' new-api 2>/dev/null || echo unknown)
    echo "  $i: $s"
    [[ "$s" == healthy ]] && break
    sleep 8
  done
  curl -s http://127.0.0.1:3000/api/status | grep -o '"version":"[^"]*"'
  ;;

rollback)
  cd "$DEPLOY"
  LAST=$(ls -t docker-compose.yml.bak.* 2>/dev/null | head -1)
  [[ -z "$LAST" ]] && { echo "找不到备份" >&2; exit 1; }
  echo "==> 从 $LAST 回滚"
  grep -m1 '^    image:' "$LAST" | sed 's/^/  目标镜像: /'
  cp -a "$LAST" docker-compose.yml
  docker compose up -d new-api
  ;;

*)
  echo "用法: $0 {build|verify|cutover|rollback}" >&2
  exit 1
  ;;
esac
