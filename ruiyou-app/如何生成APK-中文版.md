# 瑞友 RUIYOU：生成可安装安卓 APK（中文操作指南）

> 当前文件包是**源码**，不是 APK。本环境缺少 Android SDK，且无法连接 npm，因此没有成功编译；通过下面的 GitHub Actions，可以在云端尝试编译。只有构建步骤全部显示成功后，生成的才是真实 APK。

## 第一阶段：开通真实聊天服务（必须）

1. 打开 https://supabase.com/dashboard 登录或注册，创建一个 Project。
2. 打开该 Project 的 SQL Editor，把本项目 `supabase/schema.sql` 全部复制粘贴、运行（请先检查脚本与项目配置）。
3. 在项目设置找到 Project URL 以及 Publishable key（或 legacy anon key）。请勿使用 service_role/secret key。
4. 确认 Authentication → Providers → Email 已启用邮箱密码登录，并根据账号验证要求配置验证邮件。

## 第二阶段：上传源码到 GitHub

1. 登录 https://github.com ，点击 New repository，仓库名称可以用 `ruiyou-android`；建议先设为 Private。
2. 上传解压后的项目**内部所有文件和文件夹**，而不只是 ZIP 文件。尤其要确保 `.github/workflows/android-debug.yml` 已出现在仓库中，`package.json` 在仓库根目录。
3. 在仓库 Settings → Secrets and variables → Actions → New repository secret，依次新增：
   - `VITE_SUPABASE_URL`：粘贴 Supabase Project URL
   - `VITE_SUPABASE_ANON_KEY`：粘贴 Supabase 的公开 Publishable key（或 anon key）
4. GitHub 上不要上传含真实密码、service_role、TURN_SHARED_SECRET 的文件。`VITE_` 开头的变量会被打包进客户端，**只能存放公开可暴露的值**。

## 第三阶段：自动编译 APK

1. 打开仓库 Actions → Build Ruiyou Debug APK。
2. 选择 Run workflow → Run workflow。如果没有看到 Actions，检查仓库已启用 Actions 且 `.github/workflows/android-debug.yml` 文件在默认分支。
3. 构建成功后，进入该运行结果页下方的 Artifacts → `ruiyou-debug-apk`，下载自动生成的 ZIP。
4. 解压刚下载的 Artifacts ZIP，找到 **`app-debug.apk`**。只有这个 `.apk` 才可以直接安装到安卓手机。

## 第四阶段：安装与测试

1. 把 `app-debug.apk` 发到安卓手机，点击打开；系统如提示不允许此来源安装，按设备提示允许此来源安装，再继续。
2. 如果手机提示安全风险，先确认 APK 来自你自己的 GitHub 构建结果。不要从陌生网站下载修改版。
3. 在两部手机安装同一个 APK，分别注册两个不同的账号。完成验证后，添加好友并互发消息。
4. 进入好友聊天，点击视频图标，对方保持瑞友处于前台接听。首次使用允许摄像头与麦克风权限。
5. 若同一 Wi‑Fi 能通话、移动网络不能通话，需进一步正确部署 TURN 服务；详见 README。

## 重要限制

- APK 只是开发测试包，并不代表已经上架应用商店、正式签名发布或通过手机真机测试。
- 当前版本没有后台来电推送；App 不在前台时通常无法收到系统级来电弹窗。
- 视频通话是否成功依赖摄像头权限、双方网络、Supabase Realtime、WebRTC 信令以及必要时的 TURN 中继。
- 如构建失败，点击失败任务对应的日志，把错误信息发给我以便定位。

## 备选方法：Windows + Android Studio

安装 Node.js 22+、JDK 21、Android Studio 及 Android SDK，创建项目根目录 `.env`（使用 `.env.example` 的公开配置），在终端执行：

```bash
npm install
npm run check
npm run android:init
```

之后打开生成的 `android/` 文件夹，等待 Android Studio Gradle Sync，选择 Build → Build Bundle(s) / APK(s) → Build APK(s)。一般位于 `android/app/build/outputs/apk/debug/app-debug.apk`。
