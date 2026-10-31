/* Jason’s Wish — Composition 1
   Answer keys live in step.answer / item.answer / sample / model.
   The game hides 範例／教師用 until the student submits, or teacher mode is on.
   Source of truth: P6-Peter-Jason-Wish content spec. Do not invent extra curriculum. */
(function () {
  const APOSTROPHE = "\u2019";
  const oclock = `o${APOSTROPHE}clock`;
  const eight = `eight ${oclock}`;

  const pictures = [
    { id: "A", icon: "classroom", label: "classroom" },
    { id: "B", icon: "daydreaming", label: "daydreaming" },
    { id: "C", icon: "examination", label: "examination" },
    { id: "D", icon: "report card", label: "report card" },
    { id: "E", icon: "thumbs-up", label: "thumbs-up" },
    { id: "F", icon: "mobile phone", label: "mobile phone" },
    { id: "G", icon: "proud", label: "proud" },
    { id: "H", icon: oclock, label: oclock },
  ];

  const modelEssay = [
    "In the morning, Jason and his classmates had a Maths lesson in the classroom. A girl was daydreaming while some classmates were talking. Mr Ho was teaching Maths while Jason was answering questions. Jason was patient and smart.",
    "At night, Jason studied hard for the examination because the examination would be held the next day. He studied hard until eight o\u2019clock. He was tired and went to sleep.",
    "After a week, Jason brought home his report card and showed it to Dad. Every subject was an A! Dad gave him a thumbs-up and said, \u201cWell done, Jason. I\u2019m so proud of you.\u201d Jason smiled and said, \u201cDad, I want a mobile phone because I want to play games on it.\u201d Dad thought for a moment and then bought him one. Jason played happily and said, \u201cThank you, Dad! This is the best present ever!\u201d He felt proud of his hard work.",
  ].join("\n\n");

  const dialogueModel = "Dad: \u201cWell done, Jason. I\u2019m so proud of you.\u201d\nJason: \u201cDad, I want a mobile phone because I want to play games on it.\u201d";

  function wordCount(text) {
    const trimmed = String(text || "").trim();
    if (!trimmed) return 0;
    return trimmed.split(/\s+/).length;
  }

  function normalizeAnswer(value) {
    return String(value || "")
      .replace(/[\u2018\u2019\u02BC]/g, "'")
      .replace(/[\u201C\u201D]/g, '"')
      .replace(/\s+/g, " ")
      .trim()
      .replace(/\s+([?.!,])/g, "$1")
      .replace(/[.。!！]+$/g, "")
      .toLowerCase();
  }

  function answersMatch(input, expected) {
    return normalizeAnswer(input) === normalizeAnswer(expected);
  }

  function guidedOk(id, text) {
    const raw = String(text || "");
    const rules = {
      A: /report card|thumbs-up|thumbs up|every subject|proud/i,
      B: /well done|proud of you|so proud/i,
      C: /\ba mobile phone\b/i,
      D: /bought|gave|thought for a moment|decided/i,
      E: /thank you|felt proud|played happily|best present/i,
    };
    return !/[\u4e00-\u9fff]/.test(raw) && !!(rules[id] && rules[id].test(raw));
  }

  function dialogueOk(text) {
    const raw = String(text || "");
    return {
      praise: /well done|proud of you|so proud/i.test(raw),
      phone: /\ba mobile phone\b/i.test(raw),
      reason: /because|play games/i.test(raw),
    };
  }

  function compositionChecks(text) {
    const raw = String(text || "");
    const n = normalizeAnswer(raw);
    const words = wordCount(raw);
    const rest = n.replace(/eight o'clock/g, "");
    const otherClock = /\b(one|two|three|four|five|six|seven|nine|ten|eleven|twelve|\d{1,2}) o'clock\b/.test(rest)
      || /\b\d{1,2}:\d{2}\b/.test(rest)
      || /\b\d{1,2}'clock\b/.test(n);
    const goodSpell = /\bexamination\b/.test(n) || /\bo'clock\b/.test(n) || /\banswered\b/.test(n) || /\bsaid\b/.test(n);
    const badSpell = /examintion|examanation|examinashun|\boclock\b|o-clock|\d\s*'clock/.test(n);
    const past = /\b(was|were|studied|brought|showed|said|wanted|bought|felt|went|gave|smiled|played|thought|asked)\b/.test(n);
    const phone = /\ba mobile phone\b/.test(n);
    const quotes = /["“”]/.test(raw);
    const pic = /report card/.test(n) && phone && /thank you/.test(n);
    return [
      { ok: past, label: "Past tense for the story" },
      { ok: phone, label: "a mobile phone" },
      { ok: goodSpell && !badSpell, label: `Spelling: examination · ${oclock} · answered/said` },
      { ok: !otherClock, label: "One clock time only" },
      { ok: pic, label: "Pic 3–5 all written" },
      { ok: quotes, label: "Dialogue has quotation marks" },
      { ok: words >= 45 && words <= 220, label: "About 150 words — ready to copy to Page 6", detail: String(words) },
    ];
  }

  const content = {
    title: "Peter · Jason\u2019s Wish",
    subtitle: "Composition practice · mobile phone ending",
    motto: "Study hard. Ask politely. Say thank you!",
    hub: "五關：圖中詞彙、過去式／冠詞／while·because、五圖排序、父子對話、結局寫作自查",
    version: "v1",
    storageKey: "p6-peter-composition01-v1",
    icons: {
      classroom: "🏫",
      daydreaming: "💭",
      examination: "📝",
      "report card": "💯",
      "thumbs-up": "👍",
      "mobile phone": "📱",
      proud: "🌟",
      [oclock]: "🕗",
      patient: "😌",
      reward: "🎁",
    },
    gloss: {
      classroom: "課室",
      daydreaming: "發白日夢",
      "answering questions": "回答問題",
      patient: "有耐心的",
      examination: "考試",
      [oclock]: "……點鐘",
      "report card": "成績表",
      "thumbs-up": "豎起拇指（稱讚）",
      proud: "感到驕傲",
      "mobile phone": "手提電話／手機",
      reward: "獎勵",
      wish: "願望",
      "played happily": "開心地玩",
      "hard work": "努力",
      while: "當……的時候（兩事同時）",
      because: "因為",
      "a / an": "冠詞（a mobile phone）",
    },
    modules: [
      {
        id: "vocab",
        zh: "詞彙",
        en: "Vocabulary",
        blurb: "圖中關鍵詞：課室、考試、成績表、手機",
        help: "題目用中文。答案是英文。留意拼寫：examination、o\u2019clock。",
        hue: "#0b5cab",
        steps: [
          {
            kind: "teach",
            title: "Jason\u2019s Wish 關鍵詞",
            body: "點卡片聽讀音。寫作文時這些詞會用到。特別留意 **examination** 和 **o\u2019clock** 的拼寫。",
            example: "Jason studied hard for the examination until eight o\u2019clock.",
            glossLine: "Jason 為考試努力溫習，直到八點鐘。",
            cards: [
              "classroom",
              "daydreaming",
              "examination",
              "report card",
              "thumbs-up",
              "mobile phone",
              "proud",
              oclock,
              "patient",
              "reward",
            ],
          },
          {
            kind: "mcq",
            q: "「考試」正確拼法是？",
            options: ["examination", "examintion", "examanation", "examinashun"],
            answer: "examination",
            why: "Peter 稿寫成 examintion — 少了 a。",
          },
          {
            kind: "mcq",
            q: "八點鐘的正確寫法是？",
            options: [`eight ${oclock}`, "8'clock", "eight oclock", "8 o-clock"],
            answer: `eight ${oclock}`,
            why: "撇號在 o 後面：o\u2019clock。",
          },
          {
            kind: "mcq",
            q: "Dad ______ , \u201cWell done.\u201d（拼寫）",
            options: ["answered", "anwered", "ansered", "answred"],
            answer: "answered",
            why: "answered 要寫全，不要漏字母。",
          },
          {
            kind: "iconHunt",
            title: "點選圖片",
            pool: pictures.map((pic) => pic.icon),
            items: [
              { say: "課室", answer: "classroom" },
              { say: "發白日夢", answer: "daydreaming" },
              { say: "考試", answer: "examination" },
              { say: "成績表", answer: "report card" },
              { say: "豎起拇指", answer: "thumbs-up" },
              { say: "手提電話／手機", answer: "mobile phone" },
              { say: "感到驕傲", answer: "proud" },
              { say: "……點鐘", answer: oclock },
            ],
          },
          {
            kind: "pictureMatch",
            title: "句子配圖",
            intro: "讀英文句子，點選圖 A 至 H。每張圖只用一次。",
            pictures: pictures,
            items: [
              { sentence: "Mr Ho was teaching Maths in the ______.", answer: "A", why: "課室場景。" },
              { sentence: "A girl was ______ while others talked.", answer: "B", why: "發白日夢。" },
              { sentence: "Jason studied hard for the ______.", answer: "C", why: "考試。" },
              { sentence: "He showed Dad his ______ \u2014 all A\u2019s!", answer: "D", why: "成績表。" },
              { sentence: "Dad gave him a ______.", answer: "E", why: "稱讚。" },
              { sentence: "Jason wanted a ______ to play games.", answer: "F", why: "手機願望。" },
              { sentence: "Dad said, \u201cI\u2019m so ______ of you.\u201d", answer: "G", why: "驕傲。" },
              { sentence: "He studied until eight ______.", answer: "H", why: "時間。" },
            ],
          },
          {
            kind: "bank",
            title: "填上圖中詞",
            intro: "點選下面的英文，再點空格。",
            bank: ["classroom", "daydreaming", "examination", "report card", "mobile phone", "proud", "patient", "reward"],
            items: [
              { id: "cls", before: "Jason had a Maths lesson in the", after: ".", answer: "classroom", hint: "課室。" },
              { id: "dream", before: "A girl was", after: "while classmates were talking.", answer: "daydreaming", hint: "發白日夢。" },
              { id: "exam", before: "He studied hard for the", after: ".", answer: "examination", hint: "考試（拼寫）。" },
              { id: "card", before: "He showed Dad his", after: ".", answer: "report card", hint: "成績表。" },
              { id: "phone", before: "He wanted a", after: "because he wanted to play games.", answer: "mobile phone", hint: "記得冠詞 a 在下一關練。" },
              { id: "proud", before: "Dad was", after: "of Jason.", answer: "proud", hint: "驕傲。" },
              { id: "pat", before: "Jason was", after: "and smart.", answer: "patient", hint: "有耐心。" },
              { id: "rew", before: "The mobile phone was his", after: "for hard work.", answer: "reward", hint: "獎勵。" },
            ],
          },
          {
            kind: "teach",
            title: "Spell these three",
            body: "抄三次：examination · answered · o\u2019clock。下一關練過去式和冠詞 **a mobile phone**。",
          },
        ],
      },
      {
        id: "grammar",
        zh: "文法",
        en: "Grammar",
        blurb: "過去式、a/an、while、because",
        help: "故事用過去式。mobile phone 前面要有 a。",
        hue: "#0e8f7a",
        steps: [
          {
            kind: "teach",
            title: "四個重點",
            lines: [
              "Past tense — was / were / studied / brought / said / wanted / bought / felt",
              "a / an — a mobile phone（子音開頭用 a）",
              "while — 兩件事同時：A was … while B was …",
              "because — 原因：… because …",
            ],
            example: "Jason wanted **a** mobile phone **because** he wanted to play games.",
            glossLine: "Jason 想要一部手機，因為他想玩遊戲。",
          },
          {
            kind: "mcq",
            q: "選正確句子。",
            options: [
              "I want a mobile phone.",
              "I want mobile phone.",
              "I want an mobile phone.",
              "I want the mobile phone yesterday.",
            ],
            answer: "I want a mobile phone.",
            why: "an 只用在元音開頭（an apple）；yesterday 句時態錯亂。",
          },
          {
            kind: "mcq",
            q: "改寫成過去式故事句：It is because he play games.",
            options: [
              "It was because he wanted to play games.",
              "It is because he play games.",
              "It was because he play games.",
              "It is because he wanted to play games.",
            ],
            answer: "It was because he wanted to play games.",
            why: "故事要用過去式：was，而且 play 要改成 wanted to play。",
          },
          {
            kind: "mcq",
            q: "Mr Ho ______ Maths while Jason ______ questions.",
            options: [
              "was teaching / was answering",
              "taught / answered",
              "is teaching / is answering",
              "teach / answer",
            ],
            answer: "was teaching / was answering",
            why: "while 表示兩件事同時，用 was teaching / was answering。",
          },
          {
            kind: "mcq",
            q: "Jason studied hard ______ the examination would be held the next day.",
            options: ["because", "while", "but", "or"],
            answer: "because",
            why: "翌日有考試是原因，用 because。",
          },
          {
            kind: "mcq",
            q: "A girl was daydreaming ______ some classmates were talking.",
            options: ["while", "because", "so", "for"],
            answer: "while",
            why: "兩件事同時，用 while。",
          },
          {
            kind: "bank",
            title: "動詞過去式",
            intro: "點選過去式，再點空格。",
            bank: ["were", "studied", "brought", "showed", "said", "wanted", "bought", "felt", "was", "went"],
            items: [
              { id: "were", before: "Jason and his classmates", after: "having a Maths lesson.", answer: "were", hint: "複數用 were。" },
              { id: "stud", before: "At night, Jason", after: "hard.", answer: "studied", hint: "溫習。" },
              { id: "bring", before: "He", after: "home his report card.", answer: "brought", hint: "bring → brought。" },
              { id: "show", before: "He", after: "it to Dad.", answer: "showed", hint: "出示。" },
              { id: "said", before: "Dad", after: ", \u201cWell done.\u201d", answer: "said", hint: "說。" },
              { id: "want", before: "Jason", after: "a mobile phone.", answer: "wanted", hint: "想要。" },
              { id: "buy", before: "Dad", after: "him one.", answer: "bought", hint: "buy → bought。" },
              { id: "feel", before: "Jason", after: "proud.", answer: "felt", hint: "feel → felt。" },
            ],
          },
          {
            kind: "fix",
            title: "改錯",
            intro: "把句子改成正確英文。",
            items: [
              { id: "phone", prompt: "Fix: I want mobile phone.", answer: "I want a mobile phone." },
              { id: "clock", prompt: "Fix: He studied until 8'clock.", answer: `He studied until ${eight}.` },
              { id: "exam", prompt: "Fix: for the examintion", answer: "for the examination" },
              { id: "play", prompt: "Fix: It is because he play games.", answer: "It was because he wanted to play games." },
            ],
          },
          {
            kind: "teach",
            title: "Grammar checklist",
            body: "寫之前問自己：過去式？a mobile phone？while／because 用啱未？下一關排故事次序。",
          },
        ],
      },
      {
        id: "order",
        zh: "排序",
        en: "Story order",
        blurb: "五幅圖：課室 → 溫習 → 成績表 → 願望 → 結局",
        help: "按故事時間先後點選或拖放。",
        hue: "#6c4ed4",
        steps: [
          {
            kind: "teach",
            title: "五幅圖大綱",
            body: "Pic1 課室 → Pic2 夜晚溫習 → Pic3 成績表全 A → Pic4 許願（手機）→ Pic5 爸爸買手機／道謝。Page 6 已寫到 Pic1–2，要補齊 3–5。",
          },
          {
            kind: "order",
            title: "排好 Jason\u2019s Wish",
            intro: "按正確次序排列。",
            hint: "Pic1 課室 → Pic2 夜晚溫習 → Pic3 成績表 → Pic4 許願 → Pic5 道謝。",
            why: "Pic1 課室 → Pic2 夜晚溫習 → Pic3 成績表 → Pic4 許願 → Pic5 道謝。",
            items: [
              "In the Maths lesson, Mr Ho was teaching while Jason was answering questions. A girl was daydreaming.",
              `At night, Jason studied hard for the examination until ${eight}, then went to sleep.`,
              "Jason showed Dad his report card. Every subject was an A. Dad was proud and gave a thumbs-up.",
              "Jason asked for a reward. He said he wanted a mobile phone because he wanted to play games.",
              "Dad bought Jason a mobile phone. Jason played happily and said thank you.",
            ],
          },
          {
            kind: "mcq",
            q: "哪一段應該最先寫？",
            options: [
              "Maths lesson in the classroom",
              "Dad bought a phone",
              "Report card all A\u2019s",
              "Jason asked for a mobile phone",
            ],
            answer: "Maths lesson in the classroom",
            why: "故事由課室 Maths lesson 開始。",
          },
          {
            kind: "mcq",
            q: "「After a week, Jason…」之後應該寫甚麼？",
            options: ["report card", "Maths lesson again", "only \u201cThe end\u201d", "typhoon"],
            answer: "report card",
            why: "Page 6 寫到 After a week, Jason 之後要接成績表。",
          },
          {
            kind: "mcq",
            q: "結局（Pic 5）最少要有甚麼？",
            options: [
              "Dad gives the phone + Jason says thank you",
              "only \u201cHe was happy.\u201d",
              "classroom again",
              "examination spelling list",
            ],
            answer: "Dad gives the phone + Jason says thank you",
            why: "Pic 5 要有爸爸給手機，以及 Jason 道謝。",
          },
          {
            kind: "teach",
            title: "Ready for dialogue",
            body: "次序啱咗，下一關寫爸爸同 Jason 的對話。",
          },
        ],
      },
      {
        id: "dialogue",
        zh: "對話",
        en: "Dialogue",
        blurb: "爸爸稱讚 + Jason 許願（記得 a）",
        help: "對話加引號。I want **a** mobile phone\u2026",
        hue: "#c45c26",
        steps: [
          {
            kind: "teach",
            title: "兩段重要對話",
            lines: [
              "Dad（Pic 3）：\u201cWell done, Jason. I\u2019m so proud of you.\u201d",
              "Jason（Pic 4）：\u201cDad, I want **a** mobile phone because I want to play games on it.\u201d",
              "Jason（Pic 5）：\u201cThank you, Dad! This is the best present ever!\u201d",
            ],
          },
          {
            kind: "bank",
            title: "父子對話",
            intro: "點選詞語填入對話。",
            bank: ["showed", "brought", "proud", "a", "play", "bought", "gave", "Thank"],
            items: [
              { id: "show", before: "After a week, Jason", after: "his report card to Dad.", answer: "showed", accept: ["showed", "brought"], hint: "出示／帶回。" },
              { id: "proud", before: "Dad: \u201cI\u2019m so", after: "of you.\u201d", answer: "proud", hint: "驕傲。" },
              { id: "art", before: "Jason: \u201cI want", after: "mobile phone\u2026\u201d", answer: "a", hint: "冠詞。" },
              { id: "play", before: "\u201c\u2026because I want to", after: "games on it.\u201d", answer: "play", hint: "玩遊戲。" },
              { id: "buy", before: "Dad", after: "Jason a mobile phone.", answer: "bought", accept: ["bought", "gave"], hint: "買／給。" },
              { id: "thank", before: "Jason: \u201c", after: "you, Dad!\u201d", answer: "Thank", hint: "道謝。" },
            ],
          },
          {
            kind: "mcq",
            q: "哪一句冠詞正確？",
            options: [
              "I want a mobile phone.",
              "I want mobile phone.",
              "I want an mobile phone.",
              "I want some mobile phone.",
            ],
            answer: "I want a mobile phone.",
            why: "mobile phone 前面要有 a，不用 an。",
          },
          {
            kind: "mcq",
            q: "Dad 稱讚 Jason 時較自然的一句是？",
            options: [
              "Well done, Jason. I\u2019m so proud of you.",
              "Give me your phone.",
              "You failed.",
              "Be quiet in Maths.",
            ],
            answer: "Well done, Jason. I\u2019m so proud of you.",
            why: "Pic 3 爸爸稱讚用這句。",
          },
          {
            kind: "mcq",
            q: "結局對話 Jason 應說？",
            options: ["Thank you, Dad!", "I hate this.", "Where is Mum?", "What is an examination?"],
            answer: "Thank you, Dad!",
            why: "Pic 5 Jason 要道謝。",
          },
          {
            kind: "writeShort",
            title: "組兩句對話",
            prompt: "寫出 Pic 3 爸爸的一句話，以及 Pic 4 Jason 許願的一句話（含 a mobile phone）。",
            model: dialogueModel,
          },
          {
            kind: "teach",
            title: "Dialogue done",
            body: "下一關把結局寫長一點，目標約 150 字，並用自查清單。",
          },
        ],
      },
      {
        id: "write",
        zh: "寫作",
        en: "Write & check",
        blurb: "補齊 Pic 3–5 · 約 150 字 · 抄 Page 6 前自查",
        help: "從 After a week, Jason\u2026 寫下去。願望維持 mobile phone。時間用 eight o\u2019clock。",
        hue: "#e07a2f",
        steps: [
          {
            kind: "teach",
            title: "Ending builder",
            body: "用五句擴寫：成績表 → 爸爸說話 → 許願（a mobile phone）→ 爸爸決定 → 道謝＋感受。",
          },
          {
            kind: "guidedWrite",
            title: "五格擴寫",
            intro: "每格寫一句英文。交卷之後才看到範例／教師用。",
            slots: [
              { id: "A", guide: "成績表＋爸爸感受", sample: "Every subject was an A! Dad gave him a thumbs-up." },
              { id: "B", guide: "爸爸的話（引號）", sample: "Dad said, \u201cWell done, Jason. I\u2019m so proud of you.\u201d" },
              { id: "C", guide: "願望＋原因", sample: "Jason said, \u201cDad, I want a mobile phone because I want to play games on it.\u201d" },
              { id: "D", guide: "爸爸決定", sample: "Dad thought for a moment and then bought him one." },
              { id: "E", guide: "道謝＋感受", sample: "Jason said, \u201cThank you, Dad!\u201d He felt proud of his hard work." },
            ],
          },
          {
            kind: "write",
            title: "續寫「Jason\u2019s Wish」",
            prompt: "續寫「Jason\u2019s Wish」。已寫好早上課室和夜晚溫習。從 After a week, Jason 寫到結局。",
            requirements: [
              "願望 = a mobile phone（玩遊戲）",
              "時間統一：eight o\u2019clock（Pic 2）",
              "包含爸爸稱讚、Jason 許願、結局道謝",
              "全文約 150 words",
              "抄入學校作文簿 Page 6 前先自查",
            ],
            model: modelEssay,
          },
          {
            kind: "checklist",
            title: "抄寫前自查",
            intro: "抄入學校作文簿 Page 6 前先自查。",
            items: [
              "Past tense for the story",
              "a mobile phone",
              `Spelling: examination · ${oclock} · answered/said`,
              "One clock time only",
              "Pic 3–5 all written",
              "Dialogue has quotation marks",
              "About 150 words — ready to copy to Page 6",
            ],
          },
          {
            kind: "teach",
            title: "Copy to Page 6",
            body: "自查全綠就可以抄回學校作文簿。寫完再數一次字數。",
          },
        ],
      },
    ],
    checks: {
      wordCount: wordCount,
      normalizeAnswer: normalizeAnswer,
      answersMatch: answersMatch,
      guidedOk: guidedOk,
      dialogueOk: dialogueOk,
      compositionChecks: compositionChecks,
    },
  };

  globalThis.P6_CONTENT = content;
})();
