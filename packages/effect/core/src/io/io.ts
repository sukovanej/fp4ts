import { AnyK, Kind, TyK, _ } from '@cats4ts/core';
import {
  Applicative,
  Apply,
  Defer,
  FlatMap,
  Functor,
  Monad,
  MonadError,
  Traversable,
  Either,
  Option,
} from '@cats4ts/cats';

import {
  Poll,
  MonadCancel,
  Sync,
  Spawn,
  Concurrent,
  Temporal,
  Async,
  ExecutionContext,
} from '@cats4ts/effect-kernel';
import * as Ref from '@cats4ts/effect-kernel/lib/ref';
import * as D from '@cats4ts/effect-kernel/lib/deferred';

import { IOOutcome } from '../io-outcome';

import { IO as IOBase } from './algebra';
import {
  async,
  async_,
  canceled,
  currentTimeMillis,
  defer,
  deferPromise,
  delay,
  fromPromise,
  never,
  pure,
  readExecutionContext,
  sleep,
  throwError,
  uncancelable,
  unit,
} from './constructors';
import {
  bothOutcome_,
  both_,
  bracketFull,
  parSequence,
  parSequenceN,
  parSequenceN_,
  parTraverse,
  parTraverseN,
  parTraverseN_,
  parTraverse_,
  raceOutcome_,
  race_,
  sequence,
  tailRecM,
  traverse,
  traverse_,
} from './operators';
import { bind, bindTo, Do } from './do';
import {
  ioAsync,
  ioConcurrent,
  ioDefer,
  ioFlatMap,
  ioFunctor,
  ioMonad,
  ioMonadCancel,
  ioMonadError,
  ioParallelApplicative,
  ioParallelApply,
  ioSequentialApplicative,
  ioSequentialApply,
  ioSpawn,
  ioSync,
  ioTemporal,
} from './instances';

export type IO<A> = IOBase<A>;

export const IO: IOObj = function <A>(thunk: () => A): IO<A> {
  return delay(thunk);
} as any;

interface IOObj {
  <A>(thunk: () => A): IO<A>;

  pure: <A>(a: A) => IO<A>;

  tailRecM: <A>(a: A) => <B>(f: (a: A) => IO<Either<A, B>>) => IO<B>;

  delay: <A>(thunk: () => A) => IO<A>;

  defer: <A>(thunk: () => IO<A>) => IO<A>;

  deferPromise: <A>(thunk: () => Promise<A>) => IO<A>;

  fromPromise: <A>(iop: IO<Promise<A>>) => IO<A>;

  throwError: (e: Error) => IO<never>;

  currentTimeMillis: IO<number>;

  readExecutionContext: IO<ExecutionContext>;

  async: <A>(
    k: (cb: (ea: Either<Error, A>) => void) => IO<Option<IO<void>>>,
  ) => IO<A>;

  async_: <A>(k: (cb: (ea: Either<Error, A>) => void) => IO<void>) => IO<A>;

  unit: IO<void>;

  never: IO<never>;

  canceled: IO<void>;

  ref: <A>(a: A) => IO<Ref.Ref<IoK, A>>;

  deferred: <A>(a?: A) => IO<D.Deferred<IoK, A>>;

  uncancelable: <A>(ioa: (p: Poll<IoK>) => IO<A>) => IO<A>;

  sleep: (ms: number) => IO<void>;

  race: <A, B>(ioa: IO<A>, iob: IO<B>) => IO<Either<A, B>>;
  raceOutcome: <A, B>(
    ioa: IO<A>,
    iob: IO<B>,
  ) => IO<Either<IOOutcome<A>, IOOutcome<B>>>;

  both: <A, B>(ioa: IO<A>, iob: IO<B>) => IO<[A, B]>;
  bothOutcome: <A, B>(
    ioa: IO<A>,
    iob: IO<B>,
  ) => IO<[IOOutcome<A>, IOOutcome<B>]>;

