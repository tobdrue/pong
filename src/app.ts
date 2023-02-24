import {
    animationFrames,
    combineLatest,
    concatMap,
    delay,
    filter,
    map,
    Observable,
    of,
    pairwise,
    sampleTime,
    scan,
    share,
    Subject,
} from "rxjs";
import {
    drawAuthor,
    drawBall,
    drawControls,
    drawField,
    drawGameOver,
    drawPaddle,
    drawScores,
    drawTitle
} from "./graphics";
import { canvas, context, TICKER_INTERVAL } from "./game-config";
import { Paddle } from "./paddle";
import { beep } from "./beeper";
import { Ball, calculateNewBallPosition, initialBall } from "./ball";
import { calculateCollisions } from "./collisions";

export type Collisions = { paddle: boolean, goalLeft: boolean, goalRight: boolean, wall: boolean };

export type Scores = { player1: number, player2: number };

/* Sounds */
const cuttingBeeper = new Subject<number>();
cuttingBeeper.pipe(sampleTime(100)).subscribe(beep);
const melodyBeeper = new Subject<number>();
const beepDuration = 500;
melodyBeeper.pipe(concatMap(x => of(x).pipe(delay(beepDuration)))).subscribe((key: number) => beep(key, beepDuration));


/* Ticker */
export type Tick = {
    /**
     * Time elapsed since last update, in ms
     */
    timeSinceLastFrame: number
};
export const ticker$: Observable<Tick> = animationFrames().pipe(
    pairwise(),
    map(([prevTick, thisTick]) => ({timeSinceLastFrame: thisTick.timestamp - prevTick.timestamp})),
    share()
);

/* Player */
const paddlePlayer1 = new Paddle('w', 's');
const paddlePlayer2 = new Paddle('ArrowUp', 'ArrowDown');


const ball$: Observable<Ball> = ticker$.pipe(scan((ball: Ball, ticker: Tick) => {
    ball.position = calculateNewBallPosition(ball, ticker);
    return ball;
}, initialBall));

export const createCollisionsObservable = (playerOnePositionY$: Observable<number>, playerTwoPositionY$: Observable<number>, ball$: Observable<Ball>) =>
    combineLatest([playerOnePositionY$, playerTwoPositionY$, ball$])
        .pipe(
            map((args) => calculateCollisions(...args))
        );

const collisions$ = createCollisionsObservable(paddlePlayer1.paddlePositionY$, paddlePlayer2.paddlePositionY$, ball$);

/* score */
const scores$ = collisions$.pipe(scan((oldScores, collision) => ({
    player1: collision.goalRight ? oldScores.player1 + 1 : oldScores.player1,
    player2: collision.goalLeft ? oldScores.player2 + 1 : oldScores.player2
}), {player1: 0, player2: 0} as Scores));

scores$.pipe(filter((score) => score.player1 === 5 || score.player2 === 5))
    .subscribe((score) => {
        melodyBeeper.next(35);
        melodyBeeper.next(38);
        melodyBeeper.next(45);
        melodyBeeper.next(43);
        melodyBeeper.next(45);
        drawGameOver(`CONGRATULATIONS Player ${score.player1 === 5 ? '1' : '2'}`);
        game.unsubscribe();
        gameSounds.unsubscribe();
    });


const gameSounds = collisions$.subscribe(collisions => {
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
    context.clearRect(0, 0, canvas.width, canvas.height);
    drawPaddle(paddleLeft, 1);
    drawPaddle(paddleRight, 2);
    drawBall(ball);
    drawScores(score);
    drawField();
}

const game = combineLatest([paddlePlayer1.paddlePositionY$, paddlePlayer2.paddlePositionY$, ball$, scores$])
    .pipe(sampleTime(TICKER_INTERVAL))
    .subscribe(update);
