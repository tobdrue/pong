import {distinctUntilChanged, filter, fromEvent, map, merge, Observable, scan, withLatestFrom} from "rxjs";
import {canvas, PADDLE_HEIGHT, PADDLE_SPEED} from "./game-config";
import {gameFieldPadding} from "./graphics";
import {ticker$} from "./app";

export class Paddle {
    private PADDLE_KEYS = {
        up: 'ArrowUp',
        down: 'ArrowDown'
    };

    constructor(up: string, down: string) {
        this.PADDLE_KEYS.up = up;
        this.PADDLE_KEYS.down = down;
    }

    private input$: Observable<number> = merge(
        fromEvent(document, 'keydown')
        , fromEvent(document, 'keyup')
    )
        .pipe(
            filter((event: KeyboardEvent) => this.isRelevantKey(event))
            , map((event: KeyboardEvent) => this.calcPaddleDirection(event))
            , distinctUntilChanged()
        );


    public paddlePositionY$: Observable<number> = ticker$
        .pipe(withLatestFrom(this.input$),
            scan((position: number, [ticker, direction]) => {
                return Paddle.calculateNextPaddlePosition(position, direction, ticker.timeSinceLastFrame);
            }, canvas.height / 2),
            distinctUntilChanged());


    /* Helpers */
    private isRelevantKey(event: KeyboardEvent) {
        const key = event.key;
        return key == this.PADDLE_KEYS.down || key == this.PADDLE_KEYS.up;
    }

    private static calculateNextPaddlePosition(currentYPosition: number, direction: number, timeSinceLastFrame: number) {
        let next = currentYPosition + direction * timeSinceLastFrame * PADDLE_SPEED;
        return Math.max(Math.min(next, canvas.height - PADDLE_HEIGHT / 2 - gameFieldPadding), PADDLE_HEIGHT / 2 + gameFieldPadding);
    }

    private calcPaddleDirection(event: KeyboardEvent): -1 | 0 | 1 {
        if (event.type === 'keyup') {
            return 0;
        }

        switch (event.key) {
            case this.PADDLE_KEYS.up:
                return -1;
            case this.PADDLE_KEYS.down:
                return 1;
            default:
                return 0;
        }
    }
}

