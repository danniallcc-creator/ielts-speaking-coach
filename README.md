# 雅思口语学习工作台 + 千问语音陪练

一个纯前端的雅思口语 6.5 学习计划网页，外加一个「自带 Key（BYOK）」的千问语音陪练。
整套可部署到你自己的 Vercel（代码托管在 GitHub）。

## 文件说明

```
├── index.html          学习工作台主页（12个月计划 + 跟踪 + 验收，纯本地，不联网）
├── voice-coach.html    语音陪练页（浏览器录音转文字 + 朗读，调用千问）
├── api/chat.js         Vercel 中转函数（转发请求给千问，不保存 Key）
├── vercel.json         Vercel 配置
└── .gitignore          防止把密钥/本地文件误传到仓库
```

## ⚠️ 关于 API Key 的安全底线（务必先读）

- **GitHub 公开仓库的代码对所有人可见。绝对不要把千问 Key 写进任何文件后提交。**
- 本项目采用 **BYOK**：Key 只保存在你**浏览器本地**（localStorage），每次对话时通过 HTTPS
  发给**你自己部署**的 `api/chat.js`，再转发给千问。`api/chat.js` **不保存** Key。
- 阿里云百炼默认**不允许浏览器直接跨域调用**（正是为了保护 Key），所以必须经过这个中转函数。
- 请到[阿里云百炼控制台](https://bailian.console.aliyun.com/)给 Key 设**用量上限**，防止意外或泄露导致高额账单。
- 不要在公用电脑保存 Key；页面上有「清除 Key」按钮。

## 部署步骤（Vercel 同时托管网页和中转，最简单）

### 1. 把代码放到你的 GitHub

```bash
# 在 github-deploy 目录下
git init
git add .
git commit -m "IELTS speaking workbench + Qwen voice coach"
# 在 GitHub 新建一个空仓库（可设为 Private，更安全），然后：
git remote add origin https://github.com/<你的用户名>/<仓库名>.git
git branch -M main
git push -u origin main
```

### 2. 连接 Vercel

1. 注册/登录 [vercel.com](https://vercel.com)（可用 GitHub 账号登录）。
2. 点 **Add New → Project**，选中刚推送的仓库，**Import**。
3. Framework 选 **Other**，其余保持默认，点 **Deploy**。
4. 部署完成后得到一个地址，如 `https://你的项目.vercel.app`。

### 3. 使用

1. 打开 `https://你的项目.vercel.app/`（学习工作台），点「语音陪练」进入，
   或直接打开 `https://你的项目.vercel.app/voice-coach.html`。
2. 在页面「连接设置」里粘贴你的**千问 Key**，点保存（只存你本地浏览器）。
3. 「中转接口地址」保持默认 `/api/chat` 即可（因为网页和接口同域）。
4. 点「测试连接」→ 成功后点「开始新一轮陪练」，用麦克风说话。

### 4.（可选）只允许自己的页面调用中转

在 Vercel 项目 → **Settings → Environment Variables** 添加：

```
ALLOW_ORIGIN = https://你的项目.vercel.app
```

重新部署后，中转只接受来自该域名的请求。

## 如果你想用 GitHub Pages 托管网页

GitHub Pages 只能放静态文件，**不能运行 `api/chat.js`**。做法：
- 网页（index.html / voice-coach.html）放 GitHub Pages；
- 中转函数仍部署到 Vercel；
- 在语音陪练页把「中转接口地址」填成 `https://你的项目.vercel.app/api/chat`；
- 并在 Vercel 设 `ALLOW_ORIGIN` 为你的 Pages 域名（否则浏览器跨域会被拦）。

## 费用与兼容性

- 调用千问按阿里云百炼实际用量计费，价格以控制台为准；语音识别/朗读用浏览器自带能力，不另收费。
- 语音识别（Web Speech API）在 **Chrome / Edge** 支持最好；Safari、Firefox 可能不支持，此时直接打字。
- 语音识别需要 HTTPS；Vercel / GitHub Pages 都是 HTTPS。本地双击 `file://` 打开可能无法录音。

## 隐私

- 学习工作台（index.html）完全本地运行，不联网、不上传。学习记录存在浏览器里，请定期用页面里的「导出 JSON」备份。
- 语音陪练会把你**输入的文字**发给千问以生成回复；请勿输入工作机密或敏感个人信息。
- 千问只收到语音转写的**文字**，看不到真实发音，**不会也不应给出雅思口语分数**。发音与最终评分请找熟悉雅思标准的老师。
