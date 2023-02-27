import {
    combineLatest,
    concatMap,
    delay,
    distinctUntilChanged,
    filter,
    from,
    fromEvent,
    map,
    merge,
    mergeMap,
    Observable,
    of,
    sampleTime,
    scan,
    share,
    startWith,
    Subject,
    switchMap,
    takeUntil,
    withLatestFrom,
} from "rxjs";
import { drawGameOver, drawWelcome, update } from "./graphics";
import { GOAL_SOUND, PADDLE_SOUND, TICKER_INTERVAL, victorySound, WALL_SOUND } from "./game-config";
import { beep } from "./beeper";
import { Ball, calculateNewBall, calculateNewBallAfterCollision, initialBall } from "./ball";
import {
    createCollisionsObservable,
    createGameOverObservable,
    createGameStartObservable,
    createScoringObservable,
    paddlePositionObservable
} from "./hidden";
import { createGameTicker } from "./game-ticker";

drawWelcome();

export type Scores = { player1: number, player2: number };
export type Sound = { tone: number, duration: number };
export type Tick = {
    /**
     * Time elapsed since last update, in ms
     */
    timeSinceLastFrame: number
};

const gameStart$ = createGameStartObservable();
export const ticker$: Observable<Tick> = createGameTicker(gameStart$);

// initial setting
//ticker$.subscribe(_ => update(canvas.height / 2, canvas.height / 2, initialBall, {player1: 0, player2: 0}));

/* vvvvvv DELETE FOR WORKSHOP vvvvvvvvv **/

/** Subject for ball collision back-propagation */
const ballAfterCollision = new Subject<Ball>();
const ballAfterCollision$ = ballAfterCollision.asObservable();

function newBallObservable(ticker: Observable<Tick>, initialBall: Ball): Observable<Ball> {
    return ticker.pipe(
        scan((ball: Ball, tick: Tick) => {
            return calculateNewBall(ball, tick);
        }, initialBall)
    );
}

const ball$ = ballAfterCollision$.pipe(
    startWith(initialBall),
    switchMap((ball) => newBallObservable(ticker$, ball)),
    share(),
)

/* Player */
const allKeyEvents$: Observable<Event> = merge(fromEvent(document, 'keydown'), fromEvent(document, 'keyup'));
const paddlePositionYPlayer1$ = paddlePositionObservable('w', 's', allKeyEvents$);
const paddlePositionYPlayer2$ = paddlePositionObservable('ArrowUp', 'ArrowDown', allKeyEvents$);

/* Game events */
const collisions$ = createCollisionsObservable(paddlePositionYPlayer1$, paddlePositionYPlayer2$, ball$);

collisions$.pipe(
    distinctUntilChanged(areCollisionsEqual),
    withLatestFrom(ball$)
).subscribe(([collision, ball]) => {
    let values: boolean[] = Object.values(collision);
    const noCollisions = values.every(value => !value);
    if (!noCollisions) {
        const newBall = calculateNewBallAfterCollision(collision, ball);
        ballAfterCollision.next(newBall);
    }
})
const scores$: Observable<Scores> = createScoringObservable(collisions$);
const gameOver$ = createGameOverObservable(scores$);

/* Sounds */
collisions$.pipe(
    map(collision => {
        if (collision.paddleLeft || collision.paddleRight) return PADDLE_SOUND;
        if (collision.borderTop || collision.borderBottom) return WALL_SOUND;
        if (collision.goalLeft || collision.goalRight) return GOAL_SOUND;
    }),
    filter(b => !!b),
    takeUntil(gameOver$)
).subscribe(beep);

gameOver$.pipe(
    mergeMap(_ => from(victorySound)),
    concatMap(x => of(x).pipe(delay(x.duration))),
).subscribe(beep);

// Game run
gameOver$.subscribe(drawGameOver);

gameStart$.pipe(
    concatMap(() => combineLatest([paddlePositionYPlayer1$, paddlePositionYPlayer2$, ball$, scores$])
        .pipe(
            sampleTime(TICKER_INTERVAL),
            takeUntil(gameOver$)
        )
    )
).subscribe((values) => update(...values));


