# P6-Peter-Composition01

Peter · Jason’s Wish. A tap-friendly composition practice for Primary 6 English.

Theme: **Jason’s Wish**. Wish locked to a **mobile phone** (to play games). Word target ≈ **150**. Motto: **Study hard. Ask politely. Say thank you!**

This is **school practice / demo only**. It is not the school’s official worksheet and it does not submit anything to a teacher. There is no login and no server.

Questions are Traditional Chinese where the content spec uses Chinese. Answers stay in English. Buttons, help, and feedback are Traditional Chinese.

## Play online

GitHub Pages is not turned on for this repository. That is on purpose: Eri approves Pages first. This project does not turn Pages on by itself.

When Pages is turned on later, use branch `main` and folder `/` (root). The address would be:

https://tradingservant.github.io/P6-Peter-Composition01/

## Open locally

From this folder:

```bash
python3 -m http.server 8080
```

Then open http://localhost:8080

You can also open `index.html` directly in a browser. The game does not need a network connection after the files are loaded. Progress (stars) stays in the browser (`localStorage` key `p6-peter-composition01-v1`).

On an iPhone, use Safari. Buttons are large. Add it to the Home Screen if you want an app icon (`icons/icon-192.png`).

Check the answer key without a browser:

```bash
node tests/answers.test.js
```

Teacher samples stay hidden until a student submits that step, or until **教師模式** is on. Every revealed sample is marked **範例／教師用**.

## What is inside

1. **詞彙 Vocabulary** — picture words for the story (classroom, daydreaming, examination, report card, thumbs-up, mobile phone, proud, o’clock, patient, reward). Spelling traps for examination, eight o’clock, and answered. Chinese-to-English icon hunt, sentence-to-picture match A–H, then a word bank. Pictures are emoji, not book crops.
2. **文法 Grammar** — past tense, **a** mobile phone, while, and because. Cloze for was / were / studied / brought / said / wanted / bought / felt, then four fix-the-sentence items.
3. **排序 Story order** — five panels from the Maths lesson to Dad buying the phone and Jason saying thank you, plus three order questions. Tap the next sentence. One clock time: **eight o’clock**.
4. **對話 Dialogue** — Dad’s praise and Jason’s wish. Gap dialogue (showed / brought, a, bought / gave, Thank), three choices, then two spoken lines. The model appears after submit.
5. **寫作 Write & check** — five guided ending slots, a continuation from **After a week, Jason**, a self-check list, then copy to Page 6. The full sample (≈ 150 words) appears only after submit or in teacher mode.

Stars are saved on this device. Sound is optional and made in the browser (no audio files). Tap a vocabulary card to hear the English word.

Version: **v1** (footer and service-worker cache `p6-peter-composition01-v1`).

## Answer key

Correct answers follow the Jason’s Wish content spec. Model lines are marked 範例／教師用 inside the writing steps.

- Spelling: examination (not examintion), eight o’clock (apostrophe after o), answered.
- Article: **a** mobile phone. `an` is the trap.
- While joins two simultaneous past actions. Because gives the reason.
- Story order: Maths lesson → night study until eight o’clock → report card → ask for a mobile phone → Dad buys it and Jason says thank you.
- Pic 5 needs the phone and thank you. Page 6 continues after “After a week, Jason” with the report card, not another Maths lesson.
- The full sample keeps one clock time and the mobile-phone wish.

## TODO

- Gloss lines in `js/content.js` are EdK’s draft（待 Eri 改）. Replace `gloss` if Eri revises the Traditional Chinese. Do not invent extra school wording in the meantime.
- GitHub Pages stays off until Eri turns it on (branch `main`, folder `/`).

School worksheet PDFs are not in this repo and are not shown as scans.
