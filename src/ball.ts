import { BALL_SPEED, canvas } from "./game-config";
import { Tick } from "./app";

export type Ball = { position: { x: number, y: number }, direction: { x: number, y: number } };

export const initialBall = {
    position: {x: canvas.width / 2, y: canvas.height / 2},
    direction: {x: 1, y: 1}
}

export function calculateNewBallPosition(ball: Ball, ticker: Tick): { x: number, y: number } {
    return {
        x: ball.position.x + ball.direction.x * ticker.timeSinceLastFrame * BALL_SPEED,
        y: ball.position.y + ball.direction.y * ticker.timeSinceLastFrame * BALL_SPEED
    }
}
