import {
    animationFrames,
    combineLatest,
    concatMap,
    delay,
    filter, from,
    fromEvent,
    map, mergeMap,
    Observable,
    of,
    pairwise, ReplaySubject,
    sampleTime,
    scan,
    share,
    shareReplay,
    take,
    takeUntil,
} from "rxjs";
import {
    drawGameOver,
    drawWelcome,
    update
} from "./graphics";
import {
    GOAL_SOUND,
    PADDLE_SOUND,
    POINTS_TO_WIN,
    TICKER_INTERVAL,
    victorySound,
    WALL_SOUND
} from "./game-config";
import {Paddle} from "./paddle";
import {beep} from "./beeper";
import {Ball, calculateNewBallPosition, initialBall} from "./ball";
import {
    createCollisionsObservable,
    createGameOverObservable,
    createGameStartObservable,
    createScoringObservable
} from "./hidden";

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

export const ticker$: Observable<Tick> =
    gameStart$.pipe(
        concatMap(() => animationFrames()
            .pipe(
                pairwise(),
                map(([prevTick, thisTick]) => ({timeSinceLastFrame: thisTick.timestamp - prevTick.timestamp})),
                share()
            )
        )
    );

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
const paddlePlayer1 = new Paddle('w', 's');
const paddlePlayer2 = new Paddle('ArrowUp', 'ArrowDown');

const collisions$ = createCollisionsObservable(paddlePlayer1.paddlePositionY$, paddlePlayer2.paddlePositionY$, ball$);
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
    concatMap(() => combineLatest([paddlePlayer1.paddlePositionY$, paddlePlayer2.paddlePositionY$, ball$, scores$])
        .pipe(
            sampleTime(TICKER_INTERVAL),
            takeUntil(gameOver$)
        )
    )
).subscribe((values) => update(...values));


