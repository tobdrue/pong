import {BALL_RADIUS, canvas} from "./game-config";
import {gameFieldPadding} from "./graphics";
import {Ball} from "./app";

export function areGameFieldBoardersHit(ball: Ball) {
    return ball.position.y < BALL_RADIUS + gameFieldPadding || ball.position.y > canvas.height - BALL_RADIUS - gameFieldPadding;
}

export function goalLeft(ball: Ball) {
    return ball.position.x <= BALL_RADIUS;
}

export function goalRight(ball: Ball) {
    return ball.position.x > canvas.width - BALL_RADIUS;
}
