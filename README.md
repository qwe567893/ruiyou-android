# 瑞友 RUIYOU v2.1 · 安卓社交 App（联网开发版）

**本项目是真正的 Android Capacitor App 源码，不是已经编译好的 APK。** UI、登录、好友、文字动态、云端私聊、WebRTC 一对一视频流程已接线；但必须接入你的 Supabase 项目并构建 Android 安装包，才能由两台手机实际联网使用。开发环境没有 Android SDK、也没有你的云服务凭据，因此目前**尚未完成真实双机联调，不保证视频跨所有移动网络可连通**。

## 功能范围

| 功能 | 已编写 | 实际运行条件 |
| --- | --- | --- |
| 暗色流光玻璃首页 / 导航 | ✅ | App 安装后 |
| 邮箱注册与登录 | ✅ | Supabase Auth + 允许邮箱注册 |
| 昵称、简介、发现用户 | ✅ | profiles 表 + RLS |
| 好友申请、接受、拒绝 | ✅ | friend_requests + RPC |
| 双向云端私聊、消息持久化 | ✅ | messages + Supabase Realtime / 轮询 |
| 发布文字动态 | ✅ | posts 表 |
| 一对一视频来电 / 接听 / 拒绝 / 挂断 | ✅ | call_sessions + call_signals + WebRTC + 摄像头麦克风 |
| 麦克风静音 / 开关摄像头 / 镜头翻转 | ✅ | 安卓真机硬件支持 |
| 不同运营商之间稳定视频 | ⚠️ | 另需配置 TURN + 真实双机测试 |
| 后台来电通知 / 无网络呼叫 | ❌ | 需 FCM、原生服务，尚未开发 |
| 图片视频动态上传、群聊 | ❌ | 尚未开发 |
| 完整举报/拉黑/内容审核/账号删除 | ❌ | 正式公众上线前必须补齐 |

已为安卓启动图标准备 `assets/android-icons/`，在创建或同步安卓工程时由 `scripts/android-branding.mjs` 自动写入资源文件。

**第一次操作请先读：`安装指南-先看我.md`。**

## 1. 准备 Supabase 后端

1. 访问 https://supabase.com/dashboard ，创建新的 Supabase Project。
2. 进入 **SQL Editor**，完整执行 `supabase/schema.sql`。该脚本创建数据库、RLS、好友与呼叫 RPC、Realtime publication。
3. 进入 **Authentication → Providers → Email**，启用邮箱密码登录。建议保持邮箱确认开启；两名测试用户必须完成邮箱验证。测试确认邮件的 Site URL/Redirect URL 请根据你的项目部署设置。
4. 在项目中找到 **Project URL** 和 **Publishable Key（或 legacy anon key）**。将 `.env.example` 复制成 `.env` 并填写：
   ```env
   VITE_SUPABASE_URL=https://你的项目ID.supabase.co
   VITE_SUPABASE_ANON_KEY=你的publishable或anon公钥
   ```
5. 不得在 `.env` 或前端代码中填入 service_role/secret key。**RLS 必须启用**，否则用户数据不安全。

SQL 设计：只有好友能给对方发文字消息或发起视频；只有两个通话参与者能读取/写入该次通话信令。数据库行访问由 RLS 管理，接受好友和处理来电的状态转换由校验身份的 SQL RPC 处理。文字动态对已登录用户可见，昵称搜索对已登录用户开放。

## 2. 本地运行与安卓打包

要求：Node.js 22+、Android Studio（带 Android SDK 和所需平台版本）、JDK 21（以 Android Studio/Capacitor 8 的要求为准）。

```bash
npm install
npm run check
npm run dev
```

电脑浏览器可先测试登录 / 发消息。**摄像头功能必须从安全来源（localhost/HTTPS）打开**；建议使用实际 APK 测试 Android WebRTC。

首次生成安卓工程：

```bash
npm run android:init
npm run android:open
```

Android Studio 内等待 Gradle Sync，选择 **Build → Build Bundle(s) / APK(s) → Build APK(s)**。常见产物：

```
android/app/build/outputs/apk/debug/app-debug.apk
```

重新修改前端后：`npm run android:sync`，再执行 Android Studio 的 Build APK(s)。

> `scripts/android-permissions.mjs` 自动向生成的 AndroidManifest.xml 注入 CAMERA、RECORD_AUDIO、MODIFY_AUDIO_SETTINGS 和 INTERNET；**首次视频通话时用户需允许相机和麦克风权限**。Capacitor Android 的 WebChromeClient 处理 WebView 媒体权限请求。如自定义 Android WebView 或更改原生配置，必须重新检验权限流程。

### 不安装 Android Studio 的替代方式：GitHub Actions

本项目包含 `.github/workflows/android-debug.yml`。创建你自己的 GitHub 仓库上传完整源码，在 Repo Settings → Secrets and variables → Actions 中新增 `VITE_SUPABASE_URL` 与 `VITE_SUPABASE_ANON_KEY`。点击 Actions → **Build Ruiyou Debug APK** → Run workflow，构建完成后下载 Artifacts 下的 APK zip。此流程尚未在你的 GitHub 账号中执行过，需要你自己添加 secrets、触发 workflow；GitHub 免费用量有其限制。

