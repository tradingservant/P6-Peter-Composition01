const fs = require("fs");
const vm = require("vm");
const path = require("path");

const root = path.join(__dirname, "..");
const code = fs.readFileSync(path.join(root, "js/content.js"), "utf8");
const sandbox = {};
vm.createContext(sandbox);
vm.runInContext(code, sandbox);
const content = sandbox.P6_CONTENT;
const checks = content.checks;

const failures = [];
function assert(cond, message) {
  if (!cond) failures.push(message);
}

assert(content.title === "Peter · Jason\u2019s Wish", "title");
assert(content.subtitle === "Composition practice · mobile phone ending", "subtitle");
assert(content.motto === "Study hard. Ask politely. Say thank you!", "motto");
assert(content.hub.includes("五關"), "hub gloss");
assert(content.version === "v1", "version");
assert(content.storageKey === "p6-peter-composition01-v1", "storage key");

const ids = content.modules.map((mod) => mod.id);
assert(ids.join() === "vocab,grammar,order,dialogue,write", "module order");

const hues = {
  vocab: "#0b5cab",
  grammar: "#0e8f7a",
  order: "#6c4ed4",
  dialogue: "#c45c26",
  write: "#e07a2f",
};
content.modules.forEach((mod) => {
  assert(mod.hue === hues[mod.id], `${mod.id} hue`);
  assert(/[\u4e00-\u9fff]/.test(mod.help), `${mod.id} help is Chinese`);
  assert(/[\u4e00-\u9fff]/.test(mod.blurb), `${mod.id} blurb is Chinese`);
  assert(mod.zh && mod.en, `${mod.id} labels`);
});

const glossKeys = [
  "classroom",
  "daydreaming",
  "answering questions",
  "patient",
  "examination",
  "o\u2019clock",
  "report card",
  "thumbs-up",
  "proud",
  "mobile phone",
  "reward",
  "wish",
  "played happily",
  "hard work",
  "while",
  "because",
  "a / an",
];
assert(glossKeys.every((key) => content.gloss[key]), "gloss map");
assert(content.gloss["mobile phone"] === "手提電話／手機", "phone gloss");
assert(content.gloss["o\u2019clock"] === "……點鐘", "oclock gloss");

function countItems(step) {
  if (step.kind === "mcq" || step.kind === "write" || step.kind === "writeShort") return 1;
  if (step.kind === "iconHunt" || step.kind === "pictureMatch" || step.kind === "bank" || step.kind === "fix" || step.kind === "order") {
    return (step.items || []).length;
  }
  if (step.kind === "guidedWrite") return (step.slots || []).length;
  return 0;
}

const expectedCounts = { vocab: 27, grammar: 17, order: 8, dialogue: 10, write: 6 };
content.modules.forEach((mod) => {
  const n = mod.steps.reduce((sum, step) => sum + countItems(step), 0);
  assert(n === expectedCounts[mod.id], `${mod.id} graded count ${n} !== ${expectedCounts[mod.id]}`);
  mod.steps.forEach((step) => {
    if (step.kind === "mcq") {
      assert(step.q && step.q.trim(), `question present: ${step.q}`);
      assert(/[\u4e00-\u9fff]/.test(step.why), `why Chinese: ${step.q}`);
      assert(!/[\u4e00-\u9fff]/.test(step.answer), `answer English: ${step.q}`);
      assert(step.options.includes(step.answer), `mcq option missing: ${step.q}`);
    }
    if (step.kind === "bank") {
      const need = {};
      step.items.forEach((item) => {
        (item.accept || [item.answer]).forEach((word) => {
          need[word] = Math.max(need[word] || 0, 1);
        });
        assert(!/[\u4e00-\u9fff]/.test(item.answer), `bank answer English ${item.id}`);
        assert(item.hint && item.hint.trim(), `bank hint present ${item.id}`);
      });
      const have = {};
      step.bank.forEach((word) => {
        have[word] = (have[word] || 0) + 1;
      });
      Object.entries(need).forEach(([word, count]) => {
        assert((have[word] || 0) >= count, `${mod.id} bank needs ${word}`);
      });
    }
  });
});

const vocab = content.modules.find((mod) => mod.id === "vocab");
const iconHunt = vocab.steps.find((step) => step.kind === "iconHunt");
assert(iconHunt.items.length === 8, "icon hunt 8");
const huntPairs = [
  ["課室", "classroom"],
  ["發白日夢", "daydreaming"],
  ["考試", "examination"],
  ["成績表", "report card"],
  ["豎起拇指", "thumbs-up"],
  ["手提電話／手機", "mobile phone"],
  ["感到驕傲", "proud"],
  ["……點鐘", "o\u2019clock"],
];
iconHunt.items.forEach((item, index) => {
  assert(item.say === huntPairs[index][0] && item.answer === huntPairs[index][1], `hunt ${index}`);
  assert(content.icons[item.answer], `icon for ${item.answer}`);
});

