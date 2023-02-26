import { cold, hot } from 'jest-marbles';
import { mergeWith } from "rxjs";

it('Should merge two hot observables and start emitting from the subscription point', () => {
    const e1 = hot('----a--^--b----------c--|');
    const e2 = hot('  ---d-^--e---h--------f-----|');
    const expected = cold('---(be)h------c-f-----|');

    expect(e1.pipe(mergeWith(e2))).toBeObservable(expected);
});
