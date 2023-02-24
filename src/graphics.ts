/* Graphics */
import {BALL_RADIUS, canvas, context, PADDLE_HEIGHT, PADDLE_WIDTH} from "./game-config";
import {Scores} from "./app";

export const gameFieldPadding = 11;

export function clearCanvas() {
    context.clearRect(0, 0, canvas.width, canvas.height);
}

export function drawTitle() {
    context.textAlign = 'center';
    context.font = '24px Courier New';
    context.fillText('rxjs pong', canvas.width / 2, canvas.height / 2 - 34);
}

export function drawControls() {
    context.textAlign = 'center';
    context.font = '16px Courier New';
    context.fillText('Player1: press [w] and [s] to play', canvas.width / 2, canvas.height / 2 + 20);
    context.fillText('Player2: press [▲] and [▼] to play', canvas.width / 2, canvas.height / 2 + 44);
    context.fillText('Press [SPACE BAR] to start', canvas.width / 2, canvas.height / 2 + 80);
}

export function drawAuthor() {
    context.textAlign = 'center';
    context.font = '16px Courier New';
    context.fillText('for XITASO rxjs workshop', canvas.width / 2, canvas.height / 2 - 10);
}

export function drawGameOver(text) {
    context.clearRect(canvas.width / 4, canvas.height / 3, canvas.width / 2, canvas.height / 3);
    context.textAlign = 'center';
    context.font = '24px Courier New';
    context.fillText(text, canvas.width / 2, canvas.height / 2);
}

export function drawScores(score: Scores) {
    context.textAlign = 'left';
    context.font = '16px Courier New';

    context.fillText(score.player1.toString(), 3, 16);
    context.fillText(score.player2.toString(), canvas.width - 13, 16);
}

export function clearScores(){
    context.clearRect(3, 0, 16, 16);
    context.clearRect(canvas.width - 13, 0, 10, 16);
}


export function drawPaddle(position, player: 1 | 2) {
    context.beginPath();
    context.rect(
        player === 1 ? 0 : context.canvas.width - PADDLE_WIDTH,
        position - PADDLE_HEIGHT / 2,
        PADDLE_WIDTH,
        PADDLE_HEIGHT
    );
    context.fill();
    context.closePath();
}

export function drawField() {
    context.beginPath();
    const boarderHeight = 5;
    context.rect(20, gameFieldPadding - boarderHeight, canvas.width - 40, boarderHeight
    );
    context.fill();
    context.closePath();

    context.beginPath();
    context.rect(5, canvas.height - gameFieldPadding, canvas.width - 10, boarderHeight
    );
    context.fill();
    context.closePath();

    for (let i = 6; i < canvas.height - 16; i+= 25){
        context.beginPath();
        context.rect(canvas.width/2 - 1, i, 2, 15
        );
        context.fill();
        context.closePath();
    }
}

export function drawBall(ball) {
    context.beginPath();
    context.arc(ball.position.x, ball.position.y, BALL_RADIUS, 0, Math.PI * 2);
    context.fill();
    context.closePath();
}
export function update([paddleLeft, paddleRight, ball, score]) {
    clearCanvas();
    drawPaddle(paddleLeft, 1);
    drawPaddle(paddleRight, 2);
    drawBall(ball);
    drawScores(score);
    drawField();
}
