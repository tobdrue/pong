import {distinctUntilChanged, fromEvent, merge, Observable, scan, withLatestFrom} from "rxjs";
import {canvas, PADDLE_HEIGHT} from "./game-config";
import {ticker$} from "./app";

export class Player {
    private PADDLE_SPEED = 1;
    public PADDLE_KEYS = {
        up: 'ArrowUp',
        down: 'ArrowDown'
    };

    private input$: Observable<number> = merge(
        fromEvent(document, 'keydown', event => {
            switch ((event as KeyboardEvent).key) {
                case this.PADDLE_KEYS.up:
                    return -1;
                case this.PADDLE_KEYS.down:
                    return 1;
                default:
                    return 0;
            }
        })
        , fromEvent(document, 'keyup', _ => 0)
    )
        .pipe(distinctUntilChanged());

    constructor(up: string, down: string) {
        this.PADDLE_KEYS.up = up;
        this.PADDLE_KEYS.down = down;
    }

    public paddle$ = ticker$
        .pipe(
            withLatestFrom(this.input$),
            scan((position, [ticker, direction]) => {

                let next = position + direction * ticker.elapsed * this.PADDLE_SPEED;
                return Math.max(Math.min(next, canvas.height - PADDLE_HEIGHT / 2), PADDLE_HEIGHT / 2);

            }, canvas.height / 2),
            distinctUntilChanged());
}

