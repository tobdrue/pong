const audio = new window.AudioContext();

/**
 * creates a beeping sound
 * @param key frequency to beep in
 * @param duration in ms
 */
export const beep = (key: number, duration = 100) =>
{
    let oscillator = audio.createOscillator();
    oscillator.connect(audio.destination);
    oscillator.type = 'square';

// https://en.wikipedia.org/wiki/Piano_key_frequencies
    oscillator.frequency.value = Math.pow(2, (key - 49) / 12) * 440;

    oscillator.start();
    oscillator.stop(audio.currentTime + duration / 1000);
}
