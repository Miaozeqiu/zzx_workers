import { createClient } from '@supabase/supabase-js';

// 将 Supabase URL 和密钥存储在环境变量中
const SUPABASE_URL = 'https://urpwmepjyjntedvjgccc.supabase.co';
const SUPABASE_KEY = SUPABASE_KEY; // 从环境变量中获取

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function handleRequest(request) {
  const url = new URL(request.url);
  const search_term = url.searchParams.get('search') || '';
  const limit = 5;
  let page = parseInt(url.searchParams.get('page') || '1', 10);
  const loadedPids = new Set((url.searchParams.get('loadedPids') || '').split(',').filter(x => x));

  let finalQuestions = [];

  try {
    while (finalQuestions.length < limit) {
      const offset = (page - 1) * limit;

      // 构建查询
      let query = supabase.from('questions').select('*');

      // 应用搜索过滤器
      if (search_term) {
        query = query.ilike('question_text', `%${search_term}%`);
      }

      // 执行查询
      const { data: questions, error } = await query.range(offset, offset + limit - 1);
      if (error) throw error;

      // 过滤已加载的 PIDs
      const filteredQuestions = questions.filter(q => !loadedPids.has(q.pid));
      filteredQuestions.forEach(q => loadedPids.add(q.pid));

      // 合并结果
      finalQuestions = finalQuestions.concat(filteredQuestions);
      
      // 检查是否需要退出循环
      if (questions.length === 0) break;
      
      // 页数递增
      page++;
    }

    // 响应构造
    const response = {
      page,
      questions: finalQuestions.slice(0, limit).map(q => ({
        pid: q.pid,
        question_text: q.question_text,
        id: q.id
      }))
    };

    return new Response(JSON.stringify(response), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Error fetching questions' }), {
      status: 500,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
}

addEventListener('fetch', event => {
  if (event.request.method === 'OPTIONS') {
    // 处理 CORS 预检请求
    event.respondWith(
      new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      })
    );
  } else {
    event.respondWith(handleRequest(event.request));
  }
});

