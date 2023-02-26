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
    pipe,
    ReplaySubject,
    sampleTime,
    scan,
    shareReplay,
    startWith,
    takeUntil,
    withLatestFrom,
} from "rxjs";
import { drawGameOver, drawWelcome, update } from "./graphics";
import { canvas, GOAL_SOUND, PADDLE_SOUND, TICKER_INTERVAL, victorySound, WALL_SOUND } from "./game-config";
import { calcPaddleDirection, calculateNextPaddlePosition } from "./paddle";
import { beep } from "./beeper";
import { Ball, calculateNewBallPosition, initialBall } from "./ball";
import {
    createCollisionsObservable,
    createGameOverObservable,
    createGameStartObservable,
    createScoringObservable
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

const ballAfterCollision = new ReplaySubject<Ball>(1);
ballAfterCollision.next(initialBall);
const ballAfterCollision$ = ballAfterCollision.asObservable();

// TODO circular dependency: use ballAfterCollision
const ball$: Observable<Ball> = ticker$.pipe(
    scan((ball: Ball, ticker: Tick) => {
        ball.position = calculateNewBallPosition(ball, ticker);
        return ball;
    }, initialBall),
    shareReplay(1),
);

/* Player */
const keyDownToDirection = (up: string, down: string) => pipe(
    filter((event: KeyboardEvent) => event.key == up || event.key == down),
    map((event: KeyboardEvent) => calcPaddleDirection(event, up, down)),
    distinctUntilChanged()
);

const nextPaddlePosition = () => pipe(
    scan((position: number, [ticker, direction]) => {
        return calculateNextPaddlePosition(position, direction, ticker.timeSinceLastFrame);
    }, canvas.height / 2),
    startWith(canvas.height / 2),
    distinctUntilChanged(),
    shareReplay(1)
);

const paddleKeyEvents$: Observable<Event> = merge(
    fromEvent(document, 'keydown')
    , fromEvent(document, 'keyup'));

const player1Up = 'w';
const player1Down = 's';
const currentPaddleDirectionPlayer1: Observable<number> = paddleKeyEvents$.pipe(keyDownToDirection(player1Up, player1Down));
const paddlePositionYPlayer1$: Observable<number> = ticker$
    .pipe(withLatestFrom(currentPaddleDirectionPlayer1),
        nextPaddlePosition()
        );


const player2Up = 'ArrowUp';
const player2Down = 'ArrowDown';
const currentPaddleDirectionPlayer2: Observable<number> = paddleKeyEvents$.pipe(keyDownToDirection(player2Up, player2Down));
const paddlePositionYPlayer2$: Observable<number> = ticker$
    .pipe(withLatestFrom(currentPaddleDirectionPlayer2),
        nextPaddlePosition()
    );

const collisions$ = createCollisionsObservable(paddlePositionYPlayer1$, paddlePositionYPlayer2$, ball$);
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

// TODO circular dependency
// collisions$.pipe(
//     takeUntil(gameOver$),
//     withLatestFrom(ball$)
// ).subscribe(([collision, ball]) => {
//     let value = calculateNewBallAfterCollision(collision, ball);
//     ballAfterCollision.next(value)
// });

gameOver$.pipe(
    mergeMap(_ => from(victorySound)),
    concatMap(x => of(x).pipe(delay(x.duration))),
).subscribe(beep);

gameOver$.subscribe(drawGameOver);

gameStart$.pipe(
    concatMap(() => combineLatest([paddlePositionYPlayer1$, paddlePositionYPlayer2$, ball$, scores$])
        .pipe(
            sampleTime(TICKER_INTERVAL),
            takeUntil(gameOver$)
        )
    )
).subscribe((values) => update(...values));


