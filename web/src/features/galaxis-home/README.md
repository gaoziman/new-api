# Galaxis 定制页面

替换 New API 的首页、登录页、注册页，换成客户设计的界面。

## 对上游的改动面

**只有 3 个上游文件，各 2 行**——一行 import、一行 component：

| 文件 | 改动 |
|---|---|
| `src/routes/index.tsx` | `Home` → `GalaxisHome` |
| `src/routes/(auth)/sign-in.tsx` | `SignIn` → `GalaxisSignIn` |
| `src/routes/(auth)/sign-up.tsx` | `SignUp` → `GalaxisSignUp` |

上游原本的 `features/home`、`features/auth/sign-in`、`features/auth/sign-up`
**原封保留**，没有删也没有改。这样做有两个好处：

- **回滚**只需把这 3 行改回去，不必还原任何代码；
- **合并上游更新**时，冲突面只有这 3 行。这三个路由文件在上游的改动频率很低
  （基线 v1.0.0-rc.36 之前 90 天内各有 1~2 次改动），冲突概率和处理成本都很小。

我们自己的代码全部放在新增目录里，上游不会碰：

- `src/features/galaxis-home/` —— 首页
- `src/features/galaxis-auth/` —— 登录 / 注册页

## 设计如何落地的

界面来自客户原型（`macos/galaxis-web` 里的 Astro 工程）。JSX **不是手抄的**，
由脚本机械转换——原型有约 2000 行标签、36 个内联 SVG、上百个带 CSS 自定义属性
的 style，手抄的错误是视觉性的：编译能过，肉眼看不出来。

### 重新生成（客户更新设计后）

```bash
# 1) 标签：Astro → JSX
#    先剥掉 .astro 的 frontmatter，再转换
node web/scripts/html-to-jsx.cjs <剥好的.html> <输出.jsx>

# 2) 样式：收进作用域
node web/scripts/scope-css.cjs \
  "…/prototype.css,…/pricing-table.css" ".gx-home" \
  web/src/features/galaxis-home/galaxis-home.css
```

两个脚本都遵循**遇到无法确定的输入直接报错、绝不猜**。转换完必须跑
`bun run typecheck` 并在浏览器里实际看一遍。

### 为什么样式必须收作用域

原型是独立页面，样式表里有 `:root` / `html` / `body` / `a` / `button` / `main` / `*`
这些元素级选择器，还有 `.nav` / `.brand` / `.stage` / `.node` 这类极通用的类名。
注入单页应用后，样式表一经加载就对**整站**生效：`button{}` 会重绘控制台里每一个
按钮，`:root` 会改写全站 CSS 变量并干掉暗色模式。而且换路由不会卸载样式表，
离开首页后污染依然在。

所以首页样式全部收在 `.gx-home` 下、登录注册页收在 `.gx-auth` 下。
**根元素上的这个类不能删**，删了整页会退化成无样式的裸 HTML。

## 从静态站搬进单页应用时改了什么

设计本身没动。以下几处是「独立页面 → SPA」必须做的适配：

1. **站内跳转改成 `<Link>`**。原型里是跨站 `<a href="https://galaxisrouter.cn/sign-up">`，
   留着会让同一个 SPA 内部的跳转走一次整页重载。
2. **交互脚本补上卸载逻辑**。原型的 4 个脚本（滚动进度、轨道轮播、微信浮标、
   放映厅）都是「加载即执行、从不清理」——独立页面靠整页卸载兜底。在 SPA 里
   不清理的话，离开首页后那个每 1.6 秒的定时器还在跑并操作已移除的 DOM，
   进出几次就叠加几份。见 `use-home-effects.ts`。
3. **数据改为运行期获取**。版本号和价目表原本在构建期烘进 HTML。后端二进制的
   发布节奏远慢于客户端版本，烘死必然过期（线上出现过官网停在 0.2.2、
   客户端已发 0.2.3）。见 `use-release.ts` 与 `pricing.ts`。
4. **平台判断交回 React**。原型用脚本在加载后改 DOM（给命中系统的按钮加样式、
   重排、改写页脚链接）。那套有顺序依赖：页脚链接从 Hero 复制 `href`，而 Hero
   的地址是异步取回的。见 `use-platform.ts`。
5. **已登录用户**在导航里看到的是「控制台」而不是「免费注册」。

## 升级与部署

切到二开镜像后，升级不再是 `docker pull`。两个脚本把流程固定下来：

```bash
# 本地：先看跟进某个上游版本会付出什么代价（只读，不动代码）
scripts/upgrade.sh --check v1.0.0-rc.40
scripts/upgrade.sh v1.0.0-rc.40          # 合并 + typecheck + test + build

# 服务器：构建 → 平行验证 → 切换（出事可回滚）
scripts/deploy.sh build
scripts/deploy.sh verify     # 起在 :3001，只绑回环，NODE_TYPE=slave 不碰表结构
scripts/deploy.sh cutover
scripts/deploy.sh rollback
```

`upgrade.sh --check` 会分别列出两类影响：

- **冲突面**：我们替换过的那 3 个文件，上游动过就会冲突。
  处理原则是**保留上游的全部改动**，只把 component 换回 Galaxis 版本。
- **兼容面**：我们依赖但没改的上游模块（认证 API、几个 hook、auth-store）。
  这些不会冲突，但接口一变我们的页面就编译不过，所以合并后必须跑 typecheck。

## 已知的待办（内容缺口，不是代码问题）

- `01.mp4`（教程视频）与 `wechat-qr.png`（企业微信二维码）在客户官网上
  **本来就是 404**，属于尚未提供的素材。需要客户给图/视频后再决定放哪里
  （放进 `web/public/` 会打进后端二进制，视频体积较大时建议走 Caddy 静态目录）。
- 服务协议 / 隐私政策在后台是**关闭**状态（`user_agreement_enabled`、
  `privacy_policy_enabled` 均为 false）。页面已按开关降级为纯文本，
  管理员启用并填好内容后会自动变成链接。

## lint 说明

生成的标签里 `<i></i>` 这类空元素没有改写成自闭合形式，`oxlint` 会报
`self-closing-comp` **告警**（非错误）。这是刻意保留的：保持与原型逐字对应，
客户更新设计后重新转换才不会产生无意义的 diff。