const match = vocab.steps.find((step) => step.kind === "pictureMatch");
assert(match.items.map((item) => item.answer).join("") === "ABCDEFGH", "picture letters");
assert(match.pictures.map((pic) => pic.label).join("|") === [
  "classroom",
  "daydreaming",
  "examination",
  "report card",
  "thumbs-up",
  "mobile phone",
  "proud",
  "o\u2019clock",
].join("|"), "picture labels");
match.items.forEach((item) => {
  assert(!/[\u4e00-\u9fff]/.test(item.sentence), "match sentence English");
  assert(/[\u4e00-\u9fff]/.test(item.why), "match why Chinese");
});
assert(match.items[3].sentence.includes("all A\u2019s"), "report card sentence");
assert(match.items[7].sentence.includes("eight"), "clock sentence");

const spell = vocab.steps.filter((step) => step.kind === "mcq").map((step) => step.answer);
assert(spell.join("|") === ["examination", "eight o\u2019clock", "answered"].join("|"), "spelling mcq");

const phraseBank = vocab.steps.find((step) => step.kind === "bank");
const phrases = Object.fromEntries(phraseBank.items.map((item) => [item.id, item.answer]));
assert(phrases.cls === "classroom", "classroom bank");
assert(phrases.exam === "examination", "exam bank");
assert(phrases.phone === "mobile phone", "phone bank");
assert(phrases.rew === "reward", "reward bank");

const grammar = content.modules.find((mod) => mod.id === "grammar");
const gAnswers = grammar.steps.filter((step) => step.kind === "mcq").map((step) => step.answer);
assert(gAnswers[0] === "I want a mobile phone.", "article mcq");
assert(gAnswers[1] === "It was because he wanted to play games.", "past because");
assert(gAnswers[2] === "was teaching / was answering", "while continuous");
assert(gAnswers[3] === "because" && gAnswers[4] === "while", "linkers");
assert(gAnswers[2].split(" / ").length === 2, "while option is one string");

const verbBank = grammar.steps.find((step) => step.kind === "bank");
const verbs = Object.fromEntries(verbBank.items.map((item) => [item.id, item.answer]));
assert(verbs.were === "were" && verbs.stud === "studied" && verbs.bring === "brought", "past start");
assert(verbs.show === "showed" && verbs.said === "said" && verbs.want === "wanted", "past mid");
assert(verbs.buy === "bought" && verbs.feel === "felt", "past end");
assert(verbBank.bank.includes("was") && verbBank.bank.includes("went"), "extra past chips");

const fix = grammar.steps.find((step) => step.kind === "fix");
assert(checks.answersMatch("I want a mobile phone", fix.items[0].answer), "fix phone");
assert(checks.answersMatch("He studied until eight o'clock.", fix.items[1].answer), "fix straight apostrophe");
assert(checks.answersMatch("He studied until eight o\u2019clock", fix.items[1].answer), "fix curly apostrophe");
assert(fix.items[2].answer === "for the examination", "fix exam");
assert(fix.items[3].answer === "It was because he wanted to play games.", "fix play");
assert(!checks.answersMatch("I want mobile phone.", fix.items[0].answer), "missing article fails");

const order = content.modules.find((mod) => mod.id === "order");
const orderStep = order.steps.find((step) => step.kind === "order");
assert(orderStep.items.length === 5, "five panels");
assert(orderStep.items[0].includes("Maths lesson"), "pic 1");
assert(orderStep.items[1].includes("eight o\u2019clock"), "pic 2 clock");
assert(orderStep.items[2].includes("report card"), "pic 3");
assert(orderStep.items[3].includes("a mobile phone"), "pic 4");
assert(orderStep.items[4].includes("thank you"), "pic 5");
const orderMcq = order.steps.filter((step) => step.kind === "mcq").map((step) => step.answer);
assert(orderMcq[0] === "Maths lesson in the classroom", "first paragraph");
assert(orderMcq[1] === "report card", "after a week");
assert(orderMcq[2] === "Dad gives the phone + Jason says thank you", "ending needs thanks");

