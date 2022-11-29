import { distinctUntilChanged, filter, fromEvent, map, merge, Observable, scan, tap, withLatestFrom } from "rxjs";
import { canvas, PADDLE_HEIGHT, PADDLE_SPEED } from "./game-config";
import { ticker$, timeSinceLastFrameInMs } from "./app";

export class Player {
    /** default values can be overwritten via constructor */
    public PADDLE_KEYS = {
        up: 'ArrowUp',
        down: 'ArrowDown'
    };

    private input$: Observable<number> = merge(
        fromEvent(document, 'keydown')
        , fromEvent(document, 'keyup')
    )
        .pipe(
            filter((event: KeyboardEvent) => {
                const key = event.key;
                return key == this.PADDLE_KEYS.down || key == this.PADDLE_KEYS.up;
            })
            , map( (event: KeyboardEvent) => {
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
            }), tap(console.log)
            , distinctUntilChanged()
        );

    constructor(up: string, down: string) {
        this.PADDLE_KEYS.up = up;
        this.PADDLE_KEYS.down = down;
    }

    public paddle$ = ticker$
        .pipe(
            withLatestFrom(this.input$),
            scan((position, [ticker, direction]) => {

                console.log("player: " + this.PADDLE_KEYS.up, timeSinceLastFrameInMs(ticker));
                let next = position + direction * timeSinceLastFrameInMs(ticker) * PADDLE_SPEED;
                return Math.max(Math.min(next, canvas.height - PADDLE_HEIGHT / 2), PADDLE_HEIGHT / 2);

            }, canvas.height / 2),
            distinctUntilChanged());
}

