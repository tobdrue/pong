export const canvas = document.getElementById('stage') as HTMLCanvasElement;
export const context = canvas.getContext('2d')!;


context.fillStyle = 'grey';
export const PADDLE_WIDTH = 10;
export const PADDLE_HEIGHT = 50;
export const PADDLE_SPEED = 2;

export const TICKER_INTERVAL = 17;
export const BALL_RADIUS = 10;

export const BALL_SPEED = 60;
export const INITIAL_OBJECTS = {
    ball: {
        position: {
            x: canvas.width / 2,
            y: canvas.height / 2
        },
        direction: {
            x: 2,
            y: 2
        }
    },
    collisions: {
        paddle: false,
        floor: false,
        wall: false,
        ceiling: false,
        brick: false
    },
    score: {
        player1:0,
        player2: 0
    }
};
