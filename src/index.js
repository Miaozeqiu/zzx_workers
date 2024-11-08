import { createClient } from '@supabase/supabase-js';

export default {
  async fetch(request, env) {
    const { searchParams } = new URL(request.url);
    const search_term = searchParams.get('search') || '';
    const limit = 5;
    let page = parseInt(searchParams.get('page') || '1', 10);
    const loadedPids = new Set((searchParams.get('loadedPids') || '').split(',').filter(x => x));

    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

    // 存储最终要返回的结果
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

      // 返回响应
      return new Response(JSON.stringify(response), {
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: 'Error fetching questions' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }
};