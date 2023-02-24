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
        paddleLeft: paddleCollisionPlayer1(player1Paddle, ball),
        paddleRight: paddleCollisionPlayer2(player2Paddle, ball),
        goalLeft: goalLeft(ball),
        goalRight: goalRight(ball),
        borderTop: topBorderHit(ball),
        borderBottom: bottomBorderHit(ball)
    };

    // Ball hits top or bottom
    if (topBorderHit(ball)) {
        let ballDirectionY = Math.abs(ball.direction.y);
        ball.direction.y = ballDirectionY;
    } else if (bottomBorderHit(ball)) {
        let ballDirectionY = Math.abs(ball.direction.y);
        ball.direction.y = -ballDirectionY;
    }

    let collisionPlayer1 = paddleCollisionPlayer1(player1Paddle, ball);
    let collisionPlayer2 = paddleCollisionPlayer2(player2Paddle, ball);
    let ballDirectionX = Math.abs(ball.direction.x);
    if (collisionPlayer1) {
        ball.direction.x = ballDirectionX;
    } else if (collisionPlayer2) {
        ball.direction.x = -ballDirectionX;
    }

// Ball hits goal
    if (goalLeft(ball) || goalRight(ball)) {
       ball.position.x = canvas.width / 2;
        ball.position.y = canvas.height / 2;
    }
    return collisions;
}
