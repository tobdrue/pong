import { BALL_RADIUS, canvas, PADDLE_HEIGHT, PADDLE_WIDTH } from "./game-config";
import {gameFieldPadding} from "./graphics";
import { Ball, Collisions } from "./app";

export function areGameFieldBoardersHit(ball: Ball) {
    return ball.position.y < BALL_RADIUS + gameFieldPadding || ball.position.y > canvas.height - BALL_RADIUS - gameFieldPadding;
}

export function goalLeft(ball: Ball) {
    return ball.position.x <= BALL_RADIUS;
}

export function goalRight(ball: Ball) {
    return ball.position.x > canvas.width - BALL_RADIUS;
}

/* collisions */
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
    const collisions = {
        paddle: false,
        goalLeft: false,
        goalRight: false,
        wall: false
    };

    // Ball hits top or bottom
    if (areGameFieldBoardersHit(ball)) {
        ball.direction.y = -ball.direction.y;
        collisions.wall = true;
    }

    collisions.paddle = paddleCollisionPlayer1(player1Paddle, ball) || paddleCollisionPlayer2(player2Paddle, ball);
    if (collisions.paddle) {
        ball.direction.x = -ball.direction.x;
    }

// Ball hits goal
    if (goalLeft(ball) || goalRight(ball)) {
        if (goalLeft(ball)) {
            collisions.goalLeft = true;
        } else if (goalRight(ball)) {
            collisions.goalRight = true;
        }

        ball.position.x = canvas.width / 2;
        ball.position.y = canvas.height / 2;
    }

    return collisions;
}
