import '../__mocks__/client';
import { hot } from "jest-marbles";
import { createGameOverObservable, createGameStartObservable, createScoringObservable } from "./hidden";
import { Scores } from "./app";
import { tap } from "rxjs";
import { Collisions } from "./collisions";

describe("App", () => {
    describe("Game over", () => {
        it('should emit only final state and complete', () => {
            // ARRANGE
            const finalScore: Scores = {player1: 5, player2: 2}
            const scoresEvents: { [key: string]: Scores } = {
                a: {player1: 0, player2: 1},
                b: {player1: 1, player2: 1},
                c: {player1: 1, player2: 2},
                d: {player1: 2, player2: 2},
                e: {player1: 3, player2: 2},
                f: {player1: 4, player2: 2},
                g: finalScore
            };
            const scores =           hot('a-bc-de--fg', scoresEvents);
            const gameOverExpected = hot('----------(x|)', {x: finalScore});

            // ACT
            const sut = createGameOverObservable(scores);

            // ASSERT
            expect(sut).toBeObservable(gameOverExpected);
        });
    });

    describe("Game start", () => {
        it("should react only on space press and complete", () => {
            const gameStartExpected = hot('---(x|)', {});
                                      hot('-a-s', {a: "a", s: " "}).pipe(
                                          tap((key) => document.dispatchEvent(new KeyboardEvent('keydown', {key})))
                                      ).subscribe(); // Subscribe so that it executes

            const sut = createGameStartObservable();
            expect(sut).toBeObservable(gameStartExpected);
        });
    });

    describe("Scoring", () => {
        const noCollisions: Collisions = {
            paddleLeft: false,
            paddleRight: false,
            goalRight: false,
            goalLeft: false,
            borderTop: false,
            borderBottom: false
        }

        it("should count correctly on goal collisions", () => {
            // ARRANGE
            const A: Collisions = { ...noCollisions, goalLeft: true};
            const B: Collisions = { ...noCollisions, goalRight: true};
            const c: Collisions = { ...noCollisions, paddleLeft: true};
            const d: Collisions = { ...noCollisions, paddleRight: true};
            const e: Collisions = { ...noCollisions, borderTop: true};
            const f: Collisions = { ...noCollisions, borderBottom: true};
            const collisions = hot(    'cdefAcdfeBfecdA', {A, B, c, d, e, f});
            const scoresExpected = hot('aaaabbbbbcccccd', {
                a: {player1: 0, player2: 0},
                b: {player1: 0, player2: 1},
                c: {player1: 1, player2: 1},
                d: {player1: 1, player2: 2},
            });

            // ACT
            const sut = createScoringObservable(collisions);

            // ASSERT
            expect(sut).toBeObservable(scoresExpected);
        })
    })
})
