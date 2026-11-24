"""只用 Python 標準函式庫產生兩段原創 PCM WAV；無外部素材。"""
from pathlib import Path
import math
import random
import struct
import wave

ROOT = Path(__file__).resolve().parent
RATE = 22050


def save(name, duration, sample):
    pcm = bytearray()
    for index in range(round(RATE * duration)):
        value = max(-1, min(1, sample(index / RATE)))
        pcm.extend(struct.pack("<h", round(value * 24000)))
    with wave.open(str(ROOT / name), "wb") as output:
        output.setparams((1, 2, RATE, 0, "NONE", "not compressed"))
        output.writeframes(pcm)
    print(f"{name}: {duration:.2f}s, mono PCM16, {RATE}Hz")


noise = random.Random(2026)


def hit(t):
    # 輕短的籃網沙沙聲，加上兩個上行音符。
    swish = noise.uniform(-1, 1) * math.exp(-t * 30) * 0.18
    tone = 660 if t < 0.12 else 880
    envelope = min(1, t / 0.008) * max(0, 1 - t / 0.36) ** 2
    return swish + math.sin(math.tau * tone * t) * envelope * 0.35


def end(t):
    # 兩段短促的柔和終場提示，淡入淡出以避免爆音。
    phase = t % 0.34
    envelope = min(1, phase / 0.015) * max(0, 1 - phase / 0.27)
    return (math.sin(math.tau * 220 * t) + math.sin(math.tau * 330 * t) * 0.25) * envelope * 0.32


if __name__ == "__main__":
    save("shot-hit.wav", 0.36, hit)
    save("round-end.wav", 0.68, end)