  sequence: <T extends AnyK>(
    T: Traversable<T>,
  ) => <A>(iots: Kind<T, [IO<A>]>) => IO<Kind<T, [A]>>;

  traverse: <T extends AnyK>(
    T: Traversable<T>,
  ) => <A, B>(
    f: (a: A) => IO<B>,
  ) => <S2, R2, E2>(ts: Kind<T, [A]>) => IO<Kind<T, [B]>>;

  traverse_: <T extends AnyK, A, B>(
    T: Traversable<T>,
    ts: Kind<T, [A]>,
    f: (a: A) => IO<B>,
  ) => IO<Kind<T, [B]>>;

  parSequence: <T extends AnyK>(
    T: Traversable<T>,
  ) => <C2, A>(iots: Kind<T, [IO<A>]>) => IO<Kind<T, [A]>>;

  parTraverse: <T extends AnyK>(
    T: Traversable<T>,
  ) => <A, B>(
    f: (a: A) => IO<B>,
  ) => <C2, S2, R2, E2>(ts: Kind<T, [A]>) => IO<Kind<T, [B]>>;
  parTraverse_: <T extends AnyK, A, B>(
    T: Traversable<T>,
    ts: Kind<T, [A]>,
    f: (a: A) => IO<B>,
  ) => IO<Kind<T, [B]>>;

  parSequenceN: <T extends AnyK>(
    T: Traversable<T>,
    maxConcurrent: number,
  ) => <C2, A>(iots: Kind<T, [IO<A>]>) => IO<Kind<T, [A]>>;
  parSequenceN_: <T extends AnyK, A>(
    T: Traversable<T>,
    iots: Kind<T, [IO<A>]>,
    maxConcurrent: number,
  ) => IO<Kind<T, [A]>>;

  parTraverseN: <T extends AnyK>(
    T: Traversable<T>,
    maxConcurrent: number,
  ) => <A, B>(
    f: (a: A) => IO<B>,
  ) => <C2, S2, R2, E2>(ts: Kind<T, [A]>) => IO<Kind<T, [B]>>;
  parTraverseN_: <T extends AnyK, A, B>(
    T: Traversable<T>,
    ts: Kind<T, [A]>,
    f: (a: A) => IO<B>,
    maxConcurrent: number,
  ) => IO<Kind<T, [B]>>;

  bracketFull: <A, B>(
    acquire: (poll: Poll<IoK>) => IO<A>,
    use: (a: A) => IO<B>,
    release: (a: A, oc: IOOutcome<B>) => IO<void>,
  ) => IO<B>;

  // Do notation

  // eslint-disable-next-line @typescript-eslint/ban-types
  Do: IO<{}>;

  // eslint-disable-next-line @typescript-eslint/ban-types
  bindTo: <N extends string, S extends {}, B>(
    name: N,
    iob: IO<B> | ((s: S) => IO<B>),
  ) => (
    ios: IO<S>,
  ) => IO<{ readonly [K in keyof S | N]: K extends keyof S ? S[K] : B }>;

  // eslint-disable-next-line @typescript-eslint/ban-types
  bind: <S extends {}, B>(
    iob: IO<B> | ((s: S) => IO<B>),
  ) => (ios: IO<S>) => IO<S>;

  // -- Instances

  readonly Defer: Defer<IoK>;
  readonly Functor: Functor<IoK>;
  readonly ParallelApply: Apply<IoK>;
  readonly ParallelApplicative: Applicative<IoK>;
  readonly SequentialApply: Apply<IoK>;
  readonly SequentialApplicative: Applicative<IoK>;
  readonly FlatMap: FlatMap<IoK>;
  readonly Monad: Monad<IoK>;
  readonly MonadError: MonadError<IoK, Error>;
  readonly MonadCancel: MonadCancel<IoK, Error>;
  readonly Sync: Sync<IoK>;
  readonly Spawn: Spawn<IoK, Error>;
  readonly Concurrent: Concurrent<IoK, Error>;
  readonly Temporal: Temporal<IoK, Error>;
  readonly Async: Async<IoK>;
}

