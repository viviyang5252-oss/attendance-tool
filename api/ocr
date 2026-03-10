/**
 * Vercel Serverless Function: /api/ocr
 * 作用：代理转发百度 OCR API，解决浏览器直连百度接口的跨域限制。
 *
 * POST /api/ocr  { apiKey, secretKey, imageBase64 }
 *   → 返回 { lines: ['识别行1', '识别行2', ...] }
 */
module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { apiKey, secretKey, imageBase64 } = req.body || {};
  if (!apiKey || !secretKey || !imageBase64) {
    return res.status(400).json({ error: '缺少必要参数' });
  }

  try {
    // 第一步：获取百度 access_token
    const tokenRes = await fetch(
      `https://aip.baidubce.com/oauth/2.0/token?grant_type=client_credentials&client_id=${encodeURIComponent(apiKey)}&client_secret=${encodeURIComponent(secretKey)}`,
      { method: 'POST' }
    );
    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) {
      return res.status(401).json({ error: 'API Key 或 Secret Key 错误，请检查百度控制台配置', detail: tokenData });
    }

    // 第二步：调用通用文字识别（标准版）
    const params = new URLSearchParams();
    params.append('image', imageBase64);
    params.append('language_type', 'CHN_ENG');

    const ocrRes = await fetch(
      `https://aip.baidubce.com/rest/2.0/ocr/v1/general_basic?access_token=${tokenData.access_token}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params.toString(),
      }
    );
    const ocrData = await ocrRes.json();

    if (ocrData.error_code) {
      return res.status(400).json({ error: `百度OCR错误: ${ocrData.error_msg}`, code: ocrData.error_code });
    }

    const lines = (ocrData.words_result || []).map(w => w.words);
    return res.status(200).json({ lines });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
