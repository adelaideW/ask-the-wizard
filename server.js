require('dotenv').config();
const express = require('express');
const path = require('path');
const { ElevenLabsClient } = require('elevenlabs');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname)));

const eleven = new ElevenLabsClient({ apiKey: process.env.ELEVENLABS_API_KEY });
const googleApiKey = process.env.GOOGLE_API_KEY;
const genAI = googleApiKey ? new GoogleGenerativeAI(googleApiKey) : null;
const googleModel = process.env.GOOGLE_MODEL || 'gemini-2.5-flash-lite';

// Young British male (Dave) — closer to teen Harry than George
const harryVoiceId = process.env.HARRY_VOICE_ID || 'CYw3kZ02Hs0563khs1Fj';

// ── Preset Q&A — Harry meets a Muggle on King's Cross street ────────────────
const PRESETS = [
  {
    tags: ['robes', 'wearing robes', 'costume', 'dressed', 'what are you wearing', 'outfit', 'clothes'],
    answer: "Oh. Yeah. It's, uh… a fashion thing. Very in right now.",
    known: true,
  },
  {
    tags: ['stick', 'wand', 'holding', 'hand', 'carrying', 'what is that', 'what\'s that in your hand'],
    answer: "Wand. I mean — walking stick. Very old family heirloom. Don't touch it.",
    known: true,
  },
  {
    tags: ['know you', 'staring', 'everyone knows', 'famous', 'recognise', 'recognize', 'people keep looking'],
    answer: "Do they? I genuinely try to avoid that. Don't make eye contact, that's my advice.",
    known: true,
  },
  {
    tags: ['forehead', 'scar', 'lightning', 'mark', 'head', 'what\'s on your forehead'],
    answer: "Oh that. It's just a scar. Normal kid stuff, really. Okay, not entirely normal. But I'm fine.",
    known: true,
  },
  {
    tags: ['school', 'hogwarts', 'where do you go', 'what school', 'study', 'college', 'university'],
    answer: "Hogwarts. It's a boarding school up in Scotland. Very hard to find on a map, actually.",
    known: true,
  },
  {
    tags: ['study', 'subjects', 'classes', 'learn', 'curriculum', 'what do you learn', 'what do you study'],
    answer: "Potions. Transfiguration. Defence Against the — defence studies. Normal subjects, mostly.",
    known: true,
  },
  {
    tags: ['phone', 'mobile', 'smartphone', 'call', 'text', 'internet', 'wifi', 'laptop', 'computer'],
    answer: "A what? Oh — no. We use owls. They're slower but they've never dropped a call.",
    known: true,
  },
  {
    tags: ['owl', 'owls', 'post owl', 'bird', 'letter', 'mail'],
    answer: "Post owls. For letters. Quite reliable once they stop getting distracted by mice.",
    known: true,
  },
  {
    tags: ['fun', 'weekend', 'hobby', 'free time', 'spare time', 'do for fun', 'after school'],
    answer: "Quidditch, mostly. Flying, catching the Snitch — it's a sport. On broomsticks. In the air.",
    known: true,
  },
  {
    tags: ['quidditch', 'what is quidditch', 'snitch', 'bludger', 'sport'],
    answer: "Seven players, three types of balls, one of which actively tries to escape. Played on broomsticks. Best sport ever invented.",
    known: true,
  },
  {
    tags: ['broom', 'broomstick', 'fly', 'flying', 'broomsticks real', 'actually fly'],
    answer: "...I've said too much, haven't I. Yes. They fly. Please don't tell anyone.",
    known: true,
  },
  {
    tags: ['magic', 'spell', 'cast', 'do magic', 'show me', 'can you do magic', 'right now'],
    answer: "I probably shouldn't. Last time I did magic on a street a whole committee from the Ministry showed up.",
    known: true,
  },
  {
    tags: ['wizards', 'other wizards', 'around here', 'nearby', 'right now', 'any wizards'],
    answer: "Almost certainly. The woman with the purple hat who just walked past? Not a coincidence.",
    known: true,
  },
  {
    tags: ['dangerous', 'danger', 'risk', 'scary', 'most dangerous', 'worst thing', 'battle'],
    answer: "Faced Voldemort. Twice. Or the time I let Hermione plan our schedule — same energy, honestly.",
    known: true,
  },
  {
    tags: ['voldemort', 'you-know-who', 'dark lord', 'villain', 'evil', 'bad guy', 'who is voldemort'],
    answer: "Someone I'd rather not talk about on a street corner. His name still makes people flinch. Including me, a bit.",
    known: true,
  },
  {
    tags: ['worried', 'scared', 'afraid', 'should i worry', 'safe', 'danger', 'am i safe'],
    answer: "No, you're fine. Muggles mostly just carry on and it all works out. It's honestly impressive.",
    known: true,
  },
  {
    tags: ['hermione', 'ron', 'friend', 'best friend', 'who are your friends'],
    answer: "Hermione Granger and Ron Weasley. Hermione knows everything. Ron knows which chess pieces to sacrifice. Between the three of us we've survived a lot.",
    known: true,
  },
  {
    tags: ['dumbledore', 'headmaster', 'principal', 'teacher', 'professor'],
    answer: "Dumbledore's the headmaster. Brilliant wizard. Bit cryptic. Loves lemon drops. You'd like him.",
    known: true,
  },
  {
    tags: ['dragon', 'dragons', 'real', 'exist'],
    answer: "Absolutely real. I've met one. Wouldn't recommend it, but yes — very real, very large, very on fire.",
    known: true,
  },
  {
    tags: ['diagon alley', 'wizard shops', 'shopping', 'where do wizards shop', 'buy things'],
    answer: "Diagon Alley. It's just behind the Leaky Cauldron on Charing Cross Road. You'd walk past it every day and never see it.",
    known: true,
  },
  {
    tags: ['king\'s cross', 'platform', 'train', 'hogwarts express', 'how do you get to school', 'nine and three quarters'],
    answer: "Platform Nine and Three-Quarters. You run straight at the barrier between platforms nine and ten. It sounds mad but it works every time.",
    known: true,
  },
  {
    tags: ['money', 'galleon', 'wizard money', 'how do wizards pay', 'currency', 'gold'],
    answer: "Galleons, Sickles, and Knuts. Gold, silver, and bronze. Much more satisfying than a contactless card, to be honest.",
    known: true,
  },
  {
    tags: ['name', 'who are you', 'introduce', 'what\'s your name', 'your name'],
    answer: "Harry. Harry Potter. And before you say anything — yes, I know. The scar, the glasses. I've heard it.",
    known: true,
  },
  {
    tags: ['age', 'old', 'how old', 'years old', 'young'],
    answer: "Sixteen. Sixth year at Hogwarts. Feels older most days, to be honest.",
    known: true,
  },
];

