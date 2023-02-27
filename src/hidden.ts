import {
    combineLatest,
    distinctUntilChanged,
    filter,
    fromEvent,
    map,
    Observable,
    pipe,
    scan,
    share,
    shareReplay,
    startWith,
    take,
    UnaryFunction,
    withLatestFrom
} from "rxjs";
import { Scores, Tick, ticker$ } from "./app";
import { Ball } from "./ball";
import { calculateCollisions, Collisions } from "./collisions";
import { canvas, POINTS_TO_WIN } from "./game-config";
import { calcPaddleDirection, calculateNextPaddlePosition } from "./paddle";

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
                return calculateCollisions(playerOnePositionY, playerTwoPositionY, ball)
            }),
            share()
        );

type PaddlePositionPipe = () => UnaryFunction<Observable<readonly [Tick, number]>, Observable<number>>;

export function paddlePositionObservable(keyUpEvent: string, keyDownEvent: string, keyEvents$: Observable<Event>) {
    const currentPaddleDirectionPlayer1: Observable<number> = keyEvents$.pipe(
        pipe(
            filter((event: KeyboardEvent) => event.key == keyUpEvent || event.key == keyDownEvent),
            map((event: KeyboardEvent) => calcPaddleDirection(event, keyUpEvent, keyDownEvent)),
            distinctUntilChanged()
        )
    );
    const nextPaddlePosition: PaddlePositionPipe = () =>
        pipe(
            scan((position: number, [ticker, direction]: [Tick, number]) => {
                return calculateNextPaddlePosition(position, direction, ticker.timeSinceLastFrame);
            }, canvas.height / 2),
            startWith(canvas.height / 2),
            distinctUntilChanged(),
            shareReplay(1)
        );
    return ticker$
        .pipe(
            withLatestFrom(currentPaddleDirectionPlayer1),
            nextPaddlePosition()
        );
}

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
