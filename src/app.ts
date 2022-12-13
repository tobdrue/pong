import {
    animationFrames,
    BehaviorSubject,
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
    drawTitle, gameFieldPadding
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

export type Ball = { position: { x: number, y: number }, direction: { x: number, y: number } };
type Collisions = { paddle: boolean, goal: boolean, wall: boolean };

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


/* score */
const scorePlayer1 = new BehaviorSubject<number>(0);
const scorePlayer1$ = scorePlayer1.asObservable();
const scorePlayer2 = new BehaviorSubject<number>(0);
const scorePlayer2$ = scorePlayer2.asObservable();

combineLatest([scorePlayer1$, scorePlayer2$])
    .pipe(filter(([score1, score2]) => score1 === 5 || score2 === 5))
    .subscribe(([score1, _]) => {
        melodyBeeper.next(35);
        melodyBeeper.next(38);
        melodyBeeper.next(45);
        melodyBeeper.next(43);
        melodyBeeper.next(45);
        drawGameOver(`CONGRATULATIONS Player ${score1 === 5 ? '1' : '2'}`);
        game.unsubscribe();
    });

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
            goal: false,
            wall: false
        };

        // Ball hits top or bottom
        if (ball.position.y < BALL_RADIUS + gameFieldPadding || ball.position.y > canvas.height - BALL_RADIUS - gameFieldPadding) {
            ball.direction.y = -ball.direction.y;
            collisions.wall = true;
        }

        collisions.paddle = paddleCollisionPlayer1(player1Paddle, ball) || paddleCollisionPlayer2(player2Paddle, ball);
        if (collisions.paddle) {
            ball.direction.x = -ball.direction.x;
        }

        // Ball hits goal
        if (ball.position.x <= BALL_RADIUS || ball.position.x > canvas.width - BALL_RADIUS) {
            if (ball.position.x <= BALL_RADIUS) {
                scorePlayer2.next(scorePlayer2.value + 1);
            } else if (ball.position.x > canvas.width - BALL_RADIUS) {
                scorePlayer1.next(scorePlayer1.value + 1);
            }

            ball.position.x = canvas.width / 2;
            ball.position.y = canvas.height / 2;
            collisions.goal = true;
        }

        return collisions;
    }));

/* Welcome */
drawTitle();
drawControls();
drawAuthor();

/* Game */
function update([paddleLeft, paddleRight, collisions, ball, score1, score2]) {

    // Redraw game
    context.clearRect(0, 0, canvas.width, canvas.height);
    drawPaddle(paddleLeft, 1);
    drawPaddle(paddleRight, 2);
    drawBall(ball);
    drawScores(score1, score2);
    drawField();

    if (collisions.paddle) cuttingBeeper.next(40);
    if (collisions.wall) cuttingBeeper.next(45);
    if (collisions.goal) cuttingBeeper.next(20);
}

const game = combineLatest([paddlePlayer1.paddlePositionY$, paddlePlayer2.paddlePositionY$, collisions$, ball$, scorePlayer1$, scorePlayer2$])
    .pipe(sampleTime(TICKER_INTERVAL))
    .subscribe(update);