// ── Fuzzy matcher ────────────────────────────────────────────────────────────
function norm(s) {
  return s.toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
}
function score(question, tags) {
  const q = norm(question);
  const qWords = new Set(q.split(' '));
  let best = 0;
  for (const tag of tags) {
    const t = norm(tag);
    const tWords = t.split(' ');
    const allPresent = tWords.every(w => qWords.has(w));
    if (allPresent && tWords.length > 1) return 1;
    if (tWords.length === 1 && qWords.has(tWords[0])) {
      const s = 1 / Math.max(qWords.size, 1);
      if (s > best) best = s + 0.3;
    }
    if (tWords.length > 1) {
      const overlap = tWords.filter(w => qWords.has(w)).length;
      const s = overlap / tWords.length;
      if (s > best) best = s;
    }
  }
  return best;
}

function findAnswer(question) {
  let bestScore = 0, bestPreset = null;
  for (const p of PRESETS) {
    const s = score(question, p.tags);
    if (s > bestScore) { bestScore = s; bestPreset = p; }
  }
  if (bestScore >= 0.35) return bestPreset;
  return null;
}

const SHRUGS = [
  "Blimey, you've stumped me. And I've faced a Dark Lord — that's saying something.",
  "I haven't the foggiest. Which is honestly a bit embarrassing.",
  "That one's beyond even me, I'm afraid. Try Hermione.",
  "No idea. And I'm usually at least a little idea.",
  "I don't know that one. Very muggle problem, I suspect.",
];
let shrugIdx = 0;

