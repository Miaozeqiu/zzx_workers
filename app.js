import { createClient } from '@supabase/supabase-js';
import http from 'http';

const port = 3000;

const SUPABASE_URL = '';
const SUPABASE_KEY = '';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

http.createServer(async (req, res) => {
  const { searchParams } = new URL(req.url, `http://localhost:${port}`);
  const search_term = searchParams.get('search') || '';
  const limit = 5;
  let page = parseInt(searchParams.get('page') || '1', 10);
  const loadedPids = new Set((searchParams.get('loadedPids') || '').split(',').filter(x => x));

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

    // 设置响应
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(response));
  } catch (error) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Error fetching questions' }));
  }
}).listen(port, () => {
  console.log(`Server running at http://localhost:${port}/`);
});
