# 瑞友 RUIYOU · Google Play 正式发布清单（待完成）

> **现在不可提交公开正式版。** 当前 GitHub 仅有测试 APK；实际 Supabase 服务尚未配置/验证。已准备手动“signed AAB”构建流程，**不会自动上传到 Play Console**。

## 一、真实功能与安全（必须）
- [ ] 创建 Supabase 项目并执行 `supabase/schema.sql`，在 GitHub Actions secrets 填项目公开 URL / Publishable Key（不要填 service_role）。
- [ ] 两部安卓真机分别注册、验证邮箱、互加好友、双向消息收发和离线重登持久化测试。
- [ ] 部署安全 TURN 中继与凭据 Edge Function，测试 Wi-Fi / 4G / 5G 跨网络一对一音视频；明确当前仅前台接听，后台没有系统来电推送。
- [ ] 实现并测试 **举报用户/动态、拉黑用户、审核与处置滥用内容**；完善社区规则、风控和客服处理机制。现版本这些功能尚未实现。
- [ ] 实现账号及关联数据删除，并提供 **App 内 + App 外（网页）** 的可用删除入口；验证处理用户数据的保留/删除政策。当前尚未实现。
- [ ] 验证用户名、动态及私信的隐私和安全规则；补齐用户数据访问控制、滥用/刷屏防护、异常监控和使用条款。
- [ ] 完成适用地区的年龄分级、未成年人安全评估；如向未成年人开放，先实施相应保障机制。

## 二、App 构建与签名
- [ ] 注册 [Google Play Console](https://play.google.com/console/) 并完成个人/组织验证。
- [ ] 在 Play Console 创建名为“瑞友”的 App，先选择内部测试轨道。
- [ ] 创建并离线备份 **Play 上传签名密钥**（upload key）；不要上传 GitHub 仓库、聊天窗口或云端公开页面。
- [ ] 在 GitHub 仓库的 Actions Secrets 安全添加：
  `ANDROID_KEYSTORE_BASE64`、`ANDROID_KEYSTORE_PASSWORD`、`ANDROID_KEY_ALIAS`、`ANDROID_KEY_PASSWORD`、`VITE_SUPABASE_URL`、`VITE_SUPABASE_ANON_KEY`。
- [ ] 手动运行 Actions → **Prepare signed Google Play AAB**；成功后从 Artifacts 下载签名 `.aab`，测试是否满足 API 36 和版本号要求。
- [ ] 使用 Play App Signing；今后升级必须沿用相同上传密钥且递增 versionCode。
- [ ] 完成多设备兼容性测试和 Android 16 权限/画面/视频测试。

## 三、应用商店资料
- [ ] 真实、清晰的 App 图标（项目已有 Android 启动图标；仍需检查 Google Play 512×512 PNG 和素材规格）。
- [ ] 根据 **实际可用功能** 制作真实屏幕截图、简短介绍、详细介绍、商店图文，严禁用设计参考图冒充实机图。
- [ ] 自己的客服邮箱、开发者身份名称、开发者联系信息和支持页面。
- [ ] 公开可访问的隐私政策 URL，需与实际数据处理一致；App 内也需可访问。
- [ ] App 外账号删除申请 URL，且能处理申请。
- [ ] 填写数据安全（Data safety）、权限、内容分级、目标受众等表单。

## 四、上线流程
1. 内部测试 → 修复崩溃和隐私问题。
2. 若是 2023-11-13 后创建的 Play **个人开发者账号**，通常需要 **至少 12 名测试人员连续参与封闭测试 14 天**，之后才能申请正式发布权限。
3. Google 审核通过并开放 Production 后，才有 Google Play 可搜索、安装的正式页面。
4. 上线后持续监控、处理举报/删除、软件维护和安全更新。

## 注意
- GitHub Releases 中 `ruiyou-preview.apk` 仅是调试预览包，**不具备正式商店分发要求**。
- 2026-08-31 起 Android 手机新 App/更新一般需 target Android 16/API 36+。
- 任何生产签名密钥及 Supabase secret/service role 均不得复制进仓库或聊天。
- 不要在完成线上隐私及安全审查前公开招募用户。
