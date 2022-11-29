import {
    animationFrames, combineLatest, concatMap, delay, of,
    sampleTime,
    scan, share,
    Subject,
    withLatestFrom
} from "rxjs";
import {
    drawAuthor, drawBall,
    drawControls, drawField, drawGameOver,
    drawPaddle,
    drawScore,
    drawTitle
} from "./graphics";
import {
    BALL_RADIUS, BALL_SPEED,
    canvas,
    context,
    PADDLE_HEIGHT,
    PADDLE_WIDTH,
    TICKER_INTERVAL
} from "./game-config";
import {Player} from "./player";
import {beep} from "./beeper";

type Ball = { position: { x: number, y: number }, direction: { x: number, y: number } };
type Collisions = { paddle: boolean, goal: boolean, wall: boolean };

/* Sounds */
const cuttingBeeper = new Subject<number>();
cuttingBeeper.pipe(sampleTime(100)).subscribe(beep);
const melodyBeeper = new Subject<number>();
const beepDuration = 500;
melodyBeeper.pipe(concatMap(x => of(x).pipe(delay(beepDuration)))).subscribe((key: number) => beep(key, beepDuration));

/* Ticker */
export const ticker$ = animationFrames().pipe(share());

/* Player */
const player1 = new Player('w', 's');
const player2 = new Player('ArrowUp', 'ArrowDown');


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

const INITIAL_OBJECTS = {
    ball: {
        position: {
            x: canvas.width / 2,
            y: canvas.height / 2
        },
        direction: {
            x: 2,
            y: 2
        }
    },
    collisions: {
        paddle: false,
        goal: false,
        wall: false,
        brick: false
    },
    score: {
        player1: 0,
        player2: 0
    }
};

const objects$ = ticker$
    .pipe(
        withLatestFrom(player1.paddle$, player2.paddle$),
        scan((
            {
                ball,
                collisions,
                score
            }: { ball: Ball, collisions: Collisions, score: { player1: number, player2: number } },
            [ticker, player1Paddle, player2Paddle]
        ) => {
            collisions = {
                paddle: false,
                goal: false,
                wall: false
            };

            console.log("ball: ", timeSinceLastFrameInMs(ticker));
            ball.position.x = ball.position.x + ball.direction.x * timeSinceLastFrameInMs(ticker) * BALL_SPEED;
            ball.position.y = ball.position.y + ball.direction.y * timeSinceLastFrameInMs(ticker) * BALL_SPEED;

            // Ball hits top or bottom
            if (ball.position.y < BALL_RADIUS || ball.position.y > canvas.height - BALL_RADIUS) {
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
                    score.player2++;
                } else if (ball.position.x > canvas.width - BALL_RADIUS) {
                    score.player1++;
                }

                ball.position.x = canvas.width / 2;
                ball.position.y = canvas.height / 2;
                collisions.goal = true;
            }

            return {
                ball,
                collisions,
                score
            };

        }, INITIAL_OBJECTS));

/* Welcome */
drawTitle();
drawControls();
drawAuthor();


/* Game */
function update([_, paddleLeft, paddleRight, objects]) {

    // Redraw game
    context.clearRect(0, 0, canvas.width, canvas.height);
    drawPaddle(paddleLeft, 1);
    drawPaddle(paddleRight, 2);
    drawBall(objects.ball);
    drawScore(objects.score);
    drawField();


    if (objects.score.player1 === 5 || objects.score.player2 === 5) {
        melodyBeeper.next(35);
        melodyBeeper.next(38);
        melodyBeeper.next(45);
        melodyBeeper.next(43);
        melodyBeeper.next(45);
        drawGameOver(`CONGRATULATIONS Player ${objects.score.player1 === 5 ? '1' : '2'}`);
        game.unsubscribe();
    }

    if (objects.collisions.paddle) cuttingBeeper.next(40);
    if (objects.collisions.wall) cuttingBeeper.next(45);
    if (objects.collisions.goal) cuttingBeeper.next(20);

}

const game = combineLatest([ticker$, player1.paddle$, player2.paddle$, objects$])
    .pipe(sampleTime(TICKER_INTERVAL))
    .subscribe(update);


export const timeSinceLastFrameInMs = (ticker) => (ticker.timestamp - ticker.elapsed);
