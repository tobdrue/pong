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
    drawAuthor, drawBall,
    drawControls, drawField, drawGameOver,
    drawPaddle,
    drawScores,
    drawTitle
} from "./graphics";
import {
    BALL_RADIUS,
    canvas,
    context,
    PADDLE_HEIGHT,
    PADDLE_WIDTH,
    TICKER_INTERVAL
} from "./game-config";
import {Paddle} from "./paddle";
import {beep} from "./beeper";
import {calculateNewBallPosition, initialBall} from "./ball";
import {areGameFieldBoardersHit, goalLeft, goalRight} from "./collisions";

export type Ball = { position: { x: number, y: number }, direction: { x: number, y: number } };
type Collisions = { paddle: boolean, goalLeft: boolean, goalRight: boolean, wall: boolean };

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


const ball$ = ticker$.pipe(scan((ball: Ball, ticker: Tick) => {
    ball.position = calculateNewBallPosition(ball, ticker);
    return ball;
}, initialBall));

/* collisions */
function paddleCollisionPlayer1(paddle, ball) {
    return ball.position.x < PADDLE_WIDTH + BALL_RADIUS / 2
        && ball.position.y > paddle - PADDLE_HEIGHT / 2
        && ball.position.y < paddle + PADDLE_HEIGHT / 2;
}

function paddleCollisionPlayer2(paddle, ball) {
    return ball.position.x > canvas.width - PADDLE_WIDTH - BALL_RADIUS / 2
        && ball.position.y > paddle - PADDLE_HEIGHT / 2
        && ball.position.y < paddle + PADDLE_HEIGHT / 2;
}

const collisions$ = combineLatest([paddlePlayer1.paddlePositionY$, paddlePlayer2.paddlePositionY$, ball$]).pipe(
    map((
        [player1Paddle, player2Paddle, ball]
    ): Collisions => {
        const collisions = {
            paddle: false,
            goalLeft: false,
            goalRight: false,
            wall: false
        };

        // Ball hits top or bottom
        if (areGameFieldBoardersHit(ball)) {
            ball.direction.y = -ball.direction.y;
            collisions.wall = true;
        }

        collisions.paddle = paddleCollisionPlayer1(player1Paddle, ball) || paddleCollisionPlayer2(player2Paddle, ball);
        if (collisions.paddle) {
            ball.direction.x = -ball.direction.x;
        }

// Ball hits goal
        if (goalLeft(ball) || goalRight(ball)) {
            if (goalLeft(ball)) {
                collisions.goalLeft = true;
            } else if (goalRight(ball)) {
                collisions.goalRight = true;
            }

            ball.position.x = canvas.width / 2;
            ball.position.y = canvas.height / 2;
        }

        return collisions;
    }));

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
