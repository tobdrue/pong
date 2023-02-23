import { AudioContext } from 'standardized-audio-context-mock';
// @ts-ignore
global.AudioContext = AudioContext;

document.body.innerHTML = `<canvas id="stage" width="100" height="100"></canvas>`;
