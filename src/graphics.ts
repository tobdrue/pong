/* Graphics */

export const canvas = document.getElementById('stage') as HTMLCanvasElement;
export const context = canvas.getContext('2d')!;
context.fillStyle = 'blue';

export const PADDLE_WIDTH = 100;
export const PADDLE_HEIGHT = 20;

export const BALL_RADIUS = 10;

export function drawTitle() {
    context.textAlign = 'center';
    context.font = '24px Courier New';
    context.fillText('rxjs pong', canvas.width / 2, canvas.height / 2 - 24);
}

export function drawControls() {
    context.textAlign = 'center';
    context.font = '16px Courier New';
    context.fillText('press [<] and [>] to play', canvas.width / 2, canvas.height / 2);
}

export function drawGameOver(text) {
    context.clearRect(canvas.width / 4, canvas.height / 3, canvas.width / 2, canvas.height / 3);
    context.textAlign = 'center';
    context.font = '24px Courier New';
    context.fillText(text, canvas.width / 2, canvas.height / 2);
}

export function drawAuthor() {
    context.textAlign = 'center';
    context.font = '16px Courier New';
    context.fillText('for XTIASO rxjs workshop', canvas.width / 2, canvas.height / 2 + 24);
}

export function drawScore(score) {
    context.textAlign = 'left';
    context.font = '16px Courier New';
    context.fillText(score, 3, 16);
}

export function drawPaddle(position) {
    context.beginPath();
    context.rect(
        position - PADDLE_WIDTH / 2,
        context.canvas.height - PADDLE_HEIGHT,
        PADDLE_WIDTH,
        PADDLE_HEIGHT
    );
    context.fill();
    context.closePath();
}

export function drawBall(ball) {
    context.beginPath();
    context.arc(ball.position.x, ball.position.y, BALL_RADIUS, 0, Math.PI * 2);
    context.fill();
    context.closePath();
}
