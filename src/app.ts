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
    pairwise,
    sampleTime,
    scan,
    share,
    shareReplay, Subject,
    take,
    takeUntil
} from "rxjs";
import {
    clearScores,
    drawGameOver, drawScores,
    drawWelcome,
    update
} from "./graphics";
import {TICKER_INTERVAL, victorySound} from "./game-config";
import {Paddle} from "./paddle";
import {beep} from "./beeper";
import {Ball, calculateNewBallPosition, initialBall} from "./ball";
import {createCollisionsObservable, createScoringObservable} from "./hidden";

drawWelcome();

export type Scores = { player1: number, player2: number };
export type Sound = { tone: number, duration: number };
export type Tick = {
    /**
     * Time elapsed since last update, in ms
     */
    timeSinceLastFrame: number
};

const gameStart$ = fromEvent(document, 'keydown').pipe(
    filter((event: KeyboardEvent) => event?.key == " "),
    take(1),
    share()
);

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

const ballAfterCollision = new Subject<Ball>();
ballAfterCollision.next(initialBall);

// TODO use ballAfterCollision for clean circular dependency
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

const gameOver$ = scores$.pipe(
    filter((score) => score.player1 >= 5 || score.player2 >= 5),
    take(1)
);

/* Sounds */
collisions$.pipe(
    map(collision => {
        if (collision.paddleLeft || collision.paddleRight) return 40;
        if (collision.borderTop || collision.borderBottom) return 45;
        if (collision.goalLeft || collision.goalRight) return 20;
    }),
    filter(b => !!b),
    takeUntil(gameOver$)
).subscribe(beep);

// collisions$.pipe(
//     takeUntil(gameOver$),
//     withLatestFrom(ball$)
// ).subscribe(([collision, ball]) => ballAfterCollision.next(calculateNewBallAfterCollision(collision, ball)));
gameOver$.pipe(
    mergeMap(_ => from(victorySound)),
    concatMap(x => of(x).pipe(delay(x.duration))),
).subscribe((sound: Sound) => beep(sound.tone, sound.duration));

gameOver$.subscribe((score) => {
    clearScores();
    drawScores(score);
    drawGameOver(`CONGRATULATIONS Player ${score.player1 >= 5 ? '1' : '2'}`);
});

gameStart$.pipe(
    concatMap(() => combineLatest([paddlePlayer1.paddlePositionY$, paddlePlayer2.paddlePositionY$, ball$, scores$])
        .pipe(
            sampleTime(TICKER_INTERVAL),
            takeUntil(gameOver$)
        )
    )
).subscribe(([paddlePlayer1, paddlePlayer2, ball, scores]) => update(paddlePlayer1, paddlePlayer2, ball.position, scores));