function sanitizeHistory(history) {
  if (!Array.isArray(history)) return [];
  return history
    .slice(-8)
    .map((item) => ({
      q: String(item?.q || '').trim().slice(0, 500),
      a: String(item?.a || '').trim().slice(0, 700),
    }))
    .filter((item) => item.q && item.a);
}

async function answerWithGemini({ question, history }) {
  if (!genAI) return null;
  const model = genAI.getGenerativeModel({ model: googleModel });

  const prior = sanitizeHistory(history)
    .map((item) => `Muggle: ${item.q}\nHarry: ${item.a}`)
    .join('\n\n');

  const prompt = [
    "You are Harry Potter in a rainy street encounter near King's Cross.",
    'Answer in character: warm, witty, slightly awkward, secrecy-aware.',
    'Keep it concise: 1-3 sentences.',
    'Stay PG-safe. If unsure, improvise naturally in-character instead of refusing.',
    prior ? `Conversation so far:\n${prior}` : '',
    `Latest question from the Muggle:\n${question}`,
    'Harry response:',
  ]
    .filter(Boolean)
    .join('\n\n');

  const result = await model.generateContent({
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.75,
      maxOutputTokens: 1024,
    },
  });

  const answer = result?.response?.text?.().trim();
  return answer || null;
}

// ── POST /api/ask ────────────────────────────────────────────────────────────
app.post('/api/ask', async (req, res) => {
  const { question, history } = req.body;
  if (!question?.trim()) return res.status(400).json({ error: 'No question' });

  try {
    const aiAnswer = await answerWithGemini({ question, history });
    if (aiAnswer) {
      return res.json({ known: true, answer: aiAnswer });
    }
  } catch (e) {
    console.error('AI answer error:', e.message);
  }

  const match = findAnswer(question);
  if (match) {
    return res.json({ known: match.known, answer: match.answer });
  }

  const shrug = SHRUGS[shrugIdx % SHRUGS.length];
  shrugIdx++;
  res.json({ known: false, answer: shrug });
});

// ── GET /api/voice-status ────────────────────────────────────────────────────
app.get('/api/voice-status', (_req, res) => {
  res.json({ ready: !!process.env.ELEVENLABS_API_KEY });
});

// ── POST /api/speak — ElevenLabs TTS ────────────────────────────────────────
async function streamToBuffer(stream) {
  const chunks = [];
  for await (const chunk of stream) chunks.push(Buffer.from(chunk));
  return Buffer.concat(chunks);
}

app.post('/api/speak', async (req, res) => {
  const { text } = req.body;
  if (!text?.trim()) return res.status(400).json({ error: 'No text' });
  if (!process.env.ELEVENLABS_API_KEY) {
    return res.status(503).json({ error: 'TTS unavailable' });
  }

  try {
    const stream = await eleven.textToSpeech.convert(harryVoiceId, {
      text,
      model_id: 'eleven_multilingual_v2',
      output_format: 'mp3_44100_128',
      voice_settings: { stability: 0.52, similarity_boost: 0.82, style: 0.32, use_speaker_boost: true },
    });
    const buffer = await streamToBuffer(stream);
    if (!buffer.length) {
      console.error('TTS error: empty audio buffer', 'voice:', harryVoiceId);
      return res.status(500).json({ error: 'Empty audio stream' });
    }
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Content-Length', buffer.length);
    res.send(buffer);
  } catch (e) {
    const status = e?.statusCode === 401 ? 401 : 500;
    console.error('TTS error:', e.message, 'voice:', harryVoiceId, 'status:', status);
    res.status(status).json({ error: e.message || 'TTS failed' });
  }
});

// ── Start (local dev only) ───────────────────────────────────────────────────
if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Ask the Wizard running at http://localhost:${PORT}`);
  });
}

module.exports = app;
