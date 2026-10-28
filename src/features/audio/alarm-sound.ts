export type AlarmSoundType = "bell" | "digital" | "marimba" | "zen";

export const ALARM_SOUND_OPTIONS: ReadonlyArray<{
  type: AlarmSoundType;
  label: string;
  description: string;
}> = [
  { type: "bell", label: "🔔 Lonceng Resonan", description: "Lonceng gema yang jernih dan keras" },
  { type: "digital", label: "⏰ Digital Beep", description: "Alarm elektronik modern yang terdengar jelas" },
  { type: "marimba", label: "🎶 Melodi Marimba", description: "Nada kayu ceria dan menenangkan" },
  { type: "zen", label: "🧘 Tibetan Singing Bowl", description: "Gong meditatif dengan getaran panjang" },
];

function getAudioContextConstructor(): typeof AudioContext | null {
  if (typeof window === "undefined") return null;
  return (
    window.AudioContext ||
    (window as typeof window & { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext ||
    null
  );
}

let activeAlarmContext: AudioContext | null = null;
let activeStopTimer: number | null = null;

export function stopAlarmSound(): void {
  if (activeStopTimer !== null) {
    window.clearTimeout(activeStopTimer);
    activeStopTimer = null;
  }
  if (activeAlarmContext) {
    try {
      void activeAlarmContext.close();
    } catch {
      // Ignore already closed context
    }
    activeAlarmContext = null;
  }
}

/**
 * Plays a loud, multi-second alarm sound when a Pomodoro or break ends.
 * Lasts ~6-8 seconds to ensure user clearly hears it from across the room.
 */
export function playAlarmSound(type: AlarmSoundType = "bell", repeat = false): () => void {
  stopAlarmSound();

  const AudioContextClass = getAudioContextConstructor();
  if (!AudioContextClass) return () => {};

  const context = new AudioContextClass();
  activeAlarmContext = context;

  const now = context.currentTime + 0.05;
  const loopCount = repeat ? 4 : 3;

  switch (type) {
    case "digital": {
      // 3 or 4 iterations of double-pulse high beep (880Hz & 1174Hz)
      for (let loop = 0; loop < loopCount; loop += 1) {
        const loopStart = now + loop * 1.6;
        [0, 0.22, 0.44].forEach((pulseOffset) => {
          const pulseStart = loopStart + pulseOffset;
          const osc = context.createOscillator();
          const gain = context.createGain();
          osc.type = "square";
          osc.frequency.setValueAtTime(987.77, pulseStart); // B5
          osc.frequency.setValueAtTime(1318.51, pulseStart + 0.08); // E6

          gain.gain.setValueAtTime(0.001, pulseStart);
          gain.gain.linearRampToValueAtTime(0.4, pulseStart + 0.015);
          gain.gain.exponentialRampToValueAtTime(0.001, pulseStart + 0.16);

          osc.connect(gain);
          gain.connect(context.destination);
          osc.start(pulseStart);
          osc.stop(pulseStart + 0.17);
        });
      }
      break;
    }

    case "marimba": {
      // Cheerful melodic sequence across 3 iterations
      const melody = [523.25, 659.25, 783.99, 1046.5, 1318.51]; // C5, E5, G5, C6, E6
      for (let loop = 0; loop < loopCount; loop += 1) {
        const loopStart = now + loop * 1.8;
        melody.forEach((freq, idx) => {
          const noteStart = loopStart + idx * 0.16;
          const osc = context.createOscillator();
          const gain = context.createGain();
          osc.type = "sine";
          osc.frequency.value = freq;

          gain.gain.setValueAtTime(0.001, noteStart);
          gain.gain.linearRampToValueAtTime(0.65, noteStart + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.001, noteStart + 0.55);

          osc.connect(gain);
          gain.connect(context.destination);
          osc.start(noteStart);
          osc.stop(noteStart + 0.6);
        });
      }
      break;
    }

    case "zen": {
      // Singing bowl with rich harmonic overtone and gentle vibrato
      for (let loop = 0; loop < (repeat ? 3 : 2); loop += 1) {
        const loopStart = now + loop * 3.2;
        [216, 432, 648].forEach((freq, idx) => {
          const osc = context.createOscillator();
          const gain = context.createGain();
          osc.type = "sine";
          osc.frequency.value = freq;

          const lfo = context.createOscillator();
          const lfoGain = context.createGain();
          lfo.frequency.value = 4.5;
          lfoGain.gain.value = 3;
          lfo.connect(osc.frequency);
          lfo.start(loopStart);

          const peak = idx === 0 ? 0.75 : 0.35;
          gain.gain.setValueAtTime(0.001, loopStart);
          gain.gain.linearRampToValueAtTime(peak, loopStart + 0.08);
          gain.gain.exponentialRampToValueAtTime(0.0001, loopStart + 3.0);

          osc.connect(gain);
          gain.connect(context.destination);
          osc.start(loopStart);
          osc.stop(loopStart + 3.1);
          lfo.stop(loopStart + 3.1);
        });
      }
      break;
    }

    case "bell":
    default: {
      // Loud, clear resonant bell strikes with multi-harmonics
      for (let loop = 0; loop < loopCount; loop += 1) {
        const strikeTime = now + loop * 1.9;
        const freqs = [659.25, 987.77, 1318.51, 1975.53]; // E5, B5, E6, B6
        freqs.forEach((freq, idx) => {
          const osc = context.createOscillator();
          const gain = context.createGain();
          osc.type = idx % 2 === 0 ? "sine" : "triangle";
          osc.frequency.value = freq;

          const peak = idx === 0 ? 0.75 : idx === 1 ? 0.55 : 0.35;
          gain.gain.setValueAtTime(0.001, strikeTime);
          gain.gain.linearRampToValueAtTime(peak, strikeTime + 0.03);
          gain.gain.exponentialRampToValueAtTime(0.0005, strikeTime + 1.8);

          osc.connect(gain);
          gain.connect(context.destination);
          osc.start(strikeTime);
          osc.stop(strikeTime + 1.85);
        });
      }
      break;
    }
  }

  void context.resume();

  const totalDuration = loopCount * 2000 + 1000;
  activeStopTimer = window.setTimeout(() => {
    stopAlarmSound();
  }, totalDuration);

  return stopAlarmSound;
}

/**
 * Plays a pleasant, two-tone notification chime for calendar event reminders.
 * Designed to be non-intrusive yet distinct (e.g. 10m before or when event starts).
 */
export function playCalendarReminderChime(): void {
  const AudioContextClass = getAudioContextConstructor();
  if (!AudioContextClass) return;
  try {
    const context = new AudioContextClass();
    const now = context.currentTime + 0.03;
    const notes = [
      { freq: 659.25, time: now, dur: 0.35, gain: 0.22 }, // E5
      { freq: 987.77, time: now + 0.18, dur: 0.55, gain: 0.28 }, // B5
    ];
    notes.forEach(({ freq, time, dur, gain }) => {
      const osc = context.createOscillator();
      const gainNode = context.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, time);
      gainNode.gain.setValueAtTime(0.001, time);
      gainNode.gain.linearRampToValueAtTime(gain, time + 0.025);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, time + dur);
      osc.connect(gainNode);
      gainNode.connect(context.destination);
      osc.start(time);
      osc.stop(time + dur + 0.05);
    });
    void context.resume();
    window.setTimeout(() => {
      try {
        void context.close();
      } catch {}
    }, 1200);
  } catch {}
}

