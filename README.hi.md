# Open Source Buddy

[English](README.md) | [हिन्दी](README.hi.md)

एक AI-सहायता प्राप्त (AI-assisted) वेब ऐप जो शुरुआती डेवलपर्स (beginners) को अपने पहले ओपन सोर्स योगदान को **खोजने (find), समझने (understand) और शुरू करने (start)** में मदद करता है।

- इश्यूज़ (issues) ब्राउज़ और सर्च करें, भाषा (language) और विषय (topic) के अनुसार फ़िल्टर करें
- किसी रेपो पर अपना सप्ताहांत (weekend) लगाने से पहले उसकी स्थिति (health) की जाँच करें (हाल ही में मर्ज की गई PR, मेंटेनर का प्रतिक्रिया समय (response time), CONTRIBUTING.md)
- एक सरल सारांश (plain-English summary), संबंधित संभावित फ़ाइलें और शुरुआत करने की योजना पाने के लिए **Explain this issue** पर क्लिक करें
- बाद के लिए इश्यूज़ को सहेजें (save करें), लाइट और डार्क थीम के बीच स्विच करें

यह रिपॉजिटरी **NIT Jamshedpur में Hacktoberfest Hack Day** के लिए स्टार्टर प्रोजेक्ट (starter project) है। भाग लेने के लिए [CONTRIBUTING.md](CONTRIBUTING.md) देखें।

## इसे कैसे चलाएं (Run it / Setup Instructions)

आपको **Node.js 20 या उससे नए संस्करण (newer)** की आवश्यकता है (यह Windows, macOS और Linux पर काम करता है)। इसके लिए किसी डेटाबेस या API keys की आवश्यकता नहीं है।

```bash
git clone <your-fork-url>
cd open-source-buddy
npm install
npm run dev
```

इसके बाद http://localhost:5173 खोलें। `npm run dev` कमांड Express API (port 3001) और Vite client (port 5173) दोनों को एक साथ शुरू करती है।

## मॉक मोड बनाम लाइव मोड (Mock mode vs live mode)

| | मॉक (डिफ़ॉल्ट / Mock) | लाइव (Live) |
|---|---|---|
| GitHub डेटा | `server/github/mockData/` में स्थानीय सैंपल JSON | वास्तविक GitHub REST API |
| इंटरनेट की आवश्यकता | नहीं | हाँ |
| UI संकेत (UI hint) | पीला **Sample data** बैनर | कोई बैनर नहीं |

मोड बदलने के लिए, `.env.example` को `.env` में कॉपी करें और उसमें बदलाव करें:

```bash
cp .env.example .env      # on Windows: copy .env.example .env
```

- `GITHUB_MODE=live` वास्तविक GitHub API का उपयोग करता है। यह बिना टोकन के भी काम करता है (60 requests/hour)। उच्च सीमा (rate limit) के लिए `GITHUB_TOKEN` जोड़ें।
- `AI_PROVIDER=mock` एकमात्र लागू (implemented) AI प्रोवाइडर है। यह इश्यू के शीर्षक (title), लेबल्स (labels) और बॉडी (body) से विवरण (explanation) तैयार करता है।

कुंजियाँ (keys) और टोकन केवल सर्वर की `.env` फ़ाइल में रहते हैं। वे कभी भी ब्राउज़र में नहीं भेजे जाते हैं।

## प्रोजेक्ट संरचना (Project structure)

```
open-source-buddy/
├── client/                  React + Vite frontend
│   └── src/
│       ├── App.jsx          page layout and shared state
│       ├── api.js           all calls to the backend
│       ├── components/      cards, filters, detail panel, sidebar ...
│       ├── hooks/           data and theme hooks
│       ├── styles/          CSS files
│       └── utils/           small helpers
├── server/                  Node.js + Express backend
│   ├── index.js             app entry point
│   ├── config.js            reads .env
│   ├── routes/              /api/issues, /api/repos, /api/explain, /api/saved
│   ├── ai/                  AI provider interface + mock (Gemini, Groq, Ollama are stubs)
│   ├── github/              GitHub provider interface + mock + live
│   ├── lib/                 filtering, pagination, health score, saved-issue storage
│   ├── auth/                who is the current user
│   ├── middleware/          Express middleware
│   └── data/saved.json     saved issues (created automatically, git-ignored)
├── .github/                 pull request template
├── CONTRIBUTING.md
└── .env.example
```

- **`client/`**: React और Vite पर आधारित फ़्रंटएंड कोडबेस, जिसमें UI कंपोनेंट्स, पेज लेआउट, कस्टम हुक्स और बैकएंड के लिए API कॉल्स शामिल हैं।
- **`server/`**: Node.js और Express पर आधारित बैकएंड सर्वर, जो GitHub डेटा, AI सर्विस और सहेजे गए इश्यूज़ (saved issues) के लिए API रूट्स प्रदान करता है।

## API

| Method | Path | Description (विवरण) |
|---|---|---|
| GET | `/api/issues` | इश्यूज़ की सूची प्राप्त करें (List issues)। Query: `q`, `language`, `topic`, `sort`, `page` |
| GET | `/api/repos/:owner/:name/health` | रिपॉजिटरी के हेल्थ मेट्रिक्स और स्कोर प्राप्त करें (Repo health metrics and score) |
| POST | `/api/explain` | Body `{ "issue": {...} }`, AI द्वारा तैयार स्पष्टीकरण (explanation) लौटाता है |
| GET / POST / DELETE | `/api/saved` | सहेजे गए इश्यूज़ की सूची देखें, नया जोड़ें (`POST`) या हटाएं (`DELETE /api/saved/:id`) |

## योगदान दिशानिर्देश (Contributing)

योगदान का स्वागत है! यदि आप इस प्रोजेक्ट में भाग लेना चाहते हैं, तो कृपया विस्तृत दिशानिर्देशों के लिए [CONTRIBUTING.md](CONTRIBUTING.md) देखें।

योगदान करने की मुख्य प्रक्रिया:
1. **Fork करें**: रिपॉजिटरी को अपने GitHub अकाउंट पर फ़ॉर्क करें।
2. **Clone और Setup करें**: अपने फ़ॉर्क को क्लोन करें और `npm install` चलाएं।
3. **Issue चुनें**: Issues टैब से कोई एक इश्यू चुनें।
4. **Branch बनाएं**: नए बदलावों के लिए एक नई ब्रांच बनाएं (`git checkout -b fix/short-description`)।
5. **बदलाव करें और टेस्ट करें**: समस्या का समाधान करें और `npm run dev` चलाकर ब्राउज़र में टेस्ट करें।
6. **PR सबमिट करें**: अपने बदलावों को पुश करें और Pull Request खोलें। विवरण में `Closes #N` लिखें (जहाँ `N` इश्यू नंबर है)।

नियम (Rules):
- प्रति PR केवल एक ही समस्या (issue) पर ध्यान केंद्रित करें।
- केवल उन्हीं फ़ाइलों में बदलाव करें जो उस इश्यू से संबंधित हों।
- `.env`, `node_modules` या किसी भी सीक्रेट्स/क्रेडेंशियल्स को कमिट न करें।
- PR खोलने से पहले `npm run dev` चलाकर ब्राउज़र में जांच अवश्य करें।

## लाइसेंस (License)

[MIT](LICENSE)

