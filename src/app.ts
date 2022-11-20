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
    BALL_RADIUS,
    canvas,
    context,
    INITIAL_OBJECTS,
    PADDLE_HEIGHT,
    PADDLE_WIDTH,
    TICKER_INTERVAL
} from "./game-config";

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
const ticker$ = animationFrames();

/* Paddle */

const PADDLE_SPEED = 240;
const PADDLE_KEYS = {
    left: '<',
    right: '>'
};

const input$ = merge(
        fromEvent(document, 'keydown', event => {
            switch ((event as KeyboardEvent).key) {
                case PADDLE_KEYS.left:
                    return -1;
                case PADDLE_KEYS.right:
                    return 1;
                default:
                    return 0;
            }
        })
    ,fromEvent(document, 'keyup', _ => 0)
    )
    .pipe(distinctUntilChanged());

const paddle$ = ticker$
    .pipe(
    withLatestFrom(input$),
    scan((position, [ticker, direction]) => {

        let next = position + direction * ticker.elapsed * PADDLE_SPEED;
        return Math.max(Math.min(next, canvas.height - PADDLE_HEIGHT / 2), PADDLE_HEIGHT / 2);

    }, canvas.height / 2),
    distinctUntilChanged());


/* Ball */

// TODO new calc
function hit(paddle, ball) {
    return ball.position.x > paddle - PADDLE_WIDTH / 2
        && ball.position.x < paddle + PADDLE_WIDTH / 2
        && ball.position.y > canvas.height - PADDLE_HEIGHT - BALL_RADIUS / 2;
}

const objects$ = ticker$
    .pipe(
    withLatestFrom(paddle$),
        scan((
            {ball, collisions, score}: { ball: Ball, collisions: Collisions, score: { player1: number, player2: number } },
            [ticker, paddle]
        ) => {
            collisions = {
                paddle: false,
                floor: false,
                wall: false,
                ceiling: false
            };

            // ball.position.x = ball.position.x + ball.direction.x * ticker.elapsed * BALL_SPEED;
            // ball.position.y = ball.position.y + ball.direction.y * ticker.elapsed * BALL_SPEED;
            //
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

/* Game */
drawTitle();
drawControls();
drawAuthor();

function update([_, paddle, objects]) {

    context.clearRect(0, 0, canvas.width, canvas.height);

    drawPaddle(paddle, 1);
    drawPaddle(paddle, 2);
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

const game = combineLatest([ticker$, paddle$, objects$])
    .pipe(sampleTime(TICKER_INTERVAL))
    .subscribe(update);
