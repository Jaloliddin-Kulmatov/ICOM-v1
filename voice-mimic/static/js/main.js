// VoiceMimic frontend logic

const $ = (id) => document.getElementById(id);

const dropzone = $("dropzone");
const fileInput = $("fileInput");
const browseBtn = $("browseBtn");
const recBtn = $("recBtn");
const recTimer = $("recTimer");
const refPreview = $("refPreview");
const refName = $("refName");
const refAudio = $("refAudio");
const clearRef = $("clearRef");
const waveCanvas = $("wave");
const textInput = $("textInput");
const charCount = $("charCount");
const generateBtn = $("generateBtn");
const errorBox = $("error");
const result = $("result");
const outAudio = $("outAudio");
const outWave = $("outWave");
const playBtn = $("playBtn");
const resultNote = $("resultNote");
const resultBadge = $("resultBadge");
const downloadBtn = $("downloadBtn");
const regenBtn = $("regenBtn");
const voiceSelect = $("voiceSelect");
const voiceField = $("voiceField");
const langSelect = $("langSelect");
const langField = $("langField");
const pickerLabel = $("pickerLabel");
const speedRange = $("speedRange");
const speedVal = $("speedVal");
const toast = $("toast");
const historyCard = $("historyCard");
const historyList = $("historyList");
const clearHistory = $("clearHistory");
const statCount = $("statCount");

let currentFile = null;
let mediaRecorder = null;
let recChunks = [];
let recInterval = null;
let recSeconds = 0;
let history = [];

/* ---------- helpers ---------- */
function refreshButton() {
  generateBtn.disabled = !(currentFile && textInput.value.trim().length);
}
function showError(msg) {
  errorBox.textContent = msg;
  errorBox.classList.remove("hidden");
  showToast(msg, "err");
}
function clearError() { errorBox.classList.add("hidden"); }

let toastTimer;
function showToast(msg, kind = "ok") {
  toast.textContent = msg;
  toast.className = `toast show ${kind}`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (toast.className = "toast"), 3200);
}

function setRef(fileOrBlob, name) {
  currentFile = fileOrBlob;
  if (!currentFile.name) {
    try { Object.defineProperty(currentFile, "name", { value: name }); } catch (_) {}
  }
  refName.textContent = name;
  refAudio.src = URL.createObjectURL(fileOrBlob);
  refPreview.classList.remove("hidden");
  drawWaveform(fileOrBlob, waveCanvas);
  refreshButton();
}

/* ---------- waveform (static, from a blob) ---------- */
async function drawWaveform(blob, canvas, color = true) {
  try {
    const ctx = canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;
    const w = (canvas.width = canvas.offsetWidth * dpr);
    const h = (canvas.height = canvas.offsetHeight * dpr);
    ctx.clearRect(0, 0, w, h);

    const arrBuf = await blob.arrayBuffer();
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const decoded = await audioCtx.decodeAudioData(arrBuf);
    const data = decoded.getChannelData(0);
    const bars = 96;
    const step = Math.floor(data.length / bars);
    const gap = w / bars;
    for (let i = 0; i < bars; i++) {
      let peak = 0;
      for (let j = 0; j < step; j += 50) {
        const v = Math.abs(data[i * step + j] || 0);
        if (v > peak) peak = v;
      }
      const barH = Math.max(2 * dpr, peak * h * 0.9);
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, "#8b5cf6");
      grad.addColorStop(1, "#22d3ee");
      ctx.fillStyle = grad;
      ctx.fillRect(i * gap, (h - barH) / 2, gap * 0.6, barH);
    }
    audioCtx.close();
  } catch (e) { console.warn("waveform failed", e); }
}

