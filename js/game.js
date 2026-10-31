(function () {
  const content = globalThis.P6_CONTENT;
  const app = document.getElementById("app");
  const STORE = content.storageKey;
  const checks = content.checks;

  const BRAND = `<svg viewBox="0 0 64 64" aria-hidden="true"><rect width="64" height="64" rx="14" fill="#0b5cab"/><rect x="22" y="10" width="20" height="44" rx="4" fill="#fff"/><rect x="25" y="16" width="14" height="26" rx="2" fill="#d7e8ff"/><circle cx="32" cy="48" r="2" fill="#0b5cab"/></svg>`;

  const state = {
    screen: "home",
    moduleId: null,
    step: 0,
    score: 0,
    perfect: 0,
    answered: 0,
    total: 0,
    misses: [],
    sound: true,
    teacher: false,
    showHelp: false,
    confirmReset: false,
    play: {},
    progress: {},
  };

  function load() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORE) || "{}");
      state.progress = saved.progress || {};
      state.sound = saved.sound !== false;
      state.teacher = saved.teacher === true;
    } catch (err) {
      state.progress = {};
    }
  }

  function save() {
    try {
      localStorage.setItem(STORE, JSON.stringify({
        progress: state.progress,
        sound: state.sound,
        teacher: state.teacher,
      }));
    } catch (err) {
      /* private mode can block storage */
    }
  }

  function hasZh(text) {
    return /[\u4e00-\u9fff]/.test(String(text || ""));
  }

  function langAttr(text) {
    if (!text) return "";
    return hasZh(text) ? ` lang="zh-Hant"` : ` lang="en"`;
  }

  function esc(value) {
    return String(value).replace(/[&<>"']/g, (ch) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    }[ch]));
  }

  function rich(text) {
    return esc(text || "").replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  }

  function emojiHtml(name) {
    const icon = content.icons[name] || "📘";
    return `<span class="emoji" aria-hidden="true">${icon}</span>`;
  }

  function moduleById(id) {
    return content.modules.find((mod) => mod.id === id);
  }

  function currentModule() {
    return moduleById(state.moduleId);
  }

  function currentStep() {
    const mod = currentModule();
    return mod ? mod.steps[state.step] : null;
  }

  function countItems(step) {
    if (!step) return 0;
    if (step.kind === "mcq" || step.kind === "write" || step.kind === "writeShort") return 1;
    if (step.kind === "iconHunt" || step.kind === "pictureMatch" || step.kind === "bank" || step.kind === "fix" || step.kind === "order") {
      return (step.items || []).length;
    }
    if (step.kind === "guidedWrite") return (step.slots || []).length;
    return 0;
  }

  function shuffle(list) {
    const copy = list.slice();
    for (let i = copy.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  function stars(n) {
    return [1, 2, 3].map((i) => `<span class="${i <= n ? "" : "off"}">★</span>`).join("");
  }

  function beep(freq, dur, type) {
    if (!state.sound) return;
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    if (!beep.ctx) beep.ctx = new AudioCtx();
    const ctx = beep.ctx;
    if (ctx.state === "suspended") ctx.resume();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type || "sine";
    osc.frequency.value = freq;
    gain.gain.value = 0.05;
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
    osc.stop(ctx.currentTime + dur);
  }

  function cheer() {
    beep(523, 0.12);
    setTimeout(() => beep(659, 0.12), 90);
    setTimeout(() => beep(784, 0.16), 180);
  }

  function buzz() {
    beep(196, 0.18, "triangle");
  }

  function speak(text) {
    if (!window.speechSynthesis) return;
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = "en-US";
    utter.rate = 0.92;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utter);
  }

  function confetti() {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const layer = document.createElement("div");
    layer.className = "confetti";
    const colors = ["#0b5cab", "#0e8f7a", "#6c4ed4", "#c45c26", "#e07a2f", "#ffd15c"];
    for (let i = 0; i < 28; i += 1) {
      const bit = document.createElement("i");
      bit.style.left = `${Math.random() * 100}%`;
      bit.style.background = colors[i % colors.length];
      bit.style.animationDelay = `${Math.random() * 0.2}s`;
      layer.appendChild(bit);
    }
    document.body.appendChild(layer);
    setTimeout(() => layer.remove(), 1000);
  }

  function showModel() {
    return !!(state.play.revealed || state.teacher);
  }

  function hiddenNote() {
    return `<p class="gloss" lang="zh-Hant">範例／教師用會在你交卷之後，或開啟教師模式才顯示。</p>`;
  }

  function modelBlock(text) {
    if (!showModel()) return hiddenNote();
    return `<div class="why teacher-key"><p class="kicker">範例／教師用</p><p class="sample">${esc(text || "")}</p></div>`;
  }

  function initPlay(step) {
    const play = {
      forStep: state.step,
      tries: {},
      disabled: {},
      i: 0,
      checks: 0,
      selected: null,
      slots: {},
      done: {},
      drafts: {},
      ticks: {},
      message: null,
      draft: "",
      revealed: false,
    };
    if (step.kind === "mcq") play.options = shuffle(step.options);
    if (step.kind === "iconHunt" || step.kind === "pictureMatch") {
      play.order = shuffle(step.items.map((_, index) => index));
      play.used = {};
    }
    if (step.kind === "bank") {
      play.chips = shuffle(step.bank.map((word, index) => ({ id: `c${index}`, word })));
      play.usedChips = {};
    }
    if (step.kind === "order") {
      play.order = shuffle(step.items.map((_, index) => index));
      play.picked = [];
      play.clean = true;
    }
    if (step.kind === "write") play.draft = "After a week, Jason ";
    state.play = play;
  }

  function startModule(id) {
    const mod = moduleById(id);
    state.screen = "play";
    state.moduleId = id;
    state.step = 0;
    state.score = 0;
    state.perfect = 0;
    state.answered = 0;
    state.misses = [];
    state.total = mod.steps.reduce((sum, step) => sum + countItems(step), 0);
    state.play = {};
    state.showHelp = false;
    render(true);
  }

  function finishModule() {
    const ratio = state.total ? state.perfect / state.total : 1;
    const earned = ratio >= 0.9 ? 3 : ratio >= 0.65 ? 2 : 1;
    const prev = state.progress[state.moduleId] || { stars: 0, score: 0 };
    state.progress[state.moduleId] = {
      stars: Math.max(prev.stars, earned),
      score: Math.max(prev.score, state.score),
    };
    save();
    state.screen = "result";
    state.earned = earned;
    if (earned >= 2) confetti();
    cheer();
    render(true);
  }

  function nextStep() {
    const mod = currentModule();
    if (state.step + 1 >= mod.steps.length) {
      finishModule();
      return;
    }
    state.step += 1;
    state.play = {};
    render(true);
  }

  function record(okFirst, question, answer, why) {
    state.answered += 1;
    if (okFirst) {
      state.perfect += 1;
      state.score += 10;
      cheer();
    } else {
      state.score += 4;
      state.misses.push({ q: question, a: answer, why: why || "" });
      buzz();
    }
  }

  function feedback(ok, text) {
    if (state.play) state.play.message = { ok: ok, text: text };
    const node = document.getElementById("feedback");
    if (!node) return;
    node.className = `feedback ${ok ? "good" : "bad"}`;
    node.lang = hasZh(text) ? "zh-Hant" : "en";
    node.textContent = text;
  }

  let suppressClick = false;

  function render(scroll) {
    const step = state.screen === "play" ? currentStep() : null;
    if (step && state.play.forStep !== state.step) initPlay(step);
    app.innerHTML = shell(step);
    if (scroll) {
      const main = document.querySelector(".main");
      if (main) main.scrollTop = 0;
      window.scrollTo(0, 0);
    }
    wireDrag();
  }

  function shell(step) {
    return `${topbar()}${state.screen === "home" ? home() : ""}${state.screen === "play" ? play(step) : ""}${state.screen === "result" ? result() : ""}`;
  }

  function topbar() {
    const mod = currentModule();
    const title = mod && state.screen !== "home"
      ? `<h1>${esc(mod.zh)} · ${esc(mod.en)}</h1><p>${state.answered}/${state.total} · ${state.score} pts</p>`
      : `<h1>Jason\u2019s Wish</h1><p>Composition</p>`;
    const homeBtn = state.screen === "home"
      ? ""
      : `<button type="button" class="icon-btn" data-action="home" aria-label="回主頁">主頁</button>`;
    return `<header class="topbar"><div class="brand"><div class="brand-mark" aria-hidden="true">${BRAND}</div><div>${title}</div></div><div class="spacer"></div>${homeBtn}<button type="button" class="icon-btn" data-action="sound" aria-pressed="${state.sound ? "true" : "false"}" aria-label="${state.sound ? "音效開" : "音效關"}">音效</button></header>`;
  }

  function teacherButton() {
    return `<button type="button" class="text-btn" data-action="teacher" aria-pressed="${state.teacher ? "true" : "false"}">${state.teacher ? "關閉教師模式" : "教師模式"}</button>`;
  }

  function teacherNote() {
    if (!state.teacher) return "";
    return `<p class="help" lang="zh-Hant">教師模式已開。範例／教師用答案會顯示。學生平常請關閉。</p>`;
  }

  function home() {
    const cards = content.modules.map((mod, index) => {
      const saved = state.progress[mod.id];
      const n = saved ? saved.stars : 0;
      return `<button type="button" class="quest" data-action="open" data-module="${esc(mod.id)}">
        <span class="quest-index" style="background:${esc(mod.hue)}">${index + 1}</span>
        <span>
          <h3>${esc(mod.zh)} <span class="en">${esc(mod.en)}</span></h3>
          <p class="blurb">${esc(mod.blurb)}</p>
          <div class="stars" aria-label="${n} stars">${stars(n)} ${n ? "" : `<span class="gloss">未玩過</span>`}</div>
        </span>
      </button>`;
    }).join("");
    const minis = ["classroom", "examination", "report card", "mobile phone", "thumbs-up"].map((name) => `<span class="mini-ico">${emojiHtml(name)}</span>`).join("");
    const reset = state.confirmReset
      ? `<button type="button" class="text-btn" data-action="reset-yes">確定清除</button>`
      : `<button type="button" class="text-btn" data-action="reset">清除星星</button>`;
    return `<div class="main"><section class="hero">
      <p class="kicker">P6-Peter-Composition01</p>
      <h2>${esc(content.title)}</h2>
      <p>${esc(content.subtitle)}</p>
      <p class="motto" lang="en">${esc(content.motto)}</p>
      <p class="hero-note" lang="zh-Hant">${esc(content.hub)}</p>
      <div class="mascot-row">${minis}</div>
    </section>
    ${teacherNote()}
    <div class="map">${cards}</div>
    <div class="row">${teacherButton()}${reset}</div>
    <p class="footer-note">Composition 1 · Jason\u2019s Wish · ${esc(content.motto)} · ${esc(content.version)} · school practice</p>
    </div>`;
  }

  function play(step) {
    const mod = currentModule();
    const pct = state.total ? Math.round((state.answered / state.total) * 100) : 0;
    const help = state.showHelp ? `<div class="help" lang="zh-Hant">${rich(mod.help)}</div>` : "";
    const note = state.play.message;
    const banked = step.kind === "bank";
    return `<div class="main${banked ? " has-bank" : ""}">
      <div class="progress" aria-hidden="true"><div style="width:${pct}%"></div></div>
      <div class="row" style="margin-top:0"><button type="button" class="text-btn" data-action="help">${state.showHelp ? "收起提示" : "提示"}</button>
      ${teacherButton()}</div>
      ${teacherNote()}${help}
      ${renderStep(step)}
      ${teacherBox(step)}
      <p id="feedback" class="feedback ${note ? (note.ok ? "good" : "bad") : ""}"${note ? langAttr(note.text) : ""} aria-live="polite">${note ? esc(note.text) : ""}</p>
    </div>${banked ? bankHtml(step) : ""}`;
  }

  function answerList(item) {
    return (item.accept || [item.answer]).join(" / ");
  }

  function teacherBox(step) {
    if (!state.teacher || !step) return "";
    if (step.kind === "teach" || step.kind === "write" || step.kind === "writeShort" || step.kind === "guidedWrite" || step.kind === "checklist") return "";
    let text = "";
    if (step.kind === "mcq") text = step.answer || "";
    else if (step.kind === "iconHunt") {
      const item = step.items[state.play.order[state.play.i]];
      text = item ? item.answer : "";
    } else if (step.kind === "pictureMatch") {
      const item = step.items[state.play.order[state.play.i]];
      if (!item) return "";
      const pic = (step.pictures || []).find((entry) => entry.id === item.answer);
      text = `${item.answer}${pic ? ` · ${pic.label}` : ""}`;
    } else if (step.kind === "bank") {
      text = step.items.map((item) => `${item.before} ${answerList(item)} ${item.after}`).join("\n");
    } else if (step.kind === "order") {
      text = step.items.map((line, index) => `${index + 1}. ${line}`).join("\n");
    } else if (step.kind === "fix") {
      text = step.items.map((item) => `${item.prompt} → ${item.answer}`).join("\n");
    }
    if (!text) return "";
    return `<div class="why teacher-key"><p class="kicker">範例／教師用</p><p class="sample">${esc(text)}</p></div>`;
  }

  function renderStep(step) {
    if (step.kind === "teach") return teachHtml(step);
    if (step.kind === "mcq") return mcqHtml(step);
    if (step.kind === "iconHunt") return iconHuntHtml(step);
    if (step.kind === "bank") return bankStoryHtml(step);
    if (step.kind === "pictureMatch") return pictureMatchHtml(step);
    if (step.kind === "order") return orderHtml(step);
    if (step.kind === "fix") return fixHtml(step);
    if (step.kind === "writeShort") return writeShortHtml(step);
    if (step.kind === "guidedWrite") return guidedHtml(step);
    if (step.kind === "write") return writeHtml(step);
    if (step.kind === "checklist") return checklistHtml(step);
    return "";
  }

  function teachHtml(step) {
    let body = "";
    if (step.body) body += `<p${langAttr(step.body)}>${rich(step.body)}</p>`;
    if (step.glossLine) body += `<p lang="zh-Hant"><strong>${esc(step.glossLine)}</strong></p>`;
    if (step.example) body += `<p class="why"${langAttr(step.example)}>${rich(step.example)}</p>`;
    if (step.lines) {
      body += `<ul class="miss-list">${step.lines.map((line) => `<li${langAttr(line)}>${rich(line)}</li>`).join("")}</ul>`;
    }
    if (step.cards) {
      body += `<div class="card-grid">${step.cards.map((name) => `<button type="button" class="word-card" data-action="speak" data-word="${esc(name)}">${emojiHtml(name)}<strong lang="en">${esc(name)}</strong><span class="gloss" lang="zh-Hant">${esc(content.gloss[name] || "")}</span><span class="gloss">讀音</span></button>`).join("")}</div>`;
    }
    const last = state.step + 1 >= currentModule().steps.length;
    return `<section class="panel"><p class="kicker">學一學</p><h2 class="step-title"${langAttr(step.title)}>${esc(step.title || "學一學")}</h2>${body}<button type="button" class="big-go" data-action="next">${last ? "完成" : "開始"}</button></section>`;
  }

  function mcqHtml(step) {
    const options = state.play.options || step.options;
    const buttons = options.map((option) => {
      const off = state.play.disabled[option] ? "disabled" : "";
      return `<button type="button" class="choice" data-action="mcq" data-option="${esc(option)}" ${langAttr(option)} ${off}>${esc(option)}</button>`;
    }).join("");
    const why = state.play.revealed ? `<div class="why"${langAttr(step.why)}>${esc(step.why || "")}</div><button type="button" class="big-go" data-action="next">下一題</button>` : "";
    return `<section class="panel"><p class="kicker">選擇題</p><h2 class="step-title"${langAttr(step.q)}>${esc(step.q)}</h2><div class="choices">${buttons}</div>${why}</section>`;
  }

  function iconHuntHtml(step) {
    const item = step.items[state.play.order[state.play.i]];
    const names = step.pool || Object.keys(content.icons);
    const buttons = names.map((name) => `<button type="button" class="icon-pick" data-action="hunt" data-id="${esc(name)}">${emojiHtml(name)}<strong lang="en">${esc(name)}</strong></button>`).join("");
    return `<section class="panel"><p class="kicker">${esc(step.title)} · ${state.play.i + 1}/${step.items.length}</p><p class="prompt-word" lang="zh-Hant">${esc(item.say)}</p><div class="icon-grid">${buttons}</div></section>`;
  }

  function blankButton(item) {
    const filled = state.play.slots[item.id];
    const locked = state.play.done[item.id];
    const cls = locked ? "blank is-locked" : state.play.selected ? "blank is-armed" : "blank";
    const label = filled || "______";
    const before = item.before || "";
    const after = item.after || "";
    const left = /[\s\u201C\u2018「]$/.test(before) || before === "" ? "" : " ";
    const right = /^[\s.,!?;:\u201D\u2019」]/.test(after) || after === "" ? "" : " ";
    return `<p class="story-bit"${langAttr(`${before} ${after}`)}>${esc(before)}${left}<button type="button" class="${cls}" data-action="blank" data-id="${esc(item.id)}" ${locked ? "disabled" : ""}>${esc(label)}</button>${right}${esc(after)}</p>`;
  }

  function bankStoryHtml(step) {
    const bits = step.items.map((item) => blankButton(item)).join("");
    const done = step.items.every((item) => state.play.done[item.id]);
    return `<section class="panel"><p class="kicker">${esc(step.title)}</p><p${langAttr(step.intro)}>${esc(step.intro || "")}</p>${bits}${done ? `<button type="button" class="big-go" data-action="next">下一題</button>` : `<p class="gloss" lang="zh-Hant">點選下面的字，再點空格。也可以拖過去。</p>`}</section>`;
  }

  function bankHtml(step) {
    const chips = (state.play.chips || []).map((chip) => {
      const used = !!state.play.usedChips[chip.id];
      const selected = state.play.selected === chip.id ? "is-selected" : "";
      return `<button type="button" class="chip ${selected}" data-action="chip" data-chip="${esc(chip.id)}" data-word="${esc(chip.word)}" ${used ? "disabled" : ""}>${esc(chip.word)}</button>`;
    }).join("");
    return `<div class="bank"><div class="bank-tray">${chips}</div></div>`;
  }

  function pictureMatchHtml(step) {
    const item = step.items[state.play.order[state.play.i]];
    const buttons = step.pictures.map((pic) => {
      const used = state.play.used[pic.id] ? "disabled" : "";
      return `<button type="button" class="icon-pick" data-action="pic" data-id="${esc(pic.id)}" aria-label="Picture ${esc(pic.id)}" ${used}>${emojiHtml(pic.icon)}<strong>${esc(pic.id)}</strong></button>`;
    }).join("");
    const intro = step.intro ? `<p lang="zh-Hant">${esc(step.intro)}</p>` : "";
    return `<section class="panel"><p class="kicker">${esc(step.title)} · ${state.play.i + 1}/${step.items.length}</p>${intro}<p class="sentence" lang="en">${esc(item.sentence)}</p><div class="icon-grid">${buttons}</div></section>`;
  }

  function orderHtml(step) {
    const picked = state.play.picked || [];
    const doneBits = picked.map((index, n) => `<p lang="en">${n + 1}. ${esc(step.items[index])}</p>`).join("");
    const remain = (state.play.order || []).filter((index) => !picked.includes(index)).map((index) => `<button type="button" class="choice" data-action="order" data-index="${index}" lang="en">${esc(step.items[index])}</button>`).join("");
    const intro = step.intro ? `<p lang="zh-Hant">${esc(step.intro)}</p>` : "";
    const next = state.play.revealed ? `<button type="button" class="big-go" data-action="next">下一題</button>` : "";
    return `<section class="panel"><p class="kicker">${esc(step.title)}</p>${intro}<div class="order-done">${doneBits}</div><div class="choices">${state.play.revealed ? "" : remain}</div>${next}</section>`;
  }

  function fixHtml(step) {
    const item = step.items[state.play.i];
    const revealed = !!state.play.revealed;
    const field = revealed
      ? `<p class="sentence" lang="en">${esc(item.answer)}</p>`
      : `<input class="fix-box" data-fix-input spellcheck="false" autocapitalize="off" autocomplete="off" value="${esc(state.play.draft || "")}" placeholder="輸入改好的英文" aria-label="改好的英文">`;
    const nextLabel = state.play.i + 1 >= step.items.length ? "繼續" : "下一句";
    const action = revealed
      ? `<button type="button" class="big-go" data-action="next-fix">${nextLabel}</button>`
      : `<button type="button" class="big-go" data-action="check-fix">檢查</button>`;
    const shown = revealed ? `<div class="why teacher-key"><p class="kicker">範例／教師用</p><p class="sample" lang="en">${esc(item.answer)}</p></div>` : "";
    return `<section class="panel"><p class="kicker">${esc(step.title)} · ${state.play.i + 1}/${step.items.length}</p><p${langAttr(step.intro)}>${esc(step.intro || "")}</p><h2 class="step-title" lang="en">${esc(item.prompt)}</h2>${field}${shown}${action}</section>`;
  }

  function writeShortHtml(step) {
    const submitted = !!state.play.revealed;
    const marks = submitted
      ? `<ul class="check-list">${(state.play.checkList || []).map((item) => `<li class="${item.ok ? "ok" : "no"}">${item.ok ? "✓" : "✗"} ${esc(item.label)}</li>`).join("")}</ul>`
      : "";
    const next = submitted
      ? `<button type="button" class="big-go" data-action="next">下一題</button>`
      : `<button type="button" class="big-go" data-action="submit-short">交卷並對照</button>`;
    return `<section class="panel"><p class="kicker">短寫</p><h2 class="step-title">${esc(step.title)}</h2><p lang="zh-Hant">${esc(step.prompt || "")}</p><textarea class="write-box" data-write-short rows="6" placeholder="Dad: …&#10;Jason: …" ${submitted ? "readonly" : ""}>${esc(state.play.draft || "")}</textarea>${marks}${modelBlock(step.model)}${next}</section>`;
  }

  function guidedHtml(step) {
    const submitted = !!state.play.revealed;
    const fields = step.slots.map((slot) => {
      const value = state.play.drafts[slot.id] || "";
      return `<label class="guide-card"><span class="kicker">${esc(slot.id)}</span><span lang="zh-Hant">${esc(slot.guide)}</span><textarea class="slot-box" data-slot-input="${esc(slot.id)}" rows="3" ${submitted ? "readonly" : ""}>${esc(value)}</textarea></label>`;
    }).join("");
    const samples = step.slots.map((slot) => `${slot.id}. ${slot.guide}\n${slot.sample}`).join("\n\n");
    const next = submitted
      ? `<button type="button" class="big-go" data-action="next">下一題</button>`
      : `<button type="button" class="big-go" data-action="submit-guided">交卷並對照</button>`;
    return `<section class="panel"><p class="kicker">五格</p><h2 class="step-title">${esc(step.title)}</h2><p lang="zh-Hant">${esc(step.intro || "")}</p>${fields}${modelBlock(samples)}${next}</section>`;
  }

  function writeHtml(step) {
    const submitted = !!state.play.revealed;
    const rules = (step.requirements || []).map((rule) => `<li lang="zh-Hant">${esc(rule)}</li>`).join("");
    const count = checks.wordCount(state.play.draft || "");
    const marks = submitted
      ? `<ul class="check-list">${(state.play.checkList || []).map((item) => `<li class="${item.ok ? "ok" : "no"}">${item.ok ? "✓" : "✗"} ${esc(item.label)}${item.detail ? `（${esc(item.detail)}）` : ""}</li>`).join("")}</ul>`
      : "";
    const next = submitted
      ? `<button type="button" class="big-go" data-action="next">下一題</button>`
      : `<button type="button" class="big-go" data-action="submit-write">交卷並自我檢查</button>`;
    return `<section class="panel"><p class="kicker">寫作</p><h2 class="step-title">${esc(step.title)}</h2><p lang="zh-Hant">${esc(step.prompt || "")}</p><ul class="miss-list">${rules}</ul><textarea class="write-box" data-compose rows="12" ${submitted ? "readonly" : ""}>${esc(state.play.draft || "")}</textarea><p class="word-count" lang="zh-Hant">字數：<span id="word-count">${count}</span>（全文目標約 150，含已寫的課室和溫習）</p>${marks}${modelBlock(step.model)}${next}</section>`;
  }

  function checklistHtml(step) {
    const buttons = step.items.map((label, index) => {
      const on = !!state.play.ticks[index];
      return `<button type="button" class="tick${on ? " is-on" : ""}" data-action="tick" data-id="${index}" aria-pressed="${on ? "true" : "false"}"><span class="tick-box" aria-hidden="true">${on ? "✓" : ""}</span><span>${esc(label)}</span></button>`;
    }).join("");
    const all = step.items.every((_, index) => state.play.ticks[index]);
    const next = all ? `<button type="button" class="big-go" data-action="next">完成自查</button>` : `<p class="gloss" lang="zh-Hant">逐項勾選。這張清單沒有隱藏答案。</p>`;
    return `<section class="panel"><p class="kicker">自查</p><h2 class="step-title">${esc(step.title)}</h2><p lang="zh-Hant">${esc(step.intro || "")}</p><div class="tick-list">${buttons}</div>${next}</section>`;
  }

  function result() {
    const mod = currentModule();
    const ids = content.modules.map((item) => item.id);
    const nextId = ids[ids.indexOf(mod.id) + 1];
    const misses = state.misses.length
      ? `<h3>再看一眼</h3><p class="kicker">範例／教師用</p><ul class="miss-list">${state.misses.slice(0, 8).map((miss) => `<li><strong${langAttr(miss.q)}>${esc(miss.q)}</strong><br><span lang="en">答案：${esc(miss.a)}</span>${miss.why ? `<br><span class="gloss"${langAttr(miss.why)}>${esc(miss.why)}</span>` : ""}</li>`).join("")}</ul>`
      : `<p lang="zh-Hant">全部一次過！太棒了！</p>`;
    const all = content.modules.every((item) => (state.progress[item.id] || {}).stars > 0);
    return `<div class="main"><section class="panel">
      <p class="kicker">${esc(mod.zh)}完成</p>
      <h2 class="step-title">${state.earned === 3 ? "三星！" : state.earned === 2 ? "兩星，好厲害！" : "過關！再玩可以拿更多星。"}</h2>
      <div class="score-stars" aria-label="${state.earned} stars">${stars(state.earned)}</div>
      <p lang="zh-Hant">${state.perfect}/${state.total} 題第一次就對 · ${state.score} 分</p>
      ${misses}
      ${all ? `<div class="why"><strong lang="en">${esc(content.motto)}</strong><p lang="zh-Hant">五關都玩過了。自查之後可以抄回作文簿 Page 6。</p></div>` : ""}
      <div class="row">
        <button type="button" class="big-go" data-action="replay">再玩一次</button>
        ${nextId ? `<button type="button" class="text-btn" data-action="open" data-module="${esc(nextId)}">下一關</button>` : ""}
        <button type="button" class="text-btn" data-action="home">回主頁</button>
      </div>
    </section></div>`;
  }

  function onMcq(option, button) {
    const step = currentStep();
    if (state.play.revealed) return;
    if (option === step.answer) {
      const first = Object.keys(state.play.disabled).length === 0;
      record(first, step.q, step.answer, step.why);
      state.play.revealed = true;
      state.play.message = { ok: true, text: first ? "太棒了！" : "今次對了！" };
      render(false);
      return;
    }
    state.play.disabled[option] = true;
    if (button) button.classList.add("is-wrong");
    buzz();
    feedback(false, "再試一次～");
    setTimeout(() => render(false), 280);
  }

  function advanceSeries(step, keyPrefix, prompt, answer, why, okText) {
    const index = state.play.order[state.play.i];
    const key = `${keyPrefix}:${index}`;
    const first = !state.play.tries[key];
    record(first, prompt, answer, why);
    state.play.locked = true;
    feedback(true, okText);
    setTimeout(() => {
      state.play.locked = false;
      state.play.message = null;
      if (state.play.i + 1 >= step.items.length) nextStep();
      else {
        state.play.i += 1;
        render(false);
      }
    }, 650);
  }

  function onHunt(id, button) {
    const step = currentStep();
    const index = state.play.order[state.play.i];
    const item = step.items[index];
    if (state.play.locked) return;
    if (id === item.answer) {
      if (button) button.classList.add("is-right");
      const gloss = content.gloss[item.answer] ? ` ${content.gloss[item.answer]}` : "";
      advanceSeries(step, "icon", item.say, item.answer, "", `好眼力！ ${item.answer}${gloss}`);
      return;
    }
    const key = `icon:${index}`;
    state.play.tries[key] = (state.play.tries[key] || 0) + 1;
    if (button) {
      button.classList.add("is-wrong");
      setTimeout(() => button.classList.remove("is-wrong"), 350);
    }
    buzz();
    feedback(false, "再看看圖。");
  }

  function onPic(id, button) {
    const step = currentStep();
    if (state.play.locked) return;
    const index = state.play.order[state.play.i];
    const item = step.items[index];
    if (state.play.used[id]) {
      feedback(false, "這張圖已經配對過了。");
      return;
    }
    if (id === item.answer) {
      if (button) button.classList.add("is-right");
      const pic = step.pictures.find((entry) => entry.id === id);
      state.play.used[id] = true;
      advanceSeries(step, "pic", item.sentence, `${id} · ${pic ? pic.label : id}`, item.why, `配對正確！ ${id}`);
      return;
    }
    const key = `pic:${index}`;
    state.play.tries[key] = (state.play.tries[key] || 0) + 1;
    if (button) {
      button.classList.add("is-wrong");
      setTimeout(() => button.classList.remove("is-wrong"), 350);
    }
    buzz();
    feedback(false, state.play.tries[key] >= 2 && item.why ? item.why : "再看看圖。");
  }

  function onOrder(index, button) {
    const step = currentStep();
    if (state.play.revealed) return;
    const expect = (state.play.picked || []).length;
    if (index === expect) {
      const first = state.play.clean !== false;
      state.play.picked.push(index);
      record(first, `第 ${expect + 1} 句`, step.items[index], step.why || "");
      state.play.clean = true;
      if (state.play.picked.length === step.items.length) {
        state.play.revealed = true;
        state.play.message = { ok: true, text: "次序排好了！" };
        render(false);
      } else {
        state.play.message = { ok: true, text: "對，下一個。" };
        render(false);
      }
      return;
    }
    state.play.clean = false;
    state.play.tries.order = (state.play.tries.order || 0) + 1;
    if (button) {
      button.classList.add("is-wrong");
      setTimeout(() => button.classList.remove("is-wrong"), 350);
    }
    buzz();
    feedback(false, state.play.tries.order >= 2 && step.hint ? step.hint : "還不是這個。");
  }

  function lockAlternates(item, usedWord) {
    (item.accept || [item.answer]).forEach((word) => {
      if (word === usedWord) return;
      const extra = (state.play.chips || []).find((entry) => entry.word === word && !state.play.usedChips[entry.id]);
      if (extra) state.play.usedChips[extra.id] = `alt:${item.id}`;
    });
  }

  function placeBank(chipId, blankId) {
    const step = currentStep();
    const chip = (state.play.chips || []).find((entry) => entry.id === chipId);
    if (!chip || state.play.usedChips[chipId]) return;
    const item = step.items.find((entry) => entry.id === blankId);
    if (!item || state.play.done[item.id]) return;
    const accept = item.accept || [item.answer];
    if (accept.includes(chip.word)) {
      const first = !state.play.tries[item.id];
      state.play.usedChips[chipId] = blankId;
      lockAlternates(item, chip.word);
      state.play.slots[item.id] = chip.word;
      state.play.done[item.id] = true;
      state.play.selected = null;
      record(first, `${item.before} ______ ${item.after}`, accept.join(" / "), item.hint);
      state.play.message = { ok: true, text: first ? "放對了！" : "今次對了！" };
      render(false);
      return;
    }
    state.play.tries[item.id] = (state.play.tries[item.id] || 0) + 1;
    if (state.play.tries[item.id] >= 3) {
      const match = (state.play.chips || []).find((entry) => entry.word === item.answer && !state.play.usedChips[entry.id]);
      if (match) state.play.usedChips[match.id] = item.id;
      lockAlternates(item, item.answer);
      state.play.slots[item.id] = item.answer;
      state.play.done[item.id] = true;
      state.play.selected = null;
      record(false, `${item.before} ______ ${item.after}`, accept.join(" / "), item.hint);
      state.play.message = { ok: false, text: `範例／教師用：${item.answer}。${item.hint || ""}` };
      render(false);
      return;
    }
    const blank = document.querySelector(`[data-action="blank"][data-id="${CSS.escape(item.id)}"]`);
    if (blank) {
      blank.classList.add("is-wrong");
      setTimeout(() => blank.classList.remove("is-wrong"), 350);
    }
    buzz();
    feedback(false, state.play.tries[item.id] >= 2 && item.hint ? item.hint : "再試一次。這個字不是這裡。");
  }

  function readFixDraft() {
    const box = document.querySelector("[data-fix-input]");
    if (box) state.play.draft = box.value;
    return state.play.draft || "";
  }

  function onCheckFix() {
    const step = currentStep();
    if (!step || step.kind !== "fix" || state.play.revealed) return;
    const item = step.items[state.play.i];
    const typed = readFixDraft().trim();
    if (!typed) {
      feedback(false, "請先輸入改好的英文。");
      return;
    }
    if (checks.answersMatch(typed, item.answer)) {
      const first = !state.play.tries[item.id];
      state.play.revealed = true;
      record(first, item.prompt, item.answer, "");
      state.play.message = { ok: true, text: !state.play.tries[item.id] ? "改對了！" : "今次對了！" };
      render(false);
      return;
    }
    state.play.tries[item.id] = (state.play.tries[item.id] || 0) + 1;
    if (state.play.tries[item.id] >= 3) {
      state.play.revealed = true;
      record(false, item.prompt, item.answer, "");
      state.play.message = { ok: false, text: "看看正確句子。" };
      render(false);
      return;
    }
    buzz();
    feedback(false, "還未改對。再試一次。");
  }

  function syncShort() {
    const box = document.querySelector("[data-write-short]");
    if (box) state.play.draft = box.value;
  }

  function syncGuided() {
    document.querySelectorAll("[data-slot-input]").forEach((el) => {
      state.play.drafts[el.dataset.slotInput] = el.value;
    });
  }

  function syncCompose() {
    const box = document.querySelector("[data-compose]");
    if (box) state.play.draft = box.value;
  }

  function onSubmitShort() {
    const step = currentStep();
    if (state.play.revealed) return;
    syncShort();
    const text = (state.play.draft || "").trim();
    if (text.length < 8) {
      feedback(false, "請先寫爸爸和 Jason 的英文對話。");
      return;
    }
    const marks = checks.dialogueOk(text);
    const list = [
      { ok: marks.praise, label: "Dad praises Jason" },
      { ok: marks.phone, label: "a mobile phone" },
      { ok: marks.reason, label: "because / play games" },
    ];
    state.play.checkList = list;
    state.play.revealed = true;
    record(list.every((item) => item.ok), step.prompt, "dialogue", "");
    state.play.message = { ok: list.every((item) => item.ok), text: "已交卷。可以對照範例／教師用。" };
    render(false);
  }

  function onSubmitGuided() {
    const step = currentStep();
    if (state.play.revealed) return;
    syncGuided();
    const short = step.slots.some((slot) => String(state.play.drafts[slot.id] || "").trim().length < 8);
    if (short) {
      feedback(false, "五格都要寫一句英文，才可以對照範例。");
      return;
    }
    let allFirst = true;
    step.slots.forEach((slot) => {
      const ok = checks.guidedOk(slot.id, state.play.drafts[slot.id]);
      if (!ok) allFirst = false;
      record(ok, slot.guide, slot.sample, slot.guide);
    });
    state.play.revealed = true;
    state.play.message = { ok: allFirst, text: "已交卷。可以對照範例／教師用。" };
    render(false);
  }

  function onSubmitWrite() {
    const step = currentStep();
    if (state.play.revealed) return;
    syncCompose();
    const text = (state.play.draft || "").trim();
    if (!text || text === "After a week, Jason") {
      feedback(false, "請從 After a week, Jason 寫下去。");
      return;
    }
    const list = checks.compositionChecks(text);
    state.play.checkList = list;
    state.play.revealed = true;
    const ok = list.every((item) => item.ok);
    record(ok, step.title, ok ? "ending" : "對照範例：結局要有成績表、a mobile phone、道謝。", step.prompt);
    state.play.message = { ok: ok, text: ok ? "結局的要點齊了，可以對照範例。" : "已交卷。對照清單，再看範例／教師用。" };
    render(false);
  }

  function wireDrag() {
    document.querySelectorAll(".chip").forEach((chip) => {
      chip.addEventListener("pointerdown", (event) => {
        if (chip.disabled) return;
        chip.setPointerCapture(event.pointerId);
        const word = chip.dataset.word;
        const chipId = chip.dataset.chip;
        let moved = false;
        const ghost = document.createElement("div");
        ghost.className = "ghost-chip";
        ghost.textContent = word;
        const move = (ev) => {
          if (Math.abs(ev.clientX - event.clientX) + Math.abs(ev.clientY - event.clientY) > 12) {
            moved = true;
            if (!ghost.parentNode) document.body.appendChild(ghost);
          }
          ghost.style.left = `${ev.clientX}px`;
          ghost.style.top = `${ev.clientY}px`;
        };
        const up = (ev) => {
          ghost.remove();
          chip.removeEventListener("pointermove", move);
          chip.removeEventListener("pointerup", up);
          if (!moved) return;
          suppressClick = true;
          setTimeout(() => { suppressClick = false; }, 400);
          const el = document.elementFromPoint(ev.clientX, ev.clientY);
          const blank = el && el.closest("[data-action='blank']");
          if (blank && chipId) placeBank(chipId, blank.dataset.id);
        };
        chip.addEventListener("pointermove", move);
        chip.addEventListener("pointerup", up);
      });
    });
  }

  app.addEventListener("click", (event) => {
    if (suppressClick) {
      suppressClick = false;
      return;
    }
    const button = event.target.closest("[data-action]");
    if (!button || button.disabled) return;
    const action = button.dataset.action;
    if (action === "sound") {
      state.sound = !state.sound;
      save();
      render(false);
      return;
    }
    if (action === "teacher") {
      state.teacher = !state.teacher;
      save();
      render(false);
      return;
    }
    if (action === "home") {
      state.screen = "home";
      state.moduleId = null;
      render(true);
      return;
    }
    if (action === "open") {
      startModule(button.dataset.module);
      return;
    }
    if (action === "help") {
      state.showHelp = !state.showHelp;
      render(false);
      return;
    }
    if (action === "speak") {
      speak(button.dataset.word);
      return;
    }
    if (action === "next") {
      nextStep();
      return;
    }
    if (action === "replay") {
      startModule(state.moduleId);
      return;
    }
    if (action === "reset") {
      state.confirmReset = true;
      render(false);
      return;
    }
    if (action === "reset-yes") {
      state.progress = {};
      state.confirmReset = false;
      save();
      render(false);
      return;
    }
    if (action === "mcq") {
      onMcq(button.dataset.option, button);
      return;
    }
    if (action === "hunt") {
      onHunt(button.dataset.id, button);
      return;
    }
    if (action === "pic") {
      onPic(button.dataset.id, button);
      return;
    }
    if (action === "order") {
      onOrder(Number(button.dataset.index), button);
      return;
    }
    if (action === "chip") {
      const token = button.dataset.chip;
      state.play.selected = state.play.selected === token ? null : token;
      render(false);
      return;
    }
    if (action === "blank") {
      if (!state.play.selected) {
        feedback(false, "先點下面的字。");
        return;
      }
      placeBank(state.play.selected, button.dataset.id);
      return;
    }
    if (action === "check-fix") {
      onCheckFix();
      return;
    }
    if (action === "next-fix") {
      const step = currentStep();
      if (state.play.i + 1 >= step.items.length) nextStep();
      else {
        state.play.i += 1;
        state.play.draft = "";
        state.play.revealed = false;
        state.play.message = null;
        render(true);
      }
      return;
    }
    if (action === "submit-short") {
      onSubmitShort();
      return;
    }
    if (action === "submit-guided") {
      onSubmitGuided();
      return;
    }
    if (action === "submit-write") {
      onSubmitWrite();
      return;
    }
    if (action === "tick") {
      const id = button.dataset.id;
      state.play.ticks[id] = !state.play.ticks[id];
      render(false);
    }
  });

  app.addEventListener("input", (event) => {
    if (!state.play) return;
    const fix = event.target.closest("[data-fix-input]");
    if (fix) state.play.draft = fix.value;
    const short = event.target.closest("[data-write-short]");
    if (short) state.play.draft = short.value;
    const slot = event.target.closest("[data-slot-input]");
    if (slot) state.play.drafts[slot.dataset.slotInput] = slot.value;
    const compose = event.target.closest("[data-compose]");
    if (compose) {
      state.play.draft = compose.value;
      const count = document.getElementById("word-count");
      if (count) count.textContent = String(checks.wordCount(compose.value));
    }
  });

  app.addEventListener("keydown", (event) => {
    if (event.key !== "Enter") return;
    if (event.target.closest("[data-fix-input]")) {
      event.preventDefault();
      onCheckFix();
    }
  });

  if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
    navigator.serviceWorker.register("./sw.js").catch(() => {});
  }

  load();
  render(true);
})();
