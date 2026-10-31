# Open Source Buddy

Read in English: [README.md](README.md)

Open Source Buddy एक AI-सहायता वाला वेब ऐप है, जो शुरुआती लोगों को अपना पहला open source योगदान **खोजने, समझने और शुरू करने** में मदद करता है।

- Issues खोजें और उन्हें भाषा तथा विषय के आधार पर फ़िल्टर करें।
- समय लगाने से पहले repository की स्थिति देखें—आखिरी merged PR, maintainer का जवाब देने का समय और `CONTRIBUTING.md` जैसी जानकारी।
- **Explain this issue** चुनकर issue का सरल सारांश, संभावित फ़ाइलें और शुरुआत करने की योजना पाएँ।
- Issues को बाद के लिए सेव करें और light तथा dark theme के बीच बदलें।

यह repository **Hacktoberfest Hack Day at NIT Jamshedpur** के लिए शुरुआती project है। भाग लेने के लिए [CONTRIBUTING.md](CONTRIBUTING.md) देखें।

## ऐप चलाएँ

आपको **Node.js 20 या उससे नया संस्करण** चाहिए। यह Windows, macOS और Linux पर काम करता है। डिफ़ॉल्ट रूप से database या API keys की ज़रूरत नहीं है।

```bash
git clone <your-fork-url>
cd open-source-buddy
npm install
npm run dev
```

इसके बाद http://localhost:5173 खोलें। `npm run dev` Express API (port 3001) और Vite client (port 5173), दोनों को एक साथ शुरू करता है।

## Mock mode और live mode

| | Mock (डिफ़ॉल्ट) | Live |
|---|---|---|
| GitHub data | `server/github/mockData/` में स्थानीय sample JSON | असली GitHub REST API |
| Internet की ज़रूरत | नहीं | हाँ |
| UI संकेत | पीला **Sample data** banner | कोई banner नहीं |

Mode बदलने के लिए `.env.example` की project root में `.env` कॉपी करें और उसे संपादित करें:

```bash
cp .env.example .env      # Windows पर: copy .env.example .env
```

- `GITHUB_MODE=live` असली GitHub API का उपयोग करता है। यह token के बिना भी चलता है (60 requests/hour)। अधिक requests के लिए `GITHUB_TOKEN` जोड़ें।
- `AI_PROVIDER=mock` ही अभी लागू किया गया AI provider है। यह issue के title, labels और body से explanation बनाता है।
- API keys और tokens केवल server की `.env` फ़ाइल में रखें। वे browser को नहीं भेजे जाते। `.env` को commit न करें।

## Project की संरचना

```text
open-source-buddy/
├── client/                  React + Vite frontend
│   └── src/
│       ├── App.jsx          पेज का layout और साझा state
│       ├── api.js           backend को की जाने वाली सभी calls
│       ├── components/      cards, filters, detail panel, sidebar आदि
│       ├── hooks/           data और theme hooks
│       ├── styles/          CSS फ़ाइलें
│       └── utils/           छोटे helper functions
├── server/                  Node.js + Express backend
│   ├── index.js             app का entry point
│   ├── config.js            `.env` से configuration पढ़ता है
│   ├── routes/              /api/issues, /api/repos, /api/explain, /api/saved
│   ├── ai/                  AI provider interface और mock (Gemini, Groq, Ollama अभी stubs हैं)
│   ├── github/              GitHub provider interface, mock और live providers
│   ├── lib/                 filtering, pagination, health score और saved-issue storage
│   ├── auth/                मौजूदा user की जानकारी
│   ├── middleware/          Express middleware
│   └── data/saved.json     सेव किए गए issues (अपने-आप बनती है और git-ignored है)
├── .github/                 pull request template
├── CONTRIBUTING.md
└── .env.example
```

## API

| Method | Path | विवरण |
|---|---|---|
| GET | `/api/issues` | Issues की सूची। Query parameters: `q`, `language`, `topic`, `sort`, `page` |
| GET | `/api/repos/:owner/:name/health` | Repository की health metrics और score |
| POST | `/api/explain` | Body `{ "issue": {...} }`; AI explanation लौटाता है |
| GET / POST / DELETE | `/api/saved` | सेव किए गए issues की सूची, जोड़ना (`POST`) या हटाना (`DELETE /api/saved/:id`) |

## योगदान कैसे करें

1. GitHub पर इस repository को **Fork** करें।
2. अपने fork को **Clone** करें और ऊपर दिए गए निर्देशों से ऐप चलाएँ।
3. Issues tab से एक issue चुनें। उसे claim करने की ज़रूरत नहीं है—एक ही issue पर कई teams काम कर सकती हैं।
4. एक branch बनाएँ: `git checkout -b fix/short-description`
5. चुने गए issue को हल करने वाला छोटा और केंद्रित बदलाव करें।
6. अपने fork पर commit और push करें।
7. इस repository के लिए Pull Request खोलें और विवरण में `Closes #N` लिखें, जहाँ `N` issue number है।

Hack Day के दौरान Pull Requests **merge नहीं किए जाएँगे**। Judges हर PR को अलग से पढ़ेंगे और score देंगे, इसलिए हर PR अपने-आप में काम करना चाहिए और किसी दूसरे PR पर निर्भर नहीं होना चाहिए।

हर issue पर एक tag होता है: `documentation` (1 point, 1 घंटे से कम), `beginner` (10 points, 1 घंटे से कम) या `hard` (20 points, 3 से 5 घंटे)। एक PR में एक ही issue के बदलाव रखें, केवल ज़रूरी फ़ाइलें बदलें, `.env`, `node_modules` या secrets commit न करें, और PR खोलने से पहले `npm run dev` चलाकर browser में बदलाव जाँचें। विनम्र रहें और सवाल issue thread में पूछें। अधिक जानकारी के लिए [CONTRIBUTING.md](CONTRIBUTING.md) देखें।

## License

[MIT](LICENSE)
