export const environment = {
  production: true,
  apiKey: '__OPENAI_API_KEY__',     // Vercel injeta via env var OPENAI_API_KEY no build
  baseUrl: '',                      // vazio = usa OpenAI padrão em produção
  supabaseUrl: 'https://imsncpmhtduknumrflod.supabase.co',
  supabaseAnonKey: 'sb_publishable_EblkhnO-cywfXnBxQW0Qgg_ntrmDyRX',
};
