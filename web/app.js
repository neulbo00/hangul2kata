import { convert } from "../src/index.js";

const $ = (id) => document.getElementById(id);
const source = $("source");
const result = $("result");
const STORAGE_KEY = "hangul2kata.dictionary.v1";
let dictionary = {};

try {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) dictionary = JSON.parse(saved);
} catch {
  dictionary = {};
}

function saveDictionary() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dictionary));
    return true;
  } catch {
    alert("브라우저 저장 공간에 접근할 수 없습니다. 이번 세션에서만 사용할 수 있습니다.");
    return false;
  }
}

function renderDictionary() {
  const list = $("dictList");
  list.replaceChildren();
  Object.entries(dictionary).forEach(([key, value]) => {
    const li = document.createElement("li");
    li.textContent = key + " → " + value + " ";
    const remove = document.createElement("button");
    remove.textContent = "삭제";
    remove.className = "subtle";
    remove.addEventListener("click", () => {
      delete dictionary[key];
      saveDictionary();
      renderDictionary();
      update();
    });
    li.append(remove);
    list.append(li);
  });
}

function update() {
  const options = {
    final_style: $("finalStyle").value,
    boundary_mode: $("boundaryMode").value,
    ng_style: $("ngStyle").value,
    dictionary
  };
  result.value = convert(source.value, options);
  $("charCount").textContent = Array.from(source.value).length + "자";
}

let inputTimer;
source.addEventListener("input", () => {
  clearTimeout(inputTimer);
  inputTimer = setTimeout(update, 150);
});
["finalStyle","boundaryMode","ngStyle"].forEach(id => $(id).addEventListener("change", update));
$("clearBtn").addEventListener("click", () => { source.value = ""; update(); source.focus(); });
$("copyBtn").addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(result.value);
    $("copyBtn").textContent = "복사 완료";
    setTimeout(() => $("copyBtn").textContent = "결과 복사", 1200);
  } catch {
    result.select();
    document.execCommand("copy");
  }
});
$("addDict").addEventListener("click", () => {
  const key = $("dictKey").value.trim();
  const value = $("dictValue").value.trim();
  if (!key || !value) return;
  dictionary[key] = value;
  saveDictionary();
  $("dictKey").value = "";
  $("dictValue").value = "";
  renderDictionary();
  update();
});
$("exportDict").addEventListener("click", () => {
  const blob = new Blob([JSON.stringify(dictionary, null, 2)], {type:"application/json"});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = "hangul2kata-dictionary.json"; a.click();
  URL.revokeObjectURL(url);
});
$("importDict").addEventListener("change", async (event) => {
  const file = event.target.files?.[0];
  if (!file) return;
  try {
    const parsed = JSON.parse(await file.text());
    if (!parsed || Array.isArray(parsed) || typeof parsed !== "object" ||
        Object.entries(parsed).some(([k,v]) => typeof k !== "string" || typeof v !== "string")) {
      throw new Error("invalid dictionary");
    }
    dictionary = parsed;
    saveDictionary();
    renderDictionary();
    update();
  } catch {
    alert("올바른 사전 JSON 파일이 아닙니다.");
  }
  event.target.value = "";
});
renderDictionary();
update();
