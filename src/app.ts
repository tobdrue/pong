import {
    animationFrames,
    combineLatest,
    concatMap,
    delay,
    filter,
    fromEvent,
    map,
    Observable,
    of,
    pairwise,
    sampleTime,
    scan,
    share,
    shareReplay,
    Subject,
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
import { TICKER_INTERVAL } from "./game-config";
import { Paddle } from "./paddle";
import { beep } from "./beeper";
import { Ball, calculateNewBallPosition, initialBall } from "./ball";
import { createCollisionsObservable, createScoringObservable } from "./hidden";

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
const cuttingBeeper = new Subject<number>();
cuttingBeeper.pipe(
    sampleTime(100),
    takeUntil(gameOver$)
).subscribe(beep);

export type Sound = { tone: number, duration: number };
const melodyBeeper = new Subject<Sound>();
melodyBeeper.pipe(
    concatMap(x => of(x)
        .pipe(delay(x.duration))
    ),
    take(1)
).subscribe((sound: Sound) => beep(sound.tone, 500));

gameOver$.subscribe((score) => {
    const victorySound: Sound[] = [
        {tone: 35, duration: 500},
        {tone: 38, duration: 500},
        {tone: 45, duration: 500},
        {tone: 43, duration: 500},
        {tone: 45, duration: 500}
    ];
    victorySound.forEach(sound => melodyBeeper.next(sound));
    clearScores();
    drawScores(score);
    drawGameOver(`CONGRATULATIONS Player ${score.player1 >= 5 ? '1' : '2'}`);
});


/** Game sounds **/
collisions$.pipe(takeUntil(gameOver$))
    .subscribe(collisions => {
        if (collisions.paddle) cuttingBeeper.next(40);
        if (collisions.wall) cuttingBeeper.next(45);
        if (collisions.goalLeft || collisions.goalRight) cuttingBeeper.next(20);
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


