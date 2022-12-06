import {BALL_SPEED, canvas} from "./game-config";
import {Ball, Tick} from "./app";

export const initialBall = {
    position: {x: canvas.width / 2, y: canvas.height / 2},
    direction: {x: 1, y: 1}
}

export function calculateNewBallPosition(ball: Ball, ticker: Tick): {x: number, y: number} {
    return {
        x: ball.position.x + ball.direction.x * ticker.timeSinceLastFrame * BALL_SPEED,
        y: ball.position.y + ball.direction.y * ticker.timeSinceLastFrame * BALL_SPEED
    }
}