IO.pure = pure;

IO.tailRecM = tailRecM;

IO.delay = delay;

IO.defer = defer;

IO.deferPromise = deferPromise;

IO.fromPromise = fromPromise;

IO.throwError = throwError;

IO.currentTimeMillis = currentTimeMillis;

IO.readExecutionContext = readExecutionContext;

IO.async = async;

IO.async_ = async_;

IO.unit = unit;

IO.never = never;

IO.canceled = canceled;

IO.ref = x => Ref.of(IO.Sync)(x);

IO.deferred = x => D.of(IO.Async)(x);

IO.uncancelable = uncancelable;

IO.sleep = sleep;

IO.race = race_;
IO.raceOutcome = raceOutcome_;

IO.both = both_;
IO.bothOutcome = bothOutcome_;

IO.sequence = sequence;

IO.traverse = traverse;
IO.traverse_ = traverse_;

IO.parSequence = parSequence;

IO.parTraverse = parTraverse;
IO.parTraverse_ = parTraverse_;

IO.parSequenceN = parSequenceN;
IO.parSequenceN_ = parSequenceN_;

IO.parTraverseN = parTraverseN;
IO.parTraverseN_ = parTraverseN_;

IO.bracketFull = bracketFull;

IO.Do = Do;
IO.bindTo = bindTo;
IO.bind = bind;

Object.defineProperty(IO, 'Defer', {
  get(): Defer<IoK> {
    return ioDefer();
  },
});
Object.defineProperty(IO, 'Functor', {
  get(): Functor<IoK> {
    return ioFunctor();
  },
});
Object.defineProperty(IO, 'ParallelApply', {
  get(): Apply<IoK> {
    return ioParallelApply();
  },
});
Object.defineProperty(IO, 'ParallelApplicative', {
  get(): Applicative<IoK> {
    return ioParallelApplicative();
  },
});
Object.defineProperty(IO, 'SequentialApply', {
  get(): Apply<IoK> {
    return ioSequentialApply();
  },
});
Object.defineProperty(IO, 'SequentialApplicative', {
  get(): Applicative<IoK> {
    return ioSequentialApplicative();
  },
});
Object.defineProperty(IO, 'FlatMap', {
  get(): FlatMap<IoK> {
    return ioFlatMap();
  },
});
Object.defineProperty(IO, 'Monad', {
  get(): Monad<IoK> {
    return ioMonad();
  },
});
Object.defineProperty(IO, 'MonadError', {
  get(): MonadError<IoK, Error> {
    return ioMonadError();
  },
});
Object.defineProperty(IO, 'MonadCancel', {
  get(): MonadCancel<IoK, Error> {
    return ioMonadCancel();
  },
});
Object.defineProperty(IO, 'Sync', {
  get(): Sync<IoK> {
    return ioSync();
  },
});
Object.defineProperty(IO, 'Spawn', {
  get(): Spawn<IoK, Error> {
    return ioSpawn();
  },
});
Object.defineProperty(IO, 'Concurrent', {
  get(): Concurrent<IoK, Error> {
    return ioConcurrent();
  },
});
Object.defineProperty(IO, 'Temporal', {
  get(): Temporal<IoK, Error> {
    return ioTemporal();
  },
});
Object.defineProperty(IO, 'Async', {
  get(): Async<IoK> {
    return ioAsync();
  },
});

// HKT

export const IoURI = 'effect-io/io';
export type IoURI = typeof IoURI;
export type IoK = TyK<IoURI, [_]>;

declare module '@cats4ts/core/lib/hkt/hkt' {
  interface URItoKind<Tys extends unknown[]> {
    [IoURI]: IO<Tys[0]>;
  }
}
