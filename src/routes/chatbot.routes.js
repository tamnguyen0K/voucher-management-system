/**
 * File: routes/chatbot.routes.js
 * 
 * Mô tả: Định nghĩa route cho chatbot tích hợp n8n
 * - Nhận câu hỏi từ user và gửi đến n8n webhook
 * - Xử lý và format câu trả lời từ n8n
 * - Tự động linkify các địa điểm trong câu trả lời
 * - Escape HTML để bảo mật
 * 
 * Công nghệ sử dụng:
 * - Express.js Router: Định nghĩa routes
 * - Fetch API: Gọi n8n webhook
 * - Regular Expressions: Tìm và linkify địa điểm trong text
 * - HTML Escaping: Bảo mật chống XSS
 */

const express = require('express');
const router = express.Router();

const escapeHtml = (str = '') => {
  const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' };
  return String(str).replace(/[&<>"]/g, c => map[c] || c);
};

const extractAnswer = (data) => {
  if (!data) return '';
  if (typeof data === 'string') return data;
  
  const stringFields = ['answer', 'text', 'message', 'output', 'content'];
  for (const field of stringFields) {
    if (typeof data[field] === 'string') return data[field];
  }
  
  if (Array.isArray(data)) {
    for (const item of data) {
      const result = extractAnswer(item);
      if (result) return result;
    }
  }
  
  if (Array.isArray(data?.candidates)) {
    try {
      const text = data.candidates[0]?.content?.parts?.[0]?.text;
      if (typeof text === 'string') return text;
    } catch {}
  }
  
  const stringValues = Object.values(data).filter(v => typeof v === 'string' && v.trim());
  if (stringValues.length) return String(stringValues[0]);
  
  try {
    const json = JSON.stringify(data);
    return json.length > 1000 ? json.slice(0, 1000) : json;
  } catch {
    return '';
  }
};

const linkifyLocations = (text = '') => {
  const pattern = /(?:(\d+)[.)]\s+)?([^\[\n]+?)\s*\[([0-9a-fA-F]{24})\]/g;
  let result = '';
  let lastIndex = 0;
  let match;
  
  while ((match = pattern.exec(text)) !== null) {
    result += escapeHtml(text.slice(lastIndex, match.index));
    const num = match[1] || '';
    const name = match[2].trim();
    const id = match[3];
    const prefix = num ? `${num}. ` : '';
    result += `${prefix}<a href="/locations/${id}" class="chat-location-link">${escapeHtml(name)}</a>`;
    lastIndex = pattern.lastIndex;
  }
  
  result += escapeHtml(text.slice(lastIndex));
  return result.replace(/\r?\n/g, '<br>');
};

router.post('/chatbot/query', async (req, res) => {
  try {
    const question = String(req.body?.question || req.body?.keyword || '').trim();
    const mode = String(req.body?.mode || 'faq').trim();
    const context = String(req.body?.context || '').trim();
    
    if (!question) {
      return res.status(400).json({ success: false, error: 'question is required' });
    }
    
    const webhookUrl = process.env.N8N_WEBHOOK_URL || 'http://localhost:5678/webhook/chatbot';
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question, mode, context })
    });
    
    if (!response.ok) {
      console.error(`[ChatbotError] upstream HTTP ${response.status}`);
      return res.status(response.status).json({ success: false, error: 'upstream error' });
    }
    
    const contentType = response.headers.get('content-type') || '';
    const isJson = contentType.includes('application/json');
    const answer = isJson ? extractAnswer(await response.json()) : await response.text();
    const answerHtml = linkifyLocations(answer || '');
    
    return res.status(200).json({ success: true, answer: answer || '', answer_html: answerHtml });
  } catch (error) {
    console.error('[ChatbotError] route:', error.message);
    return res.status(500).json({ success: false, error: 'server error' });
  }
});

module.exports = router;
