// Vercel Serverless Function —— 千问(通义千问 / 阿里云百炼)BYOK 中转
//
// 作用:把浏览器发来的请求转发给阿里云百炼的 OpenAI 兼容接口。
// 关键安全点:
//   - 本函数【不保存】任何 API Key。Key 由浏览器在每次请求的 x-api-key 头里携带,
//     用完即转发,不写日志、不落盘、不存环境变量。
//   - 这样 Key 不会出现在前端源码里,也不会进入 GitHub 仓库。
//
// 可选加固:在 Vercel 项目里设置环境变量 ALLOW_ORIGIN 为你的页面域名
//   (如 https://你的项目.vercel.app),只允许自己的页面调用。默认 * 允许任意来源。

const UPSTREAM = 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions';

export default async function handler(req, res) {
  const origin = process.env.ALLOW_ORIGIN || '*';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-api-key');
  res.setHeader('Access-Control-Max-Age', '86400');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // Key 只从请求头读取,绝不从服务端环境变量兜底,避免误用他人额度
  const apiKey = req.headers['x-api-key'];
  if (!apiKey || typeof apiKey !== 'string') {
    return res.status(401).json({ error: '缺少 API Key(x-api-key 头)。请在页面里保存你自己的千问 Key。' });
  }

  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = null; } }
  if (!body || !Array.isArray(body.messages)) {
    return res.status(400).json({ error: '请求格式错误:需要 messages 数组。' });
  }

  // 只透传必要字段,做基本上限,避免被滥用
  const payload = {
    model: typeof body.model === 'string' ? body.model : 'qwen-plus',
    messages: body.messages.slice(-40),
    temperature: typeof body.temperature === 'number' ? body.temperature : 0.6,
    max_tokens: 800,
  };

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 45000);
    const upstream = await fetch(UPSTREAM, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + apiKey },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    clearTimeout(timer);
    const text = await upstream.text();
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    // 原样回传上游状态与内容(含错误信息),便于前端显示具体原因
    return res.status(upstream.status).send(text);
  } catch (e) {
    const msg = e.name === 'AbortError' ? '上游超时(45s)' : ('中转请求失败:' + e.message);
    return res.status(502).json({ error: msg });
  }
}
