# 🎙️ VoiceMimic

Upload (or record) a short voice clip, type some text, fine-tune the delivery,
and VoiceMimic speaks your text **in that voice**. Flask backend + a polished
single-page frontend.

![mode](https://img.shields.io/badge/cloning-XTTS--v2-8b5cf6) ![fallback](https://img.shields.io/badge/fallback-macOS%20say-22d3ee)

## Features
- 🎤 **Upload or record** a reference clip (drag-drop + live mic, with a waveform)
- ✍️ **Type any text** (up to 1000 chars) with quick sample chips
- 🎛️ **Tune delivery** — pick a voice/language and a 0.5×–2× speed
- 📊 **Animated output player** with a live frequency visualiser
- 🕑 **Session history** — replay or download every clip you've made
- 🔔 Toast notifications + responsive, mobile-friendly layout

## How it works
The backend auto-selects the best available speech engine at startup:

| Backend | What it does | Requires |
|---|---|---|
| **XTTS-v2** | Real zero-shot voice cloning — output sounds like the uploaded voice; pick the language | `coqui-tts` + model download (~2 GB), GPU recommended |
| **macOS `say`** | Demo fallback — real speech using a chosen system voice, rate/pitch nudged toward your clip (not true cloning) | macOS (built in) |

The UI shows a **green "Cloning engine live"** pill on XTTS, or a yellow
**"Demo mode"** pill on the fallback — so you always know what you're hearing.

## Quick start (real cloning)
```bash
cd voice-mimic
./setup.sh     # one-time: builds the venv + downloads XTTS-v2 (~1.9 GB)
./run.sh       # starts on http://localhost:5001 (first load ~15s)
```
`setup.sh` creates the venv at `~/.venvs/voicemimic` — **outside iCloud on
purpose**, so the multi-GB model and thousands of package files aren't synced
or evicted. Needs Python 3.12 (`brew install python@3.12`).

Force the lightweight demo voice even with XTTS installed:
`VOICEMIMIC_DISABLE_XTTS=1 ./run.sh`

### Tuning knobs (env vars)
| Var | Default | Effect |
|---|---|---|
| `VOICEMIMIC_DEVICE` | `auto` | `cpu` / `mps` / `cuda`. **auto = CUDA if present, else CPU.** MPS is *not* auto-selected: XTTS lacks MPS kernels for many ops, so it falls back op-by-op and ends up slower than CPU (benchmarked ~13s vs ~11s/sentence on M-series). Force `mps` to experiment. |
| `VOICEMIMIC_DISABLE_TRIM` | unset | Set `1` to skip reference auto-trimming and clone the whole clip. |

### Reference auto-trimming
Every uploaded clip is analysed and trimmed to its **cleanest ~10 seconds of
speech** before cloning — leading/trailing silence is removed and, for long
clips, the most speech-energetic 10s window is chosen. This improves speaker
similarity and keeps generation fast. Pure-stdlib, no extra deps.

### Why the version pins?
XTTS is fussy about its dependencies (all handled by `setup.sh`):
- **transformers `>=4.57,<5`** — 5.x dropped symbols XTTS still imports.
- **torch/torchaudio `2.8.0`** — 2.9+ forces the `torchcodec` backend, which
  needs system FFmpeg; 2.8 uses soundfile instead.

> Note: the preview/dev-server launcher may kill the app before the ~2 GB model
> finishes loading. Start it with `./run.sh` (or `python app.py`) directly.

## Project layout
```
voice-mimic/
├── app.py              # Flask routes: /, /api/status, /api/voices, /api/clone, /outputs
├── voice_engine.py     # pluggable engine (XTTS -> say fallback) + voice/lang listing
├── templates/index.html
├── static/css/style.css
├── static/js/main.js   # drag-drop, mic, waveform, visualiser, history, fetch
├── uploads/  outputs/  # working dirs (gitignored)
└── requirements.txt
```

## API
- `POST /api/clone` — multipart: `audio` (file) + `text`, optional `language`, `voice`, `speed`. Returns `{ url, backend, cloned, note }`.
- `GET /api/voices` — picker options: `{ mode, languages, voices }`.
- `GET /api/status` — `{ backend, label, cloning }`.

## Notes
- Max upload 25 MB; max text 1000 chars.
- Audio is normalised to WAV via `ffmpeg` if present, else macOS `afconvert`.
- Only use voices you have permission to clone.
