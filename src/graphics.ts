/* Graphics */
import {BALL_RADIUS, canvas, context, PADDLE_HEIGHT, PADDLE_WIDTH} from "./game-config";


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

export function drawAuthor() {
    context.textAlign = 'center';
    context.font = '16px Courier New';
    context.fillText('for XTIASO rxjs workshop', canvas.width / 2, canvas.height / 2 + 24);
}

export function drawScore(score) {
    context.textAlign = 'left';
    context.font = '16px Courier New';
    context.fillText(score.player1, 3, 16);
    context.fillText(score.player2, canvas.width - 13, 16);
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
    context.rect(20, 6, canvas.width - 40, 5
    );
    context.fill();
    context.closePath();

    context.beginPath();
    context.rect(5, canvas.height - 11, canvas.width - 10, 5
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
