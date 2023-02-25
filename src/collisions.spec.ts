import '../__mocks__/client';
import { hot } from 'jest-marbles';
import { Ball } from "./ball";
import { createCollisionsObservable } from "./hidden";
import { Collisions } from "./collisions";

describe("Collisions", () => {
    it('should have no collisions initially', () => {

        const ballInMiddle: Ball = {
            position: {x: 50, y: 50},
            direction: {x: 1, y: 1}
        }

        const player1 = hot('i', {i: 50});
        const player2 = hot('i', {i: 50});
        const ball = hot(   'i', {i: ballInMiddle});

        const sut = createCollisionsObservable(player1, player2, ball);

        const initialCollisions: Collisions = {
            borderBottom: false,
            borderTop: false,
            goalLeft: false,
            goalRight: false,
            paddleLeft: false,
            paddleRight: false
        };
        const expected = hot('i-------', {i: initialCollisions});
        expect(sut).toBeObservable(expected);
    });
})
