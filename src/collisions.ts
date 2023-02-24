import { BALL_RADIUS, canvas, PADDLE_HEIGHT, PADDLE_WIDTH } from "./game-config";
import { gameFieldPadding } from "./graphics";
import { Ball } from "./ball";

export type Collisions = { paddle: boolean, goalLeft: boolean, goalRight: boolean, wall: boolean };

export function gameFieldBoarderHits(ball: Ball): 'up' | 'down' | 'none' {
    if (ball.position.y < (BALL_RADIUS + gameFieldPadding)) {
        return 'up';
    }
    if (ball.position.y > (canvas.height - BALL_RADIUS - gameFieldPadding)) {
        return 'down';
    }
    return 'none';
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
    let boarderHits = gameFieldBoarderHits(ball);
    if (boarderHits != 'none') {
        collisions.wall = true;

        let ballDirectionY = Math.abs(ball.direction.x);
        if (boarderHits === "up") {
            ball.direction.y = ballDirectionY;
        } else if (boarderHits === "down") {
            ball.direction.y = -ballDirectionY;
        }
    }

    let collisionPlayer1 = paddleCollisionPlayer1(player1Paddle, ball);
    let collisionPlayer2 = paddleCollisionPlayer2(player2Paddle, ball);
    collisions.paddle = collisionPlayer1 || collisionPlayer2;
    let ballDirectionX = Math.abs(ball.direction.x);
    if (collisionPlayer1) {
        ball.direction.x = ballDirectionX;
    } else if (collisionPlayer2) {
        ball.direction.x = -ballDirectionX;
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
