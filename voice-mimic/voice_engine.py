"""
Voice engine for VoiceMimic.

Two interchangeable backends, picked automatically at startup:

1. "xtts"  -> Coqui XTTS-v2. Real zero-shot voice cloning. Give it a short
              reference clip of a voice and some text, and it speaks the text
              in that voice. Needs the `coqui-tts` (or `TTS`) package + a model
              download (~1.8 GB) and is much happier on a GPU.

2. "say"   -> macOS built-in `say` command. Always available on a Mac, needs
              no downloads. It does NOT clone the uploaded voice, but it lets
              the whole app work end-to-end and produces real speech. The user
              can pick a system voice + speed, and we nudge the rate/pitch using
              a feature estimate of the uploaded clip. Honest fallback.

The Flask app talks to `VoiceEngine.synthesize(...)` and reads `.info` /
`.list_voices()` to drive the UI.
"""

from __future__ import annotations

import os
import re
import shutil
import subprocess
import tempfile
import wave
from dataclasses import dataclass

# Let unsupported MPS ops silently fall back to CPU instead of erroring, so we
# can use Apple-Silicon GPU acceleration for XTTS without hitting missing kernels.
os.environ.setdefault("PYTORCH_ENABLE_MPS_FALLBACK", "1")

# Languages XTTS-v2 supports (code -> label shown in the UI).
XTTS_LANGUAGES = [
    ("en", "English"), ("es", "Spanish"), ("fr", "French"), ("de", "German"),
    ("it", "Italian"), ("pt", "Portuguese"), ("pl", "Polish"), ("tr", "Turkish"),
    ("ru", "Russian"), ("nl", "Dutch"), ("cs", "Czech"), ("ar", "Arabic"),
    ("zh-cn", "Chinese"), ("ja", "Japanese"), ("hu", "Hungarian"),
    ("ko", "Korean"), ("hi", "Hindi"),
]


@dataclass
class SynthResult:
    output_path: str
    backend: str
    cloned: bool
    note: str


