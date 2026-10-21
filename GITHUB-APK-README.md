# 瑞友 RUIYOU · Android APK
项目已经移至仓库根目录，GitHub Actions 可在云端生成安卓安装包。

## 下载
查看 [Actions](https://github.com/qwe567893/ruiyou-android/actions) 的最新 Build Ruiyou Android APK 构建。构建成功后，Artifacts 可下载 ruiyou-android-apk。
自动发布的预览版位于 [Releases](https://github.com/qwe567893/ruiyou-android/releases)。没有配置 Supabase 时，预览 APK **不能实际聊天或视频通话**。

## 启用真实社交功能
1. 在 Supabase 创建项目，并在 SQL Editor 执行 [supabase/schema.sql](supabase/schema.sql)。
2. 在 GitHub Settings → Secrets and variables → Actions 新建 Repository secrets：VITE_SUPABASE_URL 和 VITE_SUPABASE_ANON_KEY（仅公开 publishable/anon key，**绝不要填 service_role key**）。
3. 在 Actions → Build Ruiyou Android APK 点击 Run workflow，重新生成含连接配置的 APK。
4. 在两部手机上完成注册、添加好友、聊天和视频测试。不同运营商网络的可靠视频还需 TURN 服务。
5. Android Store 正式发布另需签名 AAB、隐私政策、内容治理和商店开发者账号。

⚠ 当前版本属于测试版，不要当作已经可正式运营的公众社交平台。详细内容见 [安装指南](安装指南-先看我.md)。
