import { convert } from "../src/index.js";
import { toRubyHtml } from "../src/ruby.js";

const $ = (id) => document.getElementById(id);
const source = $("source");
const result = $("result");
const STORAGE_KEY = "hangul2kata.dictionary.v1";
const ARTIST_DICTIONARY_FILES = [
  "./dictionaries/VERIVERY.json",
  "./dictionaries/EVNNE.json",
  "./dictionaries/tripleS.json"
];
let dictionary = {};
let artistDictionary = {};

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

async function loadArtistDictionaries() {
  const loaded = await Promise.allSettled(ARTIST_DICTIONARY_FILES.map(async (path) => {
    const response = await fetch(path);
    if (!response.ok) throw new Error(`사전 파일을 불러오지 못했습니다: ${path}`);
    const data = await response.json();
    if (!data || typeof data.entries !== "object" || Array.isArray(data.entries) ||
        Object.entries(data.entries).some(([key, value]) => typeof key !== "string" || typeof value !== "string")) {
      throw new Error(`사전 파일 형식이 올바르지 않습니다: ${path}`);
    }
    return data.entries;
  }));

  artistDictionary = {};
  let successCount = 0;
  for (const item of loaded) {
    if (item.status === "fulfilled") {
      Object.assign(artistDictionary, item.value);
      successCount += 1;
    }
  }

  const status = $("artistDictionaryStatus");
  if (successCount === ARTIST_DICTIONARY_FILES.length) {
    status.textContent = `${successCount}개 그룹 사전 적용됨`;
    status.classList.add("is-ready");
  } else {
    status.textContent = `${successCount}/${ARTIST_DICTIONARY_FILES.length}개 사전 적용`;
    status.classList.add("is-partial");
  }
  update();
}

function getOptions() {
  return {
    final_style: $("finalStyle").value,
    dictionary: { ...artistDictionary, ...dictionary }
  };
}

function renderDictionary() {
  const list = $("dictList");
  list.replaceChildren();
  Object.entries(dictionary).forEach(([key, value]) => {
    const li = document.createElement("li");
    li.append(document.createTextNode(key + " → " + value + " "));
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
  const options = getOptions();
  result.value = convert(source.value, options);
  const rubyPreview = $("rubyPreview");
  if (source.value) {
    rubyPreview.innerHTML = toRubyHtml(source.value, options);
  } else {
    rubyPreview.textContent = "한글 원문을 입력하면 여기에 루비 미리보기가 표시됩니다.";
  }
  $("charCount").textContent = Array.from(source.value).length + "자";
}

let inputTimer;
source.addEventListener("input", () => {
  clearTimeout(inputTimer);
  inputTimer = setTimeout(update, 150);
});
$("finalStyle").addEventListener("change", update);
document.querySelectorAll("[data-sample]").forEach((button) => {
  button.addEventListener("click", () => {
    source.value = button.dataset.sample || "";
    update();
    source.focus();
  });
});
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
$("copyRubyHtml").addEventListener("click", async () => {
  const button = $("copyRubyHtml");
  try {
    await navigator.clipboard.writeText(toRubyHtml(source.value, getOptions()));
    button.textContent = "HTML 복사 완료";
    setTimeout(() => button.textContent = "HTML 코드 복사", 1400);
  } catch {
    alert("클립보드에 복사하지 못했습니다. 브라우저의 클립보드 권한을 확인해 주세요.");
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
loadArtistDictionaries().catch(() => {
  $("artistDictionaryStatus").textContent = "아티스트 사전 불러오기 실패";
  $("artistDictionaryStatus").classList.add("is-partial");
});
