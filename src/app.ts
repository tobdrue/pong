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
    BALL_RADIUS,
    canvas,
    context,
    drawAuthor, drawBall,
    drawControls,
    drawGameOver,
    drawPaddle,
    drawScore,
    drawTitle, PADDLE_HEIGHT, PADDLE_WIDTH
} from "./graphics";

type Ball = {position: {x: number, y: number}, direction: {x: number, y: number}};
type Collisions = { paddle: boolean, floor: boolean, wall: boolean, ceiling: boolean, brick: boolean };

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
const TICKER_INTERVAL = 17;
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
        return Math.max(Math.min(next, canvas.width - PADDLE_WIDTH / 2), PADDLE_WIDTH / 2);

    }, canvas.width / 2),
    distinctUntilChanged());


/* Ball */

const BALL_SPEED = 60;
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
        floor: false,
        wall: false,
        ceiling: false,
        brick: false
    },
    score: 0
};

function hit(paddle, ball) {
    return ball.position.x > paddle - PADDLE_WIDTH / 2
        && ball.position.x < paddle + PADDLE_WIDTH / 2
        && ball.position.y > canvas.height - PADDLE_HEIGHT - BALL_RADIUS / 2;
}

const objects$ = ticker$
    .pipe(
    withLatestFrom(paddle$),
        scan((
            {ball, collisions, score}: { ball: Ball, collisions: Collisions, score: number },
            [ticker, paddle]
        ) => {
            collisions = {
                paddle: false,
                floor: false,
                wall: false,
                ceiling: false,
                brick: false
            };

            ball.position.x = ball.position.x + ball.direction.x * ticker.elapsed * BALL_SPEED;
            ball.position.y = ball.position.y + ball.direction.y * ticker.elapsed * BALL_SPEED;

            collisions.paddle = hit(paddle, ball);

            if (ball.position.x < BALL_RADIUS || ball.position.x > canvas.width - BALL_RADIUS) {
                ball.direction.x = -ball.direction.x;
                collisions.wall = true;
            }

            collisions.ceiling = ball.position.y < BALL_RADIUS;

            if (collisions.brick || collisions.paddle || collisions.ceiling) {
                ball.direction.y = -ball.direction.y;
            }

            return {
                ball,
                kl: 2,
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

    if (objects.ball.position.y > canvas.height - BALL_RADIUS) {
        beeper.next(28);
        drawGameOver('GAME OVER');
        game.unsubscribe();
    }

    if (!objects.bricks.length) {
        beeper.next(52);
        drawGameOver('CONGRATULATIONS');
        game.unsubscribe();
    }

    if (objects.collisions.paddle) beeper.next(40);
    if (objects.collisions.wall || objects.collisions.ceiling) beeper.next(45);
    if (objects.collisions.brick) beeper.next(47 + Math.floor(objects.ball.position.y % 12));

}

const game = combineLatest([ticker$, paddle$, objects$])
    .pipe(sampleTime(TICKER_INTERVAL))
    .subscribe(update);
