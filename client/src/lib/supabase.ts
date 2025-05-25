import { createClient } from '@supabase/supabase-js';

// 从环境变量中获取 Supabase URL 和匿名密钥
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// 创建 Supabase 客户端
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// 检查 Supabase 连接
export async function checkSupabaseConnection() {
  try {
    const { data, error } = await supabase.from('users').select('count').limit(1);
    if (error) {
      console.error('Supabase 连接错误:', error);
      return false;
    }
    console.log('Supabase 连接成功');
    return true;
  } catch (error) {
    console.error('检查 Supabase 连接时出错:', error);
    return false;
  }
}

// 辅助函数：处理 Supabase 错误
export function handleSupabaseError(error: any) {
  console.error('Supabase 操作错误:', error);
  return {
    message: error.message || '操作失败',
    details: error.details || error.hint || '未知错误'
  };
}