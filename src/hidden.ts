import { combineLatest, filter, fromEvent, map, Observable, scan, share, take } from "rxjs";
import { Scores } from "./app";
import { Ball, calculateNewBallAfterCollision } from "./ball";
import { calculateCollisions, Collisions } from "./collisions";
import { POINTS_TO_WIN } from "./game-config";

export const createScoringObservable = (collisions$: Observable<Collisions>) =>
    collisions$.pipe(
        scan((oldScores, collision) => ({
                player1: collision.goalRight ? oldScores.player1 + 1 : oldScores.player1,
                player2: collision.goalLeft ? oldScores.player2 + 1 : oldScores.player2
            }), {player1: 0, player2: 0} as Scores
        ),
        share()
    );

export const createCollisionsObservable = (playerOnePositionY$: Observable<number>, playerTwoPositionY$: Observable<number>, ball$: Observable<Ball>) =>
    combineLatest([playerOnePositionY$, playerTwoPositionY$, ball$])
        .pipe(
            map(([playerOnePositionY, playerTwoPositionY, ball]) => {
                const collision = calculateCollisions(playerOnePositionY, playerTwoPositionY, ball);
                // TODO circular dependency: remove
                const newBall = calculateNewBallAfterCollision(collision, ball);
                ball.position = newBall.position;
                ball.direction = newBall.direction;

                return collision
            }),
            share()
        );

export const createGameStartObservable = () => fromEvent(document, 'keydown').pipe(
    filter((event: KeyboardEvent) => event?.key == " "),
    map(() => {}),
    take(1),
    share()
);

export const createGameOverObservable = (scores$: Observable<Scores>) => {
    return scores$.pipe(
        filter((score) => score.player1 >= POINTS_TO_WIN || score.player2 >= POINTS_TO_WIN),
        take(1)
    );
}