呼叫超过约 65 秒无人接听时，呼叫方会自动结束并返回聊天；超过 90 秒的旧来电不能再接听。

## 3. 两部安卓手机聊天测试

1. 使用同一后端配置生成 APK，安装到安卓手机 A 与 B。
2. A 注册 `a@...`，B 注册 `b@...`，完成邮箱验证后登录；**账号不能共用**。
3. A 的「发现」页找到 B，点击 **加好友**；B 的「消息」页选择 **同意**。
4. A/B 进入「消息」页打开对话，相互发送文字；切换页面或重启 App 后消息应保留。
5. A 点击聊天页右上角 **📹**，系统请求摄像头和麦克风权限。B 保持 App 打开，即会出现来电界面，选择接听；双方画面应显示，并可静音、切镜头、挂断。
6. 测试 Wi‑Fi↔Wi‑Fi 及 Wi‑Fi↔4G/5G。若视频无法建立，请配置 TURN 并检查网络和权限。应用退到后台时，**目前不会像微信一样弹出系统来电通知**。

## 4. 正式移动网络通话：可选 TURN 中继

本项目实现了 `supabase/functions/turn-credentials/index.ts`，用于向登录用户签发**短时效 TURN 凭据**。仅依赖公共 STUN 有时可直连，但严苛 NAT/运营商网络会失败。推荐自行部署 coturn 或选用可生成临时凭据的受信任托管 TURN 服务。

参考 coturn 服务器设置（仅示意，必须替换域名、证书、随机密钥）：

```ini
realm=turn.example.com
use-auth-secret
static-auth-secret=<长随机服务器密钥>
listening-port=3478
tls-listening-port=5349
min-port=49160
max-port=49200
fingerprint
cert=/etc/letsencrypt/live/turn.example.com/fullchain.pem
pkey=/etc/letsencrypt/live/turn.example.com/privkey.pem
```

打开服务器 UDP/TCP 3478、TCP 5349 和 UDP 中继端口范围（范围需按并发量规划），配置 DNS 与有效 TLS 证书。请在 Supabase Functions Secrets 中设置：

```
TURN_HOST=turn.example.com
TURN_SHARED_SECRET=<与coturn相同的服务器密钥>
```

本机安装 Supabase CLI、登录并连接项目后执行：

```bash
supabase login
supabase link --project-ref 你的项目ID
supabase functions deploy turn-credentials
```

Edge Function 将校验调用者身份后生成短时效 TURN 用户名和 HMAC 凭据；服务端密钥不会进入 APK。**未部署 TURN 函数也可尝试 STUN 直连，但无法保证手机视频呼叫成功。** 长时间通话要测试凭据过期及 TURN allocation refresh，按具体服务商策略调节有效期和刷新。

## 5. 已知限制与上线门槛

- 这是**内测用 MVP**，不是经过商店审核的商用社交软件。未接入你的云账号前，UI 只显示配置指导页。
- 来电依赖 App **前台在线**；尚未接入 Firebase Cloud Messaging、Android 后台推送/前台服务。
- 没有端到端加密消息（Supabase 传输采用 HTTPS/TLS，数据由项目服务端存储）；WebRTC 媒体使用 DTLS-SRTP，但这不等于自行审计的端到端加密聊天服务。
- 没有图片视频动态上传、语音消息、多人通话、拉黑举报、风控、内容审核、未成年人保护、隐私政策、注销/删除账号流程。**在面向公众开放注册前须补齐。**
- 视频通话质量、摄像头切换等在特定安卓机型和运营商网络上可能存在兼容性问题，需要真实真机测试。
- 不要将开发 APK 视为可直接在 Google Play 上架的签名正式版本。上架需正式签名、政策合规、隐私声明以及必要测试。

## 文件结构

```text
src/main.js                 手机 UI + 授权 + 交友 + 消息 + 来电交互
src/lib/backend.js          Supabase Auth / CRUD / Realtime
src/lib/call.js             WebRTC 一对一视频和信令处理
src/style.css               流光玻璃 UI 样式
supabase/schema.sql         数据表、RLS、SQL RPC、Realtime 发布
supabase/functions/turn-credentials/index.ts    安全签发 TURN 临时密钥
scripts/android-permissions.mjs                 安卓媒体权限
.github/workflows/android-debug.yml            云端构建调试 APK
```

## 常见问题

- **登录后空白/提示表不存在**：重新检查 schema.sql 是否完整成功执行、URL 和公钥是否填对。
- **注册后不能登录**：确认邮箱验证是否完成，检查 Supabase Auth 邮件模板和配置。
- **同意好友失败**：确认操作方是收件人，并检查 SQL RPC 权限。
- **消息不实时**：检查 Supabase Realtime 服务、数据库 publication 和 RLS；前台聊天页每隔数秒主动同步作为补偿。
- **视频无法打开**：确认在手机 APK 中运行、授权摄像头和麦克风、手机相机没有被别的 App 占用。
- **有铃声提示但对方不接**：当前只有 App 内的前台来电弹窗，暂不支持后台来电提醒。
- **接通但无画面**：检查双方权限、STUN/TURN 中继配置、服务器端口、运营商 NAT、防火墙、日志和 WebRTC 连接状态。
