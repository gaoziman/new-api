#!/usr/bin/env bash
#
# 跟进上游 New API 版本。
#
# 【为什么需要这个脚本】切到二开镜像后，升级不再是 `docker pull` 一条命令。
# 但真正的工作量也不大——我们对上游只改了 3 个文件、每个 2 行，
# 冲突面就这么大。这个脚本的价值在于**先把冲突面摆出来给人看**，
# 而不是闷头 merge 完再收拾。
#
# 用法：
#   scripts/upgrade.sh v1.0.0-rc.40      # 跟进到指定上游 tag
#   scripts/upgrade.sh --check v1.0.0-rc.40   # 只看会有什么冲突，不动代码
#
set -euo pipefail

# 我们替换了组件的上游文件。升级时只有这几个可能冲突。
SWAP_FILES=(
  "web/src/routes/index.tsx"
  "web/src/routes/(auth)/sign-in.tsx"
  "web/src/routes/(auth)/sign-up.tsx"
)

# 我们依赖的上游模块。它们不会冲突（我们没改），
# 但接口变了会让我们的页面编译不过，所以升级时要一起看。
DEPENDED_ON=(
  "web/src/features/auth/api.ts"
  "web/src/features/auth/types.ts"
  "web/src/features/auth/hooks/use-auth-redirect.ts"
  "web/src/features/auth/hooks/use-turnstile.ts"
  "web/src/features/auth/hooks/use-email-verification.ts"
  "web/src/features/auth/lib/storage.ts"
  "web/src/components/turnstile.tsx"
  "web/src/hooks/use-status.ts"
  "web/src/stores/auth-store.ts"
)

CHECK_ONLY=0
if [[ "${1:-}" == "--check" ]]; then
  CHECK_ONLY=1
  shift
fi

TARGET="${1:-}"
if [[ -z "$TARGET" ]]; then
  echo "用法: $0 [--check] <上游 tag，如 v1.0.0-rc.40>" >&2
  exit 1
fi

if ! git remote get-url upstream >/dev/null 2>&1; then
  echo "添加 upstream 远端…"
  git remote add upstream https://github.com/QuantumNous/new-api.git
fi

echo "==> 拉取上游"
git fetch upstream --tags --quiet

if ! git rev-parse -q --verify "refs/tags/$TARGET" >/dev/null; then
  echo "找不到 tag: $TARGET" >&2
  echo "可用的近期 tag：" >&2
  git tag -l 'v*' --sort=-creatordate | head -10 | sed 's/^/  /' >&2
  exit 1
fi

BASE=$(git merge-base HEAD "$TARGET")

echo
echo "==> 冲突面：我们替换过的上游文件（$BASE..${TARGET}）"
CONFLICT=0
for f in "${SWAP_FILES[@]}"; do
  n=$(git rev-list --count "$BASE".."$TARGET" -- "$f")
  if [[ "$n" -gt 0 ]]; then
    printf '  ⚠️  %-38s 上游改动 %s 次\n' "$f" "$n"
    git log --oneline "$BASE".."$TARGET" -- "$f" | sed 's/^/        /'
    CONFLICT=1
  else
    printf '  ✓   %-38s 无改动\n' "$f"
  fi
done
[[ "$CONFLICT" -eq 0 ]] && echo "  → 这三个文件上游没动，合并不会冲突。"

echo
echo "==> 兼容面：我们依赖但没改的上游模块"
echo "    （不会冲突，但接口变了我们的页面会编译不过）"
for f in "${DEPENDED_ON[@]}"; do
  n=$(git rev-list --count "$BASE".."$TARGET" -- "$f")
  [[ "$n" -gt 0 ]] && printf '  ⚠️  %-52s 改动 %s 次\n' "$f" "$n"
done || true

if [[ "$CHECK_ONLY" -eq 1 ]]; then
  echo
  echo "（--check 模式，未改动任何代码）"
  exit 0
fi

echo
echo "==> 合并 $TARGET"
echo "    冲突时的处理原则：这 3 个文件**保留上游的全部改动**，"
echo "    只把 component 换回 Galaxis 版本（一行 import + 一行 component）。"
git merge "$TARGET" || {
  echo
  echo "有冲突，解决后执行： git merge --continue" >&2
  echo "然后再跑： bun run typecheck && bun run test && bun run build" >&2
  exit 1
}

echo
echo "==> 验证"
cd web
bun install --frozen-lockfile
bun run typecheck
bun run test
bun run build
cd ..

echo
echo "==> 更新 VERSION"
echo "    当前: $(cat VERSION)"
echo "    建议改成: ${TARGET}-galaxis.1"
echo "    改完提交，然后在服务器上执行 scripts/deploy.sh"
