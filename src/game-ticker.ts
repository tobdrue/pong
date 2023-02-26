import { animationFrames, concatMap, map, Observable, pairwise, share } from "rxjs";

/**
 * emits every browser loop before repaint
 * with the elapsed time since the last emit
 * @param gameStart$
 */
export const createGameTicker = (gameStart$: Observable<void>) => gameStart$.pipe(
    concatMap(() => animationFrames()
        .pipe(
            pairwise(),
            map(([prevTick, thisTick]) => ({timeSinceLastFrame: thisTick.timestamp - prevTick.timestamp})),
            share()
        )
    )
);
