import {Sound} from "./app";

export const canvas = document.getElementById('stage') as HTMLCanvasElement;
export const context = canvas.getContext('2d')!;

export const POINTS_TO_WIN = 5;

context.fillStyle = 'grey';
export const PADDLE_WIDTH = 10;
export const PADDLE_HEIGHT = 50;
export const PADDLE_SPEED = 300 / 1000; // px/s

const FPS = 60;
export const TICKER_INTERVAL = Math.ceil(1000 / FPS);
export const BALL_RADIUS = 10;

export const BALL_SPEED = 150 / 1000; // px/s

export const victorySound: Sound[] = [
    {tone: 35, duration: 500},
    {tone: 38, duration: 500},
    {tone: 45, duration: 500},
    {tone: 43, duration: 500},
    {tone: 45, duration: 500}
];
export const PADDLE_SOUND = {tone: 40, duration: 100};
export const WALL_SOUND = {tone: 45, duration: 100};
export const GOAL_SOUND = {tone: 40, duration: 100};
