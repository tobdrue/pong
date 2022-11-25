import {
    animationFrames, combineLatest,
    distinctUntilChanged,
    fromEvent,
    merge,
    sampleTime,
    scan,
    Subject,
    withLatestFrom
} from "rxjs";
import {
    drawAuthor, drawBall,
    drawControls, drawField,
    drawPaddle,
    drawScore,
    drawTitle
} from "./graphics";
import {
    BALL_RADIUS, BALL_SPEED,
    canvas,
    context,
    INITIAL_OBJECTS,
    PADDLE_HEIGHT,
    PADDLE_WIDTH,
    TICKER_INTERVAL
} from "./game-config";
import {Player} from "./player";

type Ball = {position: {x: number, y: number}, direction: {x: number, y: number}};
type Collisions = { paddle: boolean, floor: boolean, wall: boolean, ceiling: boolean };

/* Sounds */

const audio = new window.AudioContext();
const beeper = new Subject();
beeper.pipe(sampleTime(100)).subscribe((key: number) => {

    let oscillator = audio.createOscillator();
    oscillator.connect(audio.destination);
    oscillator.type = 'square';

    // https://en.wikipedia.org/wiki/Piano_key_frequencies
    oscillator.frequency.value = Math.pow(2, (key - 49) / 12) * 440;

    oscillator.start();
    oscillator.stop(audio.currentTime + 0.100);

});


/* Ticker */
export const ticker$ = animationFrames();

/* Player */
const player1 = new Player('w', 's');
const player2 = new Player('ArrowUp', 'ArrowDown');



/* Ball */

// TODO new calc
function hit(paddle, ball) {
    return ball.position.x > paddle - PADDLE_WIDTH / 2
        && ball.position.x < paddle + PADDLE_WIDTH / 2
        && ball.position.y > canvas.height - PADDLE_HEIGHT - BALL_RADIUS / 2;
}

const objects$ = ticker$
    .pipe(
    withLatestFrom(player1.paddle$, player2.paddle$),
        scan((
            {ball, collisions, score}: { ball: Ball, collisions: Collisions, score: { player1: number, player2: number } },
            [ticker, player1, player2]
        ) => {
            collisions = {
                paddle: false,
                floor: false,
                wall: false,
                ceiling: false
            };

            ball.position.x = ball.position.x + ball.direction.x * timeSinceLastFrameInSec(ticker) * BALL_SPEED;
            ball.position.y = ball.position.y + ball.direction.y * timeSinceLastFrameInSec(ticker) * BALL_SPEED;

            // collisions.paddle = hit(paddle, ball);
            //
            // if (ball.position.y < BALL_RADIUS || ball.position.x > canvas.height - BALL_RADIUS) {
            //     ball.direction.y = -ball.direction.y;
            //     collisions.wall = true;
            // }
            //
            // collisions.ceiling = ball.position.y < BALL_RADIUS;
            //
            // if (collisions.paddle || collisions.ceiling) {
            //     ball.direction.y = -ball.direction.y;
            // }

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


    // if (objects.score.player1 === 5 || objects.score.player2 === 5) {
    //     beeper.next(52);
    //     drawGameOver('CONGRATULATIONS');
    //     game.unsubscribe();
    // }
    //
    // if (objects.collisions.paddle) beeper.next(40);
    // if (objects.collisions.wall || objects.collisions.ceiling) beeper.next(45);

}

const game = combineLatest([ticker$, player1.paddle$, player2.paddle$, objects$])
    .pipe(sampleTime(TICKER_INTERVAL))
    .subscribe(update);


export const timeSinceLastFrameInSec = (ticker) => (ticker.timestamp - ticker.elapsed) / 100;
