import {BALL_RADIUS, canvas, PADDLE_HEIGHT, PADDLE_WIDTH} from "./game-config";
import {gameFieldPadding} from "./graphics";
import {Ball} from "./ball";

export type Collisions = { paddleLeft: boolean, paddleRight: boolean, goalLeft: boolean, goalRight: boolean, borderTop: boolean, borderBottom: boolean };

export function topBorderHit(ball: Ball): boolean {
    return ball.position.y < (BALL_RADIUS + gameFieldPadding);
}

export function bottomBorderHit(ball: Ball): boolean {
    return ball.position.y > (canvas.height - BALL_RADIUS - gameFieldPadding);
}

export function goalLeft(ball: Ball) {
    return ball.position.x <= BALL_RADIUS;
}

export function goalRight(ball: Ball) {
    return ball.position.x > canvas.width - BALL_RADIUS;
}

function paddleCollisionPlayer1(paddle, ball) {
    return ball.position.x < PADDLE_WIDTH + BALL_RADIUS / 2
        && ball.position.y > paddle - PADDLE_HEIGHT / 2
        && ball.position.y < paddle + PADDLE_HEIGHT / 2;
}

function paddleCollisionPlayer2(paddle, ball) {
    return ball.position.x > canvas.width - PADDLE_WIDTH - BALL_RADIUS / 2
        && ball.position.y > paddle - PADDLE_HEIGHT / 2
        && ball.position.y < paddle + PADDLE_HEIGHT / 2;
}

export function calculateCollisions(player1Paddle, player2Paddle, ball): Collisions {
    return {
        paddleLeft: paddleCollisionPlayer1(player1Paddle, ball),
        paddleRight: paddleCollisionPlayer2(player2Paddle, ball),
        goalLeft: goalLeft(ball),
        goalRight: goalRight(ball),
        borderTop: topBorderHit(ball),
        borderBottom: bottomBorderHit(ball)
    };
}
