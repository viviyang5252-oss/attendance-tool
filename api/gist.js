/**
 * Vercel Serverless Function: /api/gist
 * 作用：代理转发 GitHub Gist API 请求，解决国内无法直连 GitHub 的问题。
 *
 * GET  /api/gist?token=xxx&gistId=xxx  → 读取 Gist
 * POST /api/gist  { token, filename, content }          → 新建 Gist
 * PUT  /api/gist  { token, gistId, filename, content }  → 更新 Gist
 */
module.exports = async function handler(req, res) {
  // ── CORS ──
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  let token, gistId, filename, content;

  if (req.method === 'GET') {
    ({ token, gistId } = req.query);
  } else {
    ({ token, gistId, filename, content } = req.body || {});
  }

  if (!token) return res.status(400).json({ error: 'Missing token' });

  const ghHeaders = {
    Authorization: `token ${token}`,
    Accept: 'application/vnd.github.v3+json',
    'Content-Type': 'application/json',
    'User-Agent': 'wd-attendance-tool/1.0',
  };

  try {
    let url, method, body;

    if (req.method === 'GET') {
      if (!gistId) return res.status(400).json({ error: 'Missing gistId' });
      url    = `https://api.github.com/gists/${gistId}`;
      method = 'GET';

    } else if (req.method === 'POST') {
      if (!filename || !content) return res.status(400).json({ error: 'Missing filename or content' });
      url    = 'https://api.github.com/gists';
      method = 'POST';
      body   = JSON.stringify({
        description: '无尽冬日联盟考勤数据（自动生成，请勿手动修改）',
        public: false,
        files: { [filename]: { content } },
      });

    } else if (req.method === 'PUT') {
      if (!gistId || !filename || !content) return res.status(400).json({ error: 'Missing params' });
      url    = `https://api.github.com/gists/${gistId}`;
      method = 'PATCH';
      body   = JSON.stringify({
        files: { [filename]: { content } },
      });

    } else {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const response = await fetch(url, { method, headers: ghHeaders, body });
    const data     = await response.json();
    return res.status(response.status).json(data);

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