class VoiceEngine:
    def __init__(self) -> None:
        self.backend = "none"
        self.cloning = False
        self.device = "cpu"
        self._tts = None
        self._voices_cache = None
        self._load()

    # ------------------------------------------------------------------ setup
    def _load(self) -> None:
        if self._try_load_xtts():
            self.backend = "xtts"
            self.cloning = True
            return
        if shutil.which("say"):
            self.backend = "say"
            self.cloning = False
            return
        self.backend = "none"
        self.cloning = False

    def _try_load_xtts(self) -> bool:
        if os.environ.get("VOICEMIMIC_DISABLE_XTTS") == "1":
            return False
        # Auto-accept the Coqui model license so loading never blocks on an
        # interactive prompt (the model is downloaded once, then cached).
        os.environ.setdefault("COQUI_TOS_AGREED", "1")
        try:
            from TTS.api import TTS  # type: ignore

            self.device = self._select_device()
            model = "tts_models/multilingual/multi-dataset/xtts_v2"
            print(f"[voice_engine] loading XTTS-v2 on device={self.device}")
            self._tts = TTS(model).to(self.device)
            return True
        except Exception as exc:  # noqa: BLE001
            print(f"[voice_engine] XTTS unavailable, falling back: {exc}")
            return False

    @staticmethod
    def _select_device() -> str:
        """Pick a compute device. Override with VOICEMIMIC_DEVICE=cpu|mps|cuda.

        'auto' (default) prefers a real CUDA GPU, else CPU. It deliberately does
        NOT auto-select Apple-Silicon MPS: XTTS has many ops without MPS kernels,
        so MPS falls back to CPU op-by-op and ends up *slower* than plain CPU
        (benchmarked ~13s vs ~11s per sentence on an M-series). You can still
        force it with VOICEMIMIC_DEVICE=mps to experiment.
        """
        pref = os.environ.get("VOICEMIMIC_DEVICE", "auto").lower().strip()
        try:
            import torch  # type: ignore
        except Exception:
            return "cpu"

        def has_mps() -> bool:
            return bool(getattr(torch.backends, "mps", None)) and torch.backends.mps.is_available()

        if pref in ("cpu", "cuda", "mps"):
            if pref == "cuda" and torch.cuda.is_available():
                return "cuda"
            if pref == "mps" and has_mps():
                return "mps"
            if pref == "cpu":
                return "cpu"
            print(f"[voice_engine] requested device '{pref}' unavailable; using CPU")
            return "cpu"

        # auto: CUDA is a genuine speedup; MPS is not, so skip it.
        if torch.cuda.is_available():
            return "cuda"
        return "cpu"

    @property
    def info(self) -> dict:
        labels = {
            "xtts": "Coqui XTTS-v2 (real voice cloning)",
            "say": "macOS system voice (tone-matched approximation)",
            "none": "No TTS backend available",
        }
        dev_label = {"cuda": "CUDA GPU", "mps": "Apple GPU (MPS)", "cpu": "CPU"}
        return {
            "backend": self.backend,
            "label": labels.get(self.backend, self.backend),
            "cloning": self.cloning,
            "device": self.device if self.backend == "xtts" else None,
            "device_label": dev_label.get(self.device) if self.backend == "xtts" else None,
        }

    # ----------------------------------------------------------- UI metadata
    def list_voices(self) -> dict:
        """Return picker options for the current backend.

        xtts -> language list (the clone *is* the uploaded voice).
        say  -> system voices grouped by language + language list.
        """
        if self.backend == "xtts":
            return {
                "mode": "language",
                "languages": [{"code": c, "label": l} for c, l in XTTS_LANGUAGES],
                "voices": [],
            }
        return {
            "mode": "voice",
            "languages": [],
            "voices": self._say_voices(),
        }

    def _say_voices(self) -> list:
        if self._voices_cache is not None:
            return self._voices_cache
        novelty = {
            "albert", "bad news", "bahh", "bells", "boing", "bubbles", "cellos",
            "good news", "jester", "organ", "superstar", "trinoids", "whisper",
            "wobble", "zarvox", "junior", "ralph", "kathy", "fred",
        }
        voices: list = []
        try:
            out = subprocess.run(
                ["say", "-v", "?"], capture_output=True, text=True, check=True
            ).stdout
            # lines: "Name            xx_YY    # sample sentence"
            pat = re.compile(r"^(.+?)\s{2,}([a-z]{2}_[A-Z]{2})\s+#")
            seen = set()
            for line in out.splitlines():
                m = pat.match(line)
                if not m:
                    continue
                name, locale = m.group(1).strip(), m.group(2)
                # skip the joke/novelty voices (they list multiple per name)
                if "(" in name:
                    continue
                key = name.lower()
                if key in seen or key in novelty:
                    continue
                seen.add(key)
                voices.append({"name": name, "locale": locale,
                               "lang": locale.split("_")[0]})
            voices.sort(key=lambda v: (v["lang"] != "en", v["lang"], v["name"]))
        except Exception as exc:  # noqa: BLE001
            print(f"[voice_engine] could not list say voices: {exc}")
        self._voices_cache = voices
        return voices

    # -------------------------------------------------------------- synthesis
    def synthesize(
        self,
        text: str,
        reference_wav: str,
        output_path: str,
        language: str = "en",
        speed: float = 1.0,
        voice: str | None = None,
    ) -> SynthResult:
        speed = max(0.5, min(2.0, float(speed or 1.0)))

        # Trim the reference down to its cleanest ~10s of speech for a better,
        # faster clone. Falls back to the original clip if trimming isn't possible.
        ref, ref_is_temp = self.prepare_reference(reference_wav)
        try:
            if self.backend == "xtts":
                return self._synth_xtts(text, ref, output_path, language, speed)
            if self.backend == "say":
                return self._synth_say(text, ref, output_path, speed, voice)
            raise RuntimeError(
                "No speech backend is available. Install `coqui-tts` for real "
                "cloning, or run on macOS for the `say` fallback."
            )
        finally:
            if ref_is_temp and os.path.exists(ref):
                try:
                    os.remove(ref)
                except OSError:
                    pass

    # ------------------------------------------------------- reference trimming
    def prepare_reference(self, wav_path: str, target_sec: float = 10.0):
        """Return (path, is_temp): the cleanest ~`target_sec` window of speech.

        Trims leading/trailing silence and, for long clips, slides a window to
        pick the most speech-energetic segment. Returns the original path if the
        clip is already short or if trimming can't run (returns is_temp=False
        so the caller won't delete the user's normalised upload).
        """
        if os.environ.get("VOICEMIMIC_DISABLE_TRIM") == "1":
            return wav_path, False
        try:
            with wave.open(wav_path, "rb") as wf:
                fr = wf.getframerate()
                n = wf.getnframes()
                ch = wf.getnchannels()
                sw = wf.getsampwidth()
                raw = wf.readframes(n)
            if sw != 2 or fr <= 0 or n == 0:
                return wav_path, False

            import array
            samples = array.array("h")
            samples.frombytes(raw)
            if ch > 1:  # downmix to mono by taking the first channel
                samples = samples[0::ch]

            total_sec = len(samples) / fr
            # Short and already reasonable? Leave it alone.
            if total_sec <= target_sec + 0.5:
                start, end = self._speech_bounds(samples, fr)
                if end - start < 1:  # trimming found nothing useful
                    return wav_path, False
                seg = samples[start:end]
            else:
                seg = self._best_window(samples, fr, target_sec)

            if len(seg) < fr:  # < 1s of usable audio; don't risk it
                return wav_path, False

            out = tempfile.NamedTemporaryFile(suffix="_ref.wav", delete=False).name
            with wave.open(out, "wb") as wo:
                wo.setnchannels(1)
                wo.setsampwidth(2)
                wo.setframerate(fr)
                wo.writeframes(seg.tobytes())
            return out, True
        except Exception as exc:  # noqa: BLE001
            print(f"[voice_engine] reference trim skipped: {exc}")
            return wav_path, False

    @staticmethod
    def _frame_energies(samples, fr, hop_ms=30):
        hop = max(1, int(fr * hop_ms / 1000))
        energies = []
        for i in range(0, len(samples), hop):
            chunk = samples[i:i + hop]
            if not chunk:
                break
            # mean-abs amplitude of the frame (cheap RMS proxy)
            energies.append(sum(abs(s) for s in chunk) / len(chunk))
        return energies, hop

    @classmethod
    def _speech_bounds(cls, samples, fr):
        energies, hop = cls._frame_energies(samples, fr)
        if not energies:
            return 0, len(samples)
        thresh = max(energies) * 0.10
        active = [i for i, e in enumerate(energies) if e >= thresh]
        if not active:
            return 0, len(samples)
        start = max(0, active[0] * hop - hop)
        end = min(len(samples), (active[-1] + 2) * hop)
        return start, end

    @classmethod
    def _best_window(cls, samples, fr, target_sec):
        energies, hop = cls._frame_energies(samples, fr)
        win_frames = max(1, int(target_sec * 1000 / 30))
        if win_frames >= len(energies):
            return samples
        # Sliding sum of frame energy; pick the highest-energy window.
        window = sum(energies[:win_frames])
        best_sum, best_i = window, 0
        for i in range(1, len(energies) - win_frames + 1):
            window += energies[i + win_frames - 1] - energies[i - 1]
            if window > best_sum:
                best_sum, best_i = window, i
        s = best_i * hop
        e = min(len(samples), (best_i + win_frames) * hop)
        return samples[s:e]

    def _synth_xtts(self, text, reference_wav, output_path, language, speed) -> SynthResult:
        self._tts.tts_to_file(
            text=text,
            speaker_wav=reference_wav,
            language=language,
            speed=speed,
            file_path=output_path,
        )
        return SynthResult(output_path, "xtts", True,
                           "Generated with XTTS-v2 zero-shot voice cloning.")

    def _synth_say(self, text, reference_wav, output_path, speed, voice) -> SynthResult:
        est_rate, est_voice = self._estimate_say_params(reference_wav)
        chosen_voice = voice or est_voice
        rate = int(est_rate * speed)

        aiff = tempfile.NamedTemporaryFile(suffix=".aiff", delete=False).name
        try:
            cmd = ["say", "-r", str(rate)]
            if chosen_voice:
                cmd += ["-v", chosen_voice]
            cmd += ["-o", aiff, text]
            subprocess.run(cmd, check=True, capture_output=True)

            if shutil.which("ffmpeg"):
                subprocess.run(["ffmpeg", "-y", "-i", aiff, output_path],
                               check=True, capture_output=True)
            else:
                subprocess.run(["afconvert", "-f", "WAVE", "-d", "LEI16",
                                aiff, output_path], check=True, capture_output=True)
        finally:
            if os.path.exists(aiff):
                os.remove(aiff)

        vlabel = chosen_voice or "default"
        return SynthResult(
            output_path, "say", False,
            f"Cloning model not installed — used system voice '{vlabel}' at "
            f"{int(speed*100)}% speed. Install coqui-tts for true cloning.",
        )

    # ------------------------------------------------------------- estimation
    def _estimate_say_params(self, reference_wav: str):
        rate, voice = 175, None
        try:
            with wave.open(reference_wav, "rb") as wf:
                framerate = wf.getframerate()
                nframes = wf.getnframes()
                nchan = wf.getnchannels()
                width = wf.getsampwidth()
                duration = nframes / float(framerate or 1)
                raw = wf.readframes(min(nframes, framerate * 5))
            pitch = self._zero_crossing_pitch(raw, width, nchan, framerate)
            if pitch:
                voice = "Samantha" if pitch >= 165 else "Daniel"
            if duration and duration > 0:
                rate = 165 if duration > 4 else 185
        except Exception as exc:  # noqa: BLE001
            print(f"[voice_engine] param estimate failed: {exc}")
        return rate, voice

    @staticmethod
    def _zero_crossing_pitch(raw, width, nchan, framerate):
        if width != 2 or not raw:
            return None
        import array

        samples = array.array("h")
        samples.frombytes(raw)
        if nchan > 1:
            samples = samples[::nchan]
        if not samples:
            return None
        crossings, prev = 0, samples[0]
        for s in samples:
            if (prev < 0 <= s) or (prev > 0 >= s):
                crossings += 1
            prev = s
        seconds = len(samples) / float(framerate or 1)
        if seconds <= 0:
            return None
        return (crossings / 2.0) / seconds