/* ---------- live output visualiser ---------- */
let outCtx, analyser, rafId, sourceNode;
function setupOutputVisualiser() {
  if (outCtx) return;
  outCtx = new (window.AudioContext || window.webkitAudioContext)();
  sourceNode = outCtx.createMediaElementSource(outAudio);
  analyser = outCtx.createAnalyser();
  analyser.fftSize = 128;
  sourceNode.connect(analyser);
  analyser.connect(outCtx.destination);
}
function renderOutWave() {
  const ctx = outWave.getContext("2d");
  const dpr = window.devicePixelRatio || 1;
  const w = (outWave.width = outWave.offsetWidth * dpr);
  const h = (outWave.height = outWave.offsetHeight * dpr);
  const bins = analyser.frequencyBinCount;
  const arr = new Uint8Array(bins);
  analyser.getByteFrequencyData(arr);
  ctx.clearRect(0, 0, w, h);
  const gap = w / bins;
  for (let i = 0; i < bins; i++) {
    const barH = Math.max(2 * dpr, (arr[i] / 255) * h);
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, "#22d3ee");
    grad.addColorStop(1, "#8b5cf6");
    ctx.fillStyle = grad;
    ctx.fillRect(i * gap, (h - barH) / 2, gap * 0.65, barH);
  }
  rafId = requestAnimationFrame(renderOutWave);
}

/* ---------- load backend voices / languages ---------- */
async function loadOptions() {
  try {
    const res = await fetch("/api/voices");
    const data = await res.json();
    if (data.mode === "voice") {
      // demo mode: system voices, hide separate language picker
      pickerLabel.textContent = "Voice";
      langField.classList.add("hidden");
      voiceSelect.innerHTML =
        `<option value="">Auto (match my clip)</option>` +
        data.voices
          .map((v) => `<option value="${v.name}">${v.name} · ${v.locale}</option>`)
          .join("");
    } else {
      // cloning mode: the voice is the upload; offer language only
      voiceField.classList.add("hidden");
      langSelect.innerHTML = data.languages
        .map((l) => `<option value="${l.code}">${l.label}</option>`)
        .join("");
    }
  } catch (e) {
    voiceField.classList.add("hidden");
    langField.classList.add("hidden");
  }
}
loadOptions();

/* ---------- file upload ---------- */
browseBtn.addEventListener("click", (e) => { e.stopPropagation(); fileInput.click(); });
dropzone.addEventListener("click", (e) => { if (e.target !== browseBtn) fileInput.click(); });
fileInput.addEventListener("change", () => {
  if (fileInput.files.length) { clearError(); setRef(fileInput.files[0], fileInput.files[0].name); }
});
["dragenter", "dragover"].forEach((ev) =>
  dropzone.addEventListener(ev, (e) => { e.preventDefault(); dropzone.classList.add("drag"); }));
["dragleave", "drop"].forEach((ev) =>
  dropzone.addEventListener(ev, (e) => { e.preventDefault(); dropzone.classList.remove("drag"); }));
dropzone.addEventListener("drop", (e) => {
  const f = e.dataTransfer.files[0];
  if (f && f.type.startsWith("audio")) { clearError(); setRef(f, f.name); }
  else showError("Please drop an audio file.");
});
clearRef.addEventListener("click", () => {
  currentFile = null; fileInput.value = ""; refAudio.src = "";
  refPreview.classList.add("hidden"); refreshButton();
});

/* ---------- recording ---------- */
recBtn.addEventListener("click", async () => {
  if (mediaRecorder && mediaRecorder.state === "recording") { mediaRecorder.stop(); return; }
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    recChunks = [];
    mediaRecorder = new MediaRecorder(stream);
    mediaRecorder.ondataavailable = (e) => e.data.size && recChunks.push(e.data);
    mediaRecorder.onstop = () => {
      stream.getTracks().forEach((t) => t.stop());
      clearInterval(recInterval);
      recBtn.classList.remove("recording");
      recBtn.querySelector(".rec-label").textContent = "Record from mic";
      const mime = mediaRecorder.mimeType || "audio/webm";
      const ext = mime.includes("ogg") ? "ogg" : "webm";
      clearError();
      setRef(new Blob(recChunks, { type: mime }), `recording.${ext}`);
      showToast("Recording captured", "ok");
    };
    mediaRecorder.start();
    recSeconds = 0; recTimer.textContent = "00:00";
    recInterval = setInterval(() => {
      recSeconds++;
      recTimer.textContent =
        `${String(Math.floor(recSeconds / 60)).padStart(2, "0")}:${String(recSeconds % 60).padStart(2, "0")}`;
      if (recSeconds >= 30) mediaRecorder.stop();
    }, 1000);
    recBtn.classList.add("recording");
    recBtn.querySelector(".rec-label").textContent = "Stop recording";
  } catch (e) { showError("Microphone access denied or unavailable."); }
});

