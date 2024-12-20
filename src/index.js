import { createClient } from '@supabase/supabase-js';

// 将 Supabase URL 和密钥存储在环境变量中
const SUPABASE_URL = 'https://urpwmepjyjntedvjgccc.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVycHdtZXBqeWpudGVkdmpnY2NjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzEwMDEwOTUsImV4cCI6MjA0NjU3NzA5NX0.qVFRSkBHtbfBUCeC8ZO25mU_mmCAIcG_QgZDT4ajWgg'; // 从环境变量中获取

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

      for (let q of questions) {
        if (!loadedPids.has(q.pid)) {
          // 获取与问题相关的选项
          const { data: options, error: optionsError } = await supabase
            .from('options')
            .select('*')
            .eq('question_id', q.id); // 确保您正在使用正确的外键关联

          if (optionsError) throw optionsError;
          
          finalQuestions.push({
            chapter_name : q.chapter_name,
            course_id : q.course_id,
            course_name : q.course_name,
            paper_name : q.paper_name,
            question_type : q.question_type,      
            pid: q.pid,
            question_text: q.question_text,
            id: q.id,
            options: options || [] // 如果没有选项，默认为空数组
          });
          loadedPids.add(q.pid);
        }
      }

      // 检查是否需要退出循环
      if (questions.length === 0) break;

      // 页数递增
      page++;
    }

    // 响应构造
    const response = {
      page,
      questions: finalQuestions.slice(0, limit)
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
    return new Response(JSON.stringify({ error: 'Error fetching questions and options' }), {
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

