import '../__mocks__/client';
import { hot } from "jest-marbles";
import * as rxjs from "rxjs";
import { createGameTicker } from "./game-ticker";

describe("GameTicker", () => {
    it("should start only after game start and emit correct time diffs", () => {
        const frames: { timestamp: number, elapsed: number }[] = [
            {elapsed: 0, timestamp: 1000},
            {elapsed: 10, timestamp: 1010}, // 10
            {elapsed: 22, timestamp: 1022}, // 12
            {elapsed: 29, timestamp: 1029}, // 7
            {elapsed: 40, timestamp: 1040}, // 11
            {elapsed: 52, timestamp: 1052}, // 12
            {elapsed: 64, timestamp: 1064}, // 12
            {elapsed: 77, timestamp: 1077}, // 13
        ]
        const start$ = hot('         -(x|)');
        const animationFrames = hot('0(1^)234567', frames)
        const expected = hot('          ---01234', [
            {timeSinceLastFrame: 7},
            {timeSinceLastFrame: 11},
            {timeSinceLastFrame: 12},
            {timeSinceLastFrame: 12},
            {timeSinceLastFrame: 13},
        ]);
        jest.spyOn(rxjs, 'animationFrames').mockReturnValue(animationFrames);

        const sut = createGameTicker(start$);

        expect(sut).toBeObservable(expected);
    })
})
