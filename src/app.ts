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
    shareReplay,
    take,
    takeUntil,
} from "rxjs";
import {
    clearCanvas,
    clearScores,
    drawAuthor,
    drawBall,
    drawControls,
    drawField,
    drawGameOver,
    drawPaddle,
    drawScores,
    drawTitle
} from "./graphics";
import {TICKER_INTERVAL} from "./game-config";
import {Paddle} from "./paddle";
import {beep} from "./beeper";
import {Ball, calculateNewBallPosition, initialBall} from "./ball";
import {createCollisionsObservable, createScoringObservable} from "./hidden";

export type Scores = { player1: number, player2: number };

/* Ticker */
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
        if (collision.paddle) return 40;
        if (collision.wall) return 45;
        if (collision.goalLeft || collision.goalRight) return 20;
    }),
    takeUntil(gameOver$)
).subscribe(beep);

export type Sound = { tone: number, duration: number };
const victorySound: Sound[] = [
    {tone: 35, duration: 500},
    {tone: 38, duration: 500},
    {tone: 45, duration: 500},
    {tone: 43, duration: 500},
    {tone: 45, duration: 500}
];
gameOver$.pipe(
    mergeMap(_ => from(victorySound)),
    concatMap(x => of(x).pipe(delay(x.duration))),
).subscribe((sound: Sound) => beep(sound.tone, sound.duration));

gameOver$.subscribe((score) => {
    clearScores();
    drawScores(score);
    drawGameOver(`CONGRATULATIONS Player ${score.player1 >= 5 ? '1' : '2'}`);
});

/* Welcome */
drawTitle();
drawControls();
drawAuthor();

/* Game */
function update([paddleLeft, paddleRight, ball, score]) {
    clearCanvas();
    drawPaddle(paddleLeft, 1);
    drawPaddle(paddleRight, 2);
    drawBall(ball);
    drawScores(score);
    drawField();
}

gameStart$.pipe(
    concatMap(() => combineLatest([paddlePlayer1.paddlePositionY$, paddlePlayer2.paddlePositionY$, ball$, scores$])
        .pipe(
            sampleTime(TICKER_INTERVAL),
            takeUntil(gameOver$)
        )
    )
).subscribe(update);


