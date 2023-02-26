import { animationFrames, concatMap, map, Observable, pairwise, share } from "rxjs";

export const createGameTicker = (gameStart$: Observable<void>) => gameStart$.pipe(
    concatMap(() => animationFrames()
        .pipe(
            pairwise(),
            map(([prevTick, thisTick]) => ({timeSinceLastFrame: thisTick.timestamp - prevTick.timestamp})),
            share()
        )
    )
);
