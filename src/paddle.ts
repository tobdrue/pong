import {canvas, PADDLE_HEIGHT, PADDLE_SPEED} from "./game-config";
import {gameFieldPadding} from "./graphics";

/**
 *
 * @param currentYPosition
 * @param direction
 * @param timeSinceLastFrame
 * @returns the new position of the paddle
 */
export function calculateNextPaddlePosition(currentYPosition: number, direction: number, timeSinceLastFrame: number) {
    let next = currentYPosition + direction * timeSinceLastFrame * PADDLE_SPEED;
    return Math.max(Math.min(next, canvas.height - PADDLE_HEIGHT / 2 - gameFieldPadding), PADDLE_HEIGHT / 2 + gameFieldPadding);
}

/**
 * @param event
 * @param keyUp
 * @param keyDown
 * @returns -1 if keyUp is press, 1 if keyDown is pressed, 0 if neither
 */
export function calcPaddleDirection(event: KeyboardEvent, keyUp: string, keyDown: string): -1 | 0 | 1 {
    if (event.type === 'keyup') {
        return 0;
    }

    switch (event.key) {
        case keyUp:
            return -1;
        case keyDown:
            return 1;
        default:
            return 0;
    }
}

