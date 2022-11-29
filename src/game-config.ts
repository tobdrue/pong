export const canvas = document.getElementById('stage') as HTMLCanvasElement;
export const context = canvas.getContext('2d')!;


context.fillStyle = 'grey';
export const PADDLE_WIDTH = 10;
export const PADDLE_HEIGHT = 50;
export const PADDLE_SPEED = 10 / 1000; // 10px/s

export const TICKER_INTERVAL = 17;
export const BALL_RADIUS = 10;

export const BALL_SPEED = 2 / 1000; // 5px/s

