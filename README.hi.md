# Open Source Buddy (ओपन सोर्स बडी)

एक AI-सहायक वेब ऐप जो शुरुआती डेवलपर्स को अपने पहले ओपन सोर्स योगदान को **खोजने, समझने और शुरू करने** में मदद करता है।

- प्रोग्रामिंग भाषा और विषय के आधार पर समस्याओं (Issues) को खोजें और फ़िल्टर करें।
- किसी प्रोजेक्ट में समय लगाने से पहले उसकी स्थिति (Health Score) देखें (हालिया PR, मेंटेनर प्रतिक्रिया समय, CONTRIBUTING.md)।
- **Explain this issue** बटन दबाकर आसान सारांश, संबंधित फाइलें और चरण-दर-चरण योजना प्राप्त करें।
- पसंदीदा समस्याओं को बाद के लिए सेव करें, और लाइट/डार्क थीम में काम करें।

यह रिपॉजिटरी **Hacktoberfest Hack Day at NIT Jamshedpur** का शुरुआती प्रोजेक्ट है। भाग लेने के लिए [CONTRIBUTING.md](CONTRIBUTING.md) देखें।

---

## इसे चलाएं (Run it)

इसके लिए **Node.js 20 या नया** आवश्यक है (यह Windows, macOS और Linux पर काम करता है)। किसी डेटाबेस या API की आवश्यकता नहीं है।

```bash
git clone <your-fork-url>
cd open-source-buddy
npm install
npm run dev
```

इसके बाद ब्राउज़र में `http://localhost:5173` खोलें। `npm run dev` कमांड Express API (port 3001) और Vite client (port 5173) दोनों को एक साथ शुरू करती है।

---

## मॉक मोड बनाम लाइव मोड (Mock mode vs live mode)

| मोड | विवरण | आवश्यकता |
|---|---|---|
| **Mock (डिफ़ॉल्ट)** | ऑफ़लाइन काम करता है, तेज़ है, स्थिर डेटा का उपयोग करता है | किसी कुंजी की आवश्यकता नहीं |
| **Live** | असली GitHub API और असली AI मॉडल का उपयोग करता है | `GITHUB_TOKEN` और `GEMINI_API_KEY` |

लाईव मोड सक्षम करने के लिए:
```bash
cp .env.example .env
```
और `.env` फाइल में अपनी कुंजियाँ सेट करें:
```env
GITHUB_MODE=live
GITHUB_TOKEN=ghp_your_token_here
AI_PROVIDER=gemini
GEMINI_API_KEY=your_gemini_key_here
```

---

## प्रोजेक्ट संरचना (Project structure)

```
open-source-buddy/
├── client/              # React + Vite फ्रंटएंड
│   ├── src/
│   │   ├── components/  # UI कंपोनेंट्स (SearchBar, IssueCard, ExplainPanel)
│   │   ├── hooks/       # React हुक्स (useIssues, useExplain)
│   │   └── utils/       # फॉर्मेटिंग और हेल्पर फंक्शन्स
├── server/              # Express API बैकएंड
│   ├── ai/              # AI प्रोवाइडर्स (mock, gemini, ollama, groq)
│   ├── github/          # GitHub प्रोवाइडर्स (mock, live)
│   ├── lib/             # हेल्थ स्कोर, पेजिनेशन और फ़िल्टरिंग
│   └── routes/          # Express API रूट्स
└── docs/                # विस्तृत दस्तावेज़ और स्क्रीनशॉट
```

---

## योगदान कैसे करें (Contributing)

1. अपनी पसंदीदा समस्या (Issue) चुनें।
2. एक नई शाखा (Branch) बनाएं: `git checkout -b fix/issue-name`
3. कोड में सुधार करें और परीक्षण करें।
4. अपनी शाखा को पुश करें और Pull Request भेजें।

विस्तृत दिशानिर्देशों के लिए [CONTRIBUTING.md](CONTRIBUTING.md) और [ARCHITECTURE.md](ARCHITECTURE.md) देखें।