const dialogue = content.modules.find((mod) => mod.id === "dialogue");
const talk = dialogue.steps.find((step) => step.kind === "bank");
const talkMap = Object.fromEntries(talk.items.map((item) => [item.id, item]));
assert(talkMap.show.accept.join() === "showed,brought", "showed or brought");
assert(talkMap.buy.accept.join() === "bought,gave", "bought or gave");
assert(talkMap.art.answer === "a", "article a");
assert(talkMap.thank.answer === "Thank", "Thank");
assert(talkMap.proud.answer === "proud" && talkMap.play.answer === "play", "proud and play");
const dMcq = dialogue.steps.filter((step) => step.kind === "mcq").map((step) => step.answer);
assert(dMcq[0] === "I want a mobile phone.", "dialogue article");
assert(dMcq[1] === "Well done, Jason. I\u2019m so proud of you.", "dad praise");
assert(dMcq[2] === "Thank you, Dad!", "thanks line");
const short = dialogue.steps.find((step) => step.kind === "writeShort");
assert(short.model.includes("a mobile phone"), "short model phone");
assert(short.model.includes("Well done"), "short model praise");
assert(short.prompt.includes("Pic 3") && short.prompt.includes("Pic 4"), "short prompt");
const marks = checks.dialogueOk(short.model);
assert(marks.praise && marks.phone && marks.reason, "model passes dialogue check");

const write = content.modules.find((mod) => mod.id === "write");
const guided = write.steps.find((step) => step.kind === "guidedWrite");
assert(guided.slots.map((slot) => slot.id).join("") === "ABCDE", "five slots");
assert(guided.slots[0].guide === "成績表＋爸爸感受", "slot A guide");
assert(guided.slots[2].sample.includes("a mobile phone"), "slot C sample");
assert(checks.guidedOk("C", guided.slots[2].sample), "slot C check");
assert(!checks.guidedOk("C", "I want mobile phone"), "slot C needs article");
guided.slots.forEach((slot) => {
  assert(checks.guidedOk(slot.id, slot.sample), `sample ${slot.id} passes its own check`);
});

const essay = write.steps.find((step) => step.kind === "write");
assert(essay.model.includes("After a week, Jason"), "model continues the story");
assert(essay.model.includes("eight o\u2019clock"), "model clock");
assert(essay.model.includes("a mobile phone"), "model phone");
assert(essay.model.includes("Thank you, Dad!"), "model thanks");
assert(!essay.model.includes("nine o'clock"), "one clock");
const essayChecks = checks.compositionChecks(essay.model);
assert(essayChecks.every((item) => item.ok), `model essay checks: ${essayChecks.filter((item) => !item.ok).map((item) => item.label).join(", ")}`);
const words = checks.wordCount(essay.model);
assert(words >= 130 && words <= 180, `model word count ${words}`);
const thin = checks.compositionChecks("After a week, Jason was happy.");
assert(thin.some((item) => !item.ok), "thin ending does not pass every check");
const badClock = checks.compositionChecks("After a week, Jason wanted a mobile phone at nine o'clock and said, \"Thank you.\" He showed the report card.");
assert(badClock.find((item) => item.label === "One clock time only").ok === false, "second clock fails");

const list = write.steps.find((step) => step.kind === "checklist");
assert(list.items.length === 7, "seven checks");
assert(list.items[1] === "a mobile phone", "checklist article");
assert(list.items[6].includes("150 words"), "checklist length");
assert(essayChecks.map((item) => item.label).join("|") === list.items.join("|"), "auto checks match the checklist labels");

const game = fs.readFileSync(path.join(root, "js/game.js"), "utf8");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const sw = fs.readFileSync(path.join(root, "sw.js"), "utf8");
const manifest = fs.readFileSync(path.join(root, "manifest.webmanifest"), "utf8");
assert(game.includes("p6-peter-composition01-v1") || game.includes("content.storageKey"), "game stores progress");
assert(sw.includes("p6-peter-composition01-v1"), "service worker cache v1");
assert(game.includes("範例／教師用"), "teacher samples are labelled");
assert(game.includes("function showModel"), "reveal gate");
assert(game.includes("hiddenNote"), "hidden until submit or teacher");
assert(!game.includes("best present ever"), "model essay is not hardcoded in the game shell");
assert(!html.includes("best present ever"), "model essay is not in the HTML");
assert(!html.includes(".pdf"), "no worksheet PDF");
assert(html.includes("manifest.webmanifest"), "manifest link");
assert(html.includes("js/content.js") && html.includes("js/game.js"), "scripts");
assert(manifest.includes("Jason"), "manifest name");
assert(fs.existsSync(path.join(root, ".nojekyll")), "nojekyll for Pages later");
assert(fs.existsSync(path.join(root, "icons/icon-192.png")), "icon png");
assert(fs.existsSync(path.join(root, "icons/favicon.svg")), "favicon");

const leaked = fs.readdirSync(root).filter((name) => name.toLowerCase().endsWith(".pdf"));
assert(leaked.length === 0, "no PDF scans in the repo root");

if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}
console.log(`ok · ${words} words in the teacher model · graded ${Object.values(expectedCounts).reduce((a, b) => a + b, 0)}`);
