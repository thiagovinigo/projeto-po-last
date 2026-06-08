const express = require('express');
const cors = require('cors');
const Groq = require('groq-sdk');

const app = express();
const PORT = process.env.PORT || 3001;

const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || 'http://localhost:4200')
  .split(',')
  .map(o => o.trim());

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
    callback(new Error('Not allowed by CORS'));
  },
  methods: ['POST', 'GET', 'OPTIONS'],
  allowedHeaders: ['Content-Type']
}));
app.use(express.json({ limit: '2mb' }));

// Lazy init — Railway injects GROQ_API_KEY at runtime
let groq;
function getGroq() {
  if (!groq) {
    if (!process.env.GROQ_API_KEY) throw new Error('GROQ_API_KEY not set');
    groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  }
  return groq;
}

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'po-agent-api' });
});

// Groq chat completions proxy
app.post('/api/groq/chat', async (req, res) => {
  const { model, messages, response_format, temperature, max_tokens } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'messages array required' });
  }

  try {
    const completion = await getGroq().chat.completions.create({
      model: model || 'llama-3.3-70b-versatile',
      messages,
      ...(response_format ? { response_format } : {}),
      ...(temperature != null ? { temperature } : {}),
      ...(max_tokens != null ? { max_tokens } : {})
    });
    res.json(completion);
  } catch (err) {
    console.error('[Groq proxy error]', err?.message);
    const status = err?.status || 500;
    res.status(status).json({ error: err?.message || 'Groq request failed' });
  }
});

app.listen(PORT, () => {
  console.log(`PO Agent API running on port ${PORT}`);
});
