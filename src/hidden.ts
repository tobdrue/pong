/* score */
import { combineLatest, map, Observable, scan, share, tap } from "rxjs";
import { Scores } from "./app";
import { Ball } from "./ball";
import { calculateCollisions, Collisions } from "./collisions";

export const createScoringObservable = (collisions$: Observable<Collisions>) =>
    collisions$.pipe(
        scan((oldScores, collision) => ({
                player1: collision.goalRight ? oldScores.player1 + 1 : oldScores.player1,
                player2: collision.goalLeft ? oldScores.player2 + 1 : oldScores.player2
            }), {player1: 0, player2: 0} as Scores
        ),
        share()
    );


export const createCollisionsObservable = (playerOnePositionY$: Observable<number>, playerTwoPositionY$: Observable<number>, ball$: Observable<Ball>) =>
    combineLatest([playerOnePositionY$, playerTwoPositionY$, ball$])
        .pipe(
            map(([playerOnePositionY, playerTwoPositionY, ball]) => calculateCollisions(playerOnePositionY, playerTwoPositionY, ball)),
            share()
        );
