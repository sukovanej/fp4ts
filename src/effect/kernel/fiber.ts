import { Outcome } from './outcome';
import { Kind } from '../../fp/hkt';

export interface Fiber<F, E, A> {
  readonly join: Kind<F, Outcome<F, E, A>>;
  readonly joinWith: <B>(onCancel: Kind<F, B>) => Kind<F, A | B>;
  readonly joinWithNever: Kind<F, A>;
  readonly cancel: Kind<F, void>;
}
