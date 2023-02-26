import {BALL_SPEED, canvas} from "./game-config";
import {Tick} from "./app";
import {Collisions} from "./collisions";

export type Ball = { position: { x: number, y: number }, direction: { x: number, y: number } };

export const initialBall = {
    position: {x: canvas.width / 2, y: canvas.height / 2},
    direction: {x: 1, y: 1}
}

/**
 *
 * @param ball current ball
 * @param tick elapsed time
 * @returns the new position of the ball
 */
export function calculateNewBallPosition(ball: Ball, tick: Tick): { x: number, y: number } {
    return {
        x: ball.position.x + ball.direction.x * tick.timeSinceLastFrame * BALL_SPEED,
        y: ball.position.y + ball.direction.y * tick.timeSinceLastFrame * BALL_SPEED
    }
}

/**
 * After a collision the direction of the ball may be change
 * and if it is a goal the position is reset
 * @param collision collision since the last tick
 * @param ball
 */
export function calculateNewBallAfterCollision(collision: Collisions, ball: Ball): Ball {
    let directionY;
    if (collision.borderTop) {
        directionY = 1;
    } else if (collision.borderBottom) {
        directionY = -1;
    } else {
        directionY = ball.direction.y
    }

    let directionX;
    if (collision.paddleLeft) {
        directionX = 1;
    } else if (collision.paddleRight) {
        directionX = -1;
    } else {
        directionX = ball.direction.x
    }

    const positionY = collision.goalLeft || collision.goalRight ? canvas.height / 2 : ball.position.y
    const positionX = collision.goalLeft || collision.goalRight ? canvas.width / 2 : ball.position.x;

    return {
        direction: {
            y: directionY,
            x: directionX
        },
        position: {
            y: positionY,
            x: positionX
        }
    };
}