/* ---------- text ---------- */
textInput.addEventListener("input", () => { charCount.textContent = textInput.value.length; refreshButton(); });
document.querySelectorAll(".chip").forEach((c) =>
  c.addEventListener("click", () => {
    textInput.value = c.dataset.text;
    charCount.textContent = textInput.value.length;
    refreshButton();
  }));

/* ---------- speed ---------- */
speedRange.addEventListener("input", () => { speedVal.textContent = `${parseFloat(speedRange.value).toFixed(1)}×`; });

/* ---------- output player ---------- */
playBtn.addEventListener("click", () => {
  if (outAudio.paused) { setupOutputVisualiser(); outCtx.resume(); outAudio.play(); }
  else outAudio.pause();
});
outAudio.addEventListener("play", () => { playBtn.textContent = "⏸"; if (analyser) renderOutWave(); });
outAudio.addEventListener("pause", () => { playBtn.textContent = "▶"; cancelAnimationFrame(rafId); });
outAudio.addEventListener("ended", () => { playBtn.textContent = "▶"; cancelAnimationFrame(rafId); });

/* ---------- history ---------- */
function addHistory(entry) {
  history.unshift(entry);
  statCount.textContent = history.length;
  renderHistory();
}
function renderHistory() {
  if (!history.length) { historyCard.classList.add("hidden"); return; }
  historyCard.classList.remove("hidden");
  historyList.innerHTML = history
    .map(
      (h, i) => `
      <li class="history-item">
        <button class="hi-play" data-i="${i}" aria-label="Play">▶</button>
        <div class="hi-body">
          <div class="hi-text">${escapeHtml(h.text)}</div>
          <div class="hi-meta">${h.cloned ? "Cloned" : "Demo"} · ${h.time}</div>
        </div>
        <a class="hi-dl" href="${h.url}" download>⬇</a>
      </li>`
    )
    .join("");
  historyList.querySelectorAll(".hi-play").forEach((b) =>
    b.addEventListener("click", () => {
      const a = new Audio(history[b.dataset.i].url);
      a.play();
    }));
}
clearHistory.addEventListener("click", () => {
  history = []; statCount.textContent = 0; renderHistory();
  showToast("History cleared", "ok");
});
function escapeHtml(s) {
  return s.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

/* ---------- generate ---------- */
async function generate() {
  if (!currentFile) return;
  clearError();
  result.classList.add("hidden");
  const label = generateBtn.querySelector(".btn-label");
  const spinner = generateBtn.querySelector(".spinner");
  generateBtn.disabled = true;
  label.textContent = "Generating…";
  spinner.hidden = false;

  const fd = new FormData();
  fd.append("text", textInput.value.trim());
  fd.append("audio", currentFile, currentFile.name || "clip.webm");
  fd.append("speed", speedRange.value);
  if (!voiceField.classList.contains("hidden")) fd.append("voice", voiceSelect.value);
  if (!langField.classList.contains("hidden")) fd.append("language", langSelect.value);

  try {
    const res = await fetch("/api/clone", { method: "POST", body: fd });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Generation failed.");

    outAudio.src = data.url;
    outAudio.load();
    downloadBtn.href = data.url;
    resultNote.textContent = data.note || "";
    if (data.cloned) { resultBadge.textContent = "Cloned voice"; resultBadge.className = "result-badge cloned"; }
    else { resultBadge.textContent = "Demo voice"; resultBadge.className = "result-badge demo"; }
    result.classList.remove("hidden");
    result.scrollIntoView({ behavior: "smooth", block: "center" });

    // draw a static waveform of the output too
    try {
      const blob = await (await fetch(data.url)).blob();
      drawWaveform(blob, outWave);
    } catch (_) {}

    addHistory({
      text: textInput.value.trim(),
      url: data.url,
      cloned: data.cloned,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    });
    showToast("Voice generated ✨", "ok");
  } catch (e) {
    showError(e.message);
  } finally {
    generateBtn.disabled = false;
    label.textContent = "Generate voice";
    spinner.hidden = true;
    refreshButton();
  }
}
generateBtn.addEventListener("click", generate);
regenBtn.addEventListener("click", generate);
