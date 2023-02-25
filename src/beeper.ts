import {Sound} from "./app";

const audio = new window.AudioContext();

/**
 * creates a beeping sound
 */
export const beep = (sound: Sound) => {
    const gainNode = audio.createGain();
    gainNode.gain.value = 0.01;
    gainNode.connect(audio.destination);

    const oscillator = audio.createOscillator();
    oscillator.connect(gainNode);
    oscillator.type = 'square';

    // https://en.wikipedia.org/wiki/Piano_key_frequencies
    oscillator.frequency.value = Math.pow(2, (sound.tone - 49) / 12) * 440;

    oscillator.start();
    oscillator.stop(audio.currentTime + sound.duration / 1000);
}
