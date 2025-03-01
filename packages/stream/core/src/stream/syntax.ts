// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Kind, PrimitiveType } from '@fp4ts/core';
import {
  Applicative,
  Eq,
  Functor,
  Monoid,
  MonoidK,
  Either,
  List,
  Option,
  Vector,
  Ior,
  IdentityF,
  FunctionK,
} from '@fp4ts/cats';
import {
  SyncIO,
  SyncIOF,
  IO,
  IOF,
  Sync,
  Concurrent,
  Temporal,
  QueueSink,
} from '@fp4ts/effect';

import { Chunk } from '../chunk';
import { Stream } from './algebra';
import { Compiler } from '../compiler';
import {
  concat_,
  map_,
  flatMap_,
  flatten,
  compile,
  take_,
  prepend_,
  prependChunk_,
  head,
  drop_,
  tail,
  zip_,
  zipWith_,
  repeat,
  handleErrorWith_,
  attempt,
  chunks,
  chunkAll,
  takeRight_,
  dropRight_,
  takeWhile_,
  dropWhile_,
  headOption,
  last,
  lastOption,
  init,
  filter_,
  filterNot_,
  collect_,
  collectWhile_,
  collectFirst_,
  fold_,
  foldMap_,
  foldMapK_,
  redeemWith_,
  chunkLimit_,
  chunkN_,
  unchunks,
  chunkMin_,
  scan_,
  scan1_,
  scanChunks_,
  scanChunksOpt_,
  zipAll_,
  zipAllWith_,
  zipWithIndex,
  mapAccumulate_,
  zipWithNext,
  zipWithPrevious,
  filterWithPrevious_,
  changes,
  sliding_,
  rethrow,
  evalMap_,
  evalMapChunk_,
  align_,
  evalTap_,
  attempts_,
  drain,
  evalCollect_,
  evalScan_,
  covary,
  covaryOutput,
  covaryAll,
  compileSync,
  compileConcurrent,
  interruptWhen_,
  scope,
  interruptScope,
  through_,
  through2_,
  interruptWhenTrue_,
  delayBy_,
  concurrently_,
  noneTerminate,
  unNoneTerminate,
  merge_,
  onFinalize_,
  mergeHaltBoth_,
  mergeHaltL_,
  mergeHaltR_,
  zipLeft_,
  zipRight_,
  spaced_,
  mapChunks_,
  intersperse_,
  parJoin_,
  parJoinUnbounded,
  mapNoScope_,
  enqueueNoneTerminated_,
  enqueueNoneTerminatedChunks_,
  mapK_,
  uncons,
  throughF_,
} from './operators';
import { PureF } from '../pure';
import { CompileOps } from './compile-ops';

declare module './algebra' {
  interface Stream<out F, out A> {
    readonly head: Stream<F, A>;
    readonly headOption: Stream<F, Option<A>>;
    readonly tail: Stream<F, A>;

    readonly last: Stream<F, A>;
    readonly lastOption: Stream<F, Option<A>>;
    readonly init: Stream<F, A>;

    readonly uncons: Stream<F, Option<[A, Stream<F, A>]>>;

    readonly repeat: Stream<F, A>;
    readonly drain: Stream<F, never>;

    prepend<B>(this: Stream<F, B>, x: B): Stream<F, B>;
    prependChunk<B>(this: Stream<F, B>, x: Chunk<B>): Stream<F, B>;

    take(n: number): Stream<F, A>;
    takeRight(n: number): Stream<F, A>;
    takeWhile(pred: (a: A) => boolean, takeFailure?: boolean): Stream<F, A>;

    drop(n: number): Stream<F, A>;
    dropRight(n: number): Stream<F, A>;
    dropWhile(pred: (a: A) => boolean, dropFailure?: boolean): Stream<F, A>;

    concat<F2, B>(this: Stream<F2, B>, that: Stream<F2, B>): Stream<F2, B>;
    '+++'<F2, B>(this: Stream<F2, B>, that: Stream<F2, B>): Stream<F2, B>;

    readonly chunks: Stream<F, Chunk<A>>;
    readonly chunkAll: Stream<F, Chunk<A>>;
    chunkLimit(limit: number): Stream<F, Chunk<A>>;
    chunkMin(n: number, allowFewerTotal?: boolean): Stream<F, Chunk<A>>;
    chunkN(n: number, allowFewer?: boolean): Stream<F, Chunk<A>>;
    readonly unchunks: A extends Chunk<infer B> ? Stream<F, B> : never;
    sliding(size: number, step?: number): Stream<F, Chunk<A>>;

    changes(this: Stream<F, PrimitiveType>): Stream<F, A>;
    changes<A>(this: Stream<F, A>, E: Eq<A>): Stream<F, A>;

    filter(pred: (a: A) => boolean): Stream<F, A>;
    filterNot(pred: (a: A) => boolean): Stream<F, A>;

    filterWithPrevious(f: (prev: A, cur: A) => boolean): Stream<F, A>;

    collect<B>(f: (a: A) => Option<B>): Stream<F, B>;
    collectFirst<B>(f: (a: A) => Option<B>): Stream<F, B>;
    collectWhile<B>(f: (a: A) => Option<B>): Stream<F, B>;

    as<B>(result: B): Stream<F, B>;
    mapChunks<B>(f: (c: Chunk<A>) => Chunk<B>): Stream<F, B>;
    map<B>(f: (a: A) => B): Stream<F, B>;
    mapNoScope<B>(f: (a: A) => B): Stream<F, B>;
    mapAccumulate<S>(s: S): <B>(f: (s: S, a: A) => [S, B]) => Stream<F, [S, B]>;
    evalMap<F2, B>(
      this: Stream<F2, A>,
      f: (a: A) => Kind<F2, [B]>,
    ): Stream<F2, B>;
    evalCollect<F2, B>(
      this: Stream<F2, A>,
      f: (a: A) => Kind<F2, [Option<B>]>,
    ): Stream<F2, B>;
    evalTap<F2>(
      this: Stream<F2, A>,
      F2: Functor<F2>,
    ): (f: (a: A) => Kind<F2, [unknown]>) => Stream<F2, A>;
    evalMapChunk<F2>(
      this: Stream<F2, A>,
      F: Applicative<F2>,
    ): <B>(f: (a: A) => Kind<F2, [B]>) => Stream<F2, B>;

    flatMap<F2, B>(f: (a: A) => Stream<F2, B>): Stream<F2, B>;
    readonly flatten: A extends Stream<infer F2, infer B>
      ? Stream<F | F2, B>
      : never;

    through<F2, B>(
      this: Stream<F2, A>,
      f: (s: Stream<F2, A>) => Stream<F2, B>,
    ): Stream<F2, B>;
    through2<F2, B, C>(
      this: Stream<F2, A>,
      that: Stream<F2, B>,
      f: (s1: Stream<F, A>, s2: Stream<F2, B>) => Stream<F2, C>,
    ): Stream<F2, C>;
    throughF<G>(f: (s: Stream<F, A>) => Stream<G, A>): Stream<G, A>;

    fold<B>(z: B, f: (b: B, a: A) => B): Stream<F, B>;
    foldMap<M>(M: Monoid<M>): (f: (a: A) => M) => Stream<F, M>;
    foldMapK<G>(
      G: MonoidK<G>,
    ): <B>(f: (a: A) => Kind<G, [B]>) => Stream<F, Kind<G, [B]>>;

    scan<B>(z: B, f: (b: B, a: A) => B): Stream<F, A>;
    scan1<B>(this: Stream<F, B>, f: (x: B, y: B) => B): Stream<F, B>;

    evalScan<F2, B>(
      this: Stream<F2, A>,
      z: B,
      f: (b: B, a: A) => Kind<F2, [B]>,
    ): Stream<F2, B>;

    scanChunks<S, B>(
      s: S,
      f: (s: S, c: Chunk<A>) => [S, Chunk<B>],
    ): Stream<F, B>;
    scanChunksOpt<S, B>(
      s: S,
      f: (s: S) => Option<(c: Chunk<A>) => [S, Chunk<B>]>,
    ): Stream<F, B>;

    readonly noneTerminate: Stream<F, Option<A>>;
    unNoneTerminate<F2, B>(this: Stream<F2, Option<B>>): Stream<F2, B>;

    intersperse<B>(this: Stream<F, B>, separator: B): Stream<F, B>;

    align<F2, B>(
      this: Stream<F2, A>,
      that: Stream<F2, B>,
    ): Stream<F2, Ior<A, B>>;
    zip<F2, B>(this: Stream<F2, A>, that: Stream<F2, B>): Stream<F2, [A, B]>;
    zipLeft<F2, B>(this: Stream<F2, A>, that: Stream<F2, B>): Stream<F2, A>;
    zipRight<F2, B>(this: Stream<F2, A>, that: Stream<F2, B>): Stream<F2, B>;
    zipWith<F2, B, C>(
      this: Stream<F2, A>,
      that: Stream<F2, B>,
      f: (a: A, b: B) => C,
    ): Stream<F2, C>;

    readonly zipWithIndex: Stream<F, [A, number]>;
    readonly zipWithNext: Stream<F, [A, Option<A>]>;
    readonly zipWithPrevious: Stream<F, [Option<A>, A]>;

    zipAll<F2, AA, B>(
      this: Stream<F2, AA>,
      that: Stream<F2, B>,
    ): (pad1: AA, pad2: B) => Stream<F2, [AA, B]>;
    zipAllWith<F2, AA, B>(
      this: Stream<F2, AA>,
      that: Stream<F2, B>,
    ): (pad1: AA, pad2: B) => <C>(f: (a: AA, b: B) => C) => Stream<F2, C>;

    merge<F2, B>(
      this: Stream<F2, B>,
      F: Concurrent<F2, Error>,
    ): (that: Stream<F2, B>) => Stream<F2, B>;
    mergeHaltBoth<F2, B>(
      this: Stream<F2, B>,
      F: Concurrent<F2, Error>,
    ): (that: Stream<F2, B>) => Stream<F2, B>;
    mergeHaltL<F2, B>(
      this: Stream<F2, B>,
      F: Concurrent<F2, Error>,
    ): (that: Stream<F2, B>) => Stream<F2, B>;
    mergeHaltR<F2, B>(
      this: Stream<F2, B>,
      F: Concurrent<F2, Error>,
    ): (that: Stream<F2, B>) => Stream<F2, B>;

    parJoin<F2, B>(
      this: Stream<F2, Stream<F2, B>>,
      F: Concurrent<F2, Error>,
    ): (maxOpen: number) => Stream<F2, B>;
    parJoinUnbounded<F2, B>(
      this: Stream<F2, Stream<F2, B>>,
      F: Concurrent<F2, Error>,
    ): Stream<F2, B>;

    readonly attempt: Stream<F, Either<Error, A>>;
    attempts<F2>(
      F: Temporal<F2, Error>,
    ): (delays: Stream<F2, number>) => Stream<F2, Either<Error, A>>;

    redeemWith<F2, B>(
      this: Stream<F2, A>,
      onFailure: (e: Error) => Stream<F2, B>,
      onSuccess: (a: A) => Stream<F2, B>,
    ): Stream<F2, B>;

    rethrow: A extends Either<Error, infer B> ? Stream<F, B> : never;

    handleErrorWith<F2, B>(
      this: Stream<F2, B>,
      h: (e: Error) => Stream<F2, B>,
    ): Stream<F2, B>;

    delayBy<F2>(
      this: Stream<F2, A>,
      F: Temporal<F2, Error>,
    ): (ms: number) => Stream<F2, A>;

    spaced<F2>(
      this: Stream<F2, A>,
      F: Temporal<F2, Error>,
    ): (period: number) => Stream<F2, A>;

    readonly scope: Stream<F, A>;
    readonly interruptScope: Stream<F, A>;

    onFinalize<F2>(
      this: Stream<F2, A>,
      F: Applicative<F2>,
    ): (fin: Kind<F2, [void]>) => Stream<F2, A>;

    interruptWhenTrue<F2>(
      this: Stream<F2, A>,
      F: Concurrent<F2, Error>,
    ): (haltOnTrue: Stream<F2, boolean>) => Stream<F2, A>;
    interruptWhen<F2>(
      this: Stream<F2, A>,
      haltOnSignal: Kind<F2, [Either<Error, void>]>,
    ): Stream<F2, A>;

    concurrently<F2>(
      this: Stream<F2, A>,
      F: Concurrent<F2, Error>,
    ): <B>(that: Stream<F2, B>) => Stream<F2, A>;

    enqueueNoneTerminated<F2, B>(
      this: Stream<F2, B>,
      q: QueueSink<F2, Option<B>>,
    ): Stream<F, never>;
    enqueueNoneTerminatedChunks<F2, B>(
      this: Stream<F2, B>,
      q: QueueSink<F2, Option<Chunk<B>>>,
    ): Stream<F, never>;

    covary<F2>(this: Stream<F2, A>): Stream<F2, A>;
    covaryOutput<B>(this: Stream<F, B>): Stream<F, B>;
    covaryAll<F2, B>(this: Stream<F2, B>): Stream<F2, B>;

    mapK<G>(nt: FunctionK<F, G>): Stream<G, A>;

    compile(this: Stream<PureF, A>): CompileOps<PureF, IdentityF, A>;
    compile<F2, G>(
      this: Stream<F2, A>,
      compiler: Compiler<F2, G>,
    ): CompileOps<F2, G, A>;

    compileSync(this: Stream<SyncIOF, A>): CompileOps<SyncIOF, SyncIOF, A>;
    compileSync<F2>(this: Stream<F2, A>, F: Sync<F2>): CompileOps<F2, F2, A>;

    compileConcurrent(this: Stream<IOF, A>): CompileOps<IOF, IOF, A>;
    compileConcurrent<F2>(
      this: Stream<F2, A>,
      F: Concurrent<F2, Error>,
    ): CompileOps<F2, F2, A>;

    toList: F extends PureF ? List<A> : never;
    toVector: F extends PureF ? Vector<A> : never;
  }
}

Object.defineProperty(Stream.prototype, 'head', {
  get<F, A>(this: Stream<F, A>): Stream<F, A> {
    return head(this);
  },
});
Object.defineProperty(Stream.prototype, 'headOption', {
  get<F, A>(this: Stream<F, A>): Stream<F, Option<A>> {
    return headOption(this);
  },
});

Object.defineProperty(Stream.prototype, 'tail', {
  get<F, A>(this: Stream<F, A>): Stream<F, A> {
    return tail(this);
  },
});

Object.defineProperty(Stream.prototype, 'last', {
  get<F, A>(this: Stream<F, A>): Stream<F, A> {
    return last(this);
  },
});
Object.defineProperty(Stream.prototype, 'lastOption', {
  get<F, A>(this: Stream<F, A>): Stream<F, Option<A>> {
    return lastOption(this);
  },
});

Object.defineProperty(Stream.prototype, 'init', {
  get<F, A>(this: Stream<F, A>): Stream<F, A> {
    return init(this);
  },
});

Object.defineProperty(Stream.prototype, 'uncons', {
  get<F, A>(this: Stream<F, A>): Stream<F, Option<[A, Stream<F, A>]>> {
    return uncons(this);
  },
});

Object.defineProperty(Stream.prototype, 'repeat', {
  get<F, A>(this: Stream<F, A>): Stream<F, A> {
    return repeat(this);
  },
});

Object.defineProperty(Stream.prototype, 'drain', {
  get<F, A>(this: Stream<F, A>): Stream<F, never> {
    return drain(this);
  },
});

Stream.prototype.prepend = function (x) {
  return prepend_(this, x);
};

Stream.prototype.prependChunk = function (c) {
  return prependChunk_(this, c);
};

Stream.prototype.take = function (n) {
  return take_(this, n);
};
Stream.prototype.takeRight = function (n) {
  return takeRight_(this, n);
};
Stream.prototype.takeWhile = function (pred, takeFailure) {
  return takeWhile_(this, pred, takeFailure);
};

Stream.prototype.drop = function (n) {
  return drop_(this, n);
};
Stream.prototype.dropRight = function (n) {
  return dropRight_(this, n);
};
Stream.prototype.dropWhile = function (pred, dropFailure) {
  return dropWhile_(this, pred, dropFailure);
};

Stream.prototype.concat = function (that) {
  return concat_(this, that);
};
Stream.prototype['+++'] = Stream.prototype.concat;

Object.defineProperty(Stream.prototype, 'chunks', {
  get<F, A>(this: Stream<F, A>): Stream<F, Chunk<A>> {
    return chunks(this);
  },
});

Object.defineProperty(Stream.prototype, 'chunkAll', {
  get<F, A>(this: Stream<F, A>): Stream<F, Chunk<A>> {
    return chunkAll(this);
  },
});

Stream.prototype.chunkLimit = function (limit) {
  return chunkLimit_(this, limit);
};

Stream.prototype.chunkMin = function (n, allowFewerTotal) {
  return chunkMin_(this, n, allowFewerTotal);
};

Stream.prototype.chunkN = function (n, allowFewer) {
  return chunkN_(this, n, allowFewer);
};

Object.defineProperty(Stream.prototype, 'unchunks', {
  get<F, A>(this: Stream<F, Chunk<A>>): Stream<F, A> {
    return unchunks(this);
  },
});

Stream.prototype.sliding = function (size, step) {
  return sliding_(this, size, step);
};

Stream.prototype.changes = function (E = Eq.fromUniversalEquals()) {
  return changes(E as Eq<any>)(this);
};

Stream.prototype.filter = function (pred) {
  return filter_(this, pred);
};
Stream.prototype.filterNot = function (pred) {
  return filterNot_(this, pred);
};
Stream.prototype.filterWithPrevious = function (f) {
  return filterWithPrevious_(this, f);
};
Stream.prototype.collect = function (f) {
  return collect_(this, f);
};
Stream.prototype.collectFirst = function (f) {
  return collectFirst_(this, f);
};
Stream.prototype.collectWhile = function (f) {
  return collectWhile_(this, f);
};

Stream.prototype.as = function (r) {
  return map_(this, () => r);
};

Stream.prototype.mapChunks = function (f) {
  return mapChunks_(this, f);
};

Stream.prototype.map = function (f) {
  return map_(this, f);
};
Stream.prototype.mapNoScope = function (f) {
  return mapNoScope_(this, f);
};

Stream.prototype.mapAccumulate = function (s) {
  return f => mapAccumulate_(this, s, f);
};

Stream.prototype.evalMap = function (f) {
  return evalMap_(this, f);
};
Stream.prototype.evalCollect = function (f) {
  return evalCollect_(this, f);
};
Stream.prototype.evalTap = function (F) {
  return f => evalTap_(F)(this, f);
};

Stream.prototype.evalMapChunk = function (F) {
  return f => evalMapChunk_(F)(this, f);
};

Stream.prototype.flatMap = function (f) {
  return flatMap_(this, f);
};

Object.defineProperty(Stream.prototype, 'flatten', {
  get<F, A>(this: Stream<F, Stream<F, A>>): Stream<F, A> {
    return flatten(this);
  },
});

Stream.prototype.through = function (f) {
  return through_(this, f);
};

Stream.prototype.through2 = function (that, f) {
  return through2_(this, that, f);
};

Stream.prototype.throughF = function (f) {
  return throughF_(this, f);
};

Stream.prototype.fold = function (z, f) {
  return fold_(this, z, f);
};

Stream.prototype.foldMap = function (M) {
  return f => foldMap_(M)(this, f);
};

Stream.prototype.foldMapK = function (G) {
  return f => foldMapK_(G)(this, f);
};

Stream.prototype.scan = function (z, f) {
  return scan_(this, z, f);
};

Stream.prototype.scan1 = function (f) {
  return scan1_(this, f);
};

Stream.prototype.evalScan = function (z, f) {
  return evalScan_(this, z, f);
};

Stream.prototype.scanChunks = function (init, f) {
  return scanChunks_(this, init, f);
};

Stream.prototype.scanChunksOpt = function (init, f) {
  return scanChunksOpt_(this, init, f);
};

Object.defineProperty(Stream.prototype, 'noneTerminate', {
  get<F, A>(this: Stream<F, A>): Stream<F, Option<A>> {
    return noneTerminate(this);
  },
});

Stream.prototype.unNoneTerminate = function () {
  return unNoneTerminate(this);
};

Stream.prototype.intersperse = function (separator) {
  return intersperse_(this, separator);
};

Stream.prototype.align = function (that) {
  return align_(this, that);
};

Stream.prototype.zip = function (that) {
  return zip_(this, that);
};
Stream.prototype.zipLeft = function (that) {
  return zipLeft_(this, that);
};
Stream.prototype.zipRight = function (that) {
  return zipRight_(this, that);
};

Stream.prototype.zipWith = function (that, f) {
  return zipWith_(this, that)(f);
};

Object.defineProperty(Stream.prototype, 'zipWithIndex', {
  get<F, A>(this: Stream<F, A>): Stream<F, [A, number]> {
    return zipWithIndex(this);
  },
});

Object.defineProperty(Stream.prototype, 'zipWithNext', {
  get<F, A>(this: Stream<F, A>): Stream<F, [A, Option<A>]> {
    return zipWithNext(this);
  },
});

Object.defineProperty(Stream.prototype, 'zipWithPrevious', {
  get<F, A>(this: Stream<F, A>): Stream<F, [Option<A>, A]> {
    return zipWithPrevious(this);
  },
});

Stream.prototype.zipAll = function (that) {
  return (pad1, pad2) => zipAll_(this, that, pad1, pad2);
};

Stream.prototype.zipAllWith = function (that) {
  return (pad1, pad2) => zipAllWith_(this, that, pad1, pad2);
};

Stream.prototype.merge = function (F) {
  return that => merge_(F)(this, that);
};

Stream.prototype.mergeHaltBoth = function (F) {
  return that => mergeHaltBoth_(F)(this, that);
};
Stream.prototype.mergeHaltL = function (F) {
  return that => mergeHaltL_(F)(this, that);
};
Stream.prototype.mergeHaltR = function (F) {
  return that => mergeHaltR_(F)(this, that);
};

Stream.prototype.parJoin = function (F) {
  return maxOpen => parJoin_(F)(this, maxOpen);
};

Stream.prototype.parJoinUnbounded = function (F) {
  return parJoinUnbounded(F)(this);
};

Object.defineProperty(Stream.prototype, 'attempt', {
  get<F, A>(this: Stream<F, A>): Stream<F, Either<Error, A>> {
    return attempt(this);
  },
});

Stream.prototype.attempts = function (F) {
  return delays => attempts_(F)(this, delays);
};

Stream.prototype.redeemWith = function (h, f) {
  return redeemWith_(this, h, f);
};

Object.defineProperty(Stream.prototype, 'rethrow', {
  get<F, A>(this: Stream<F, Either<Error, A>>): Stream<F, A> {
    return rethrow(this);
  },
});

Stream.prototype.handleErrorWith = function (h) {
  return handleErrorWith_(this, h);
};

Stream.prototype.delayBy = function (F) {
  return ms => delayBy_(F)(this, ms);
};

Stream.prototype.spaced = function (F) {
  return ms => spaced_(F)(this, ms);
};

Stream.prototype.onFinalize = function (F) {
  return fin => onFinalize_(F)(this, fin);
};

Stream.prototype.interruptWhenTrue = function (F) {
  return haltWhenTrue => interruptWhenTrue_(F)(this, haltWhenTrue);
};
Stream.prototype.interruptWhen = function (haltOnSignal) {
  return interruptWhen_(this, haltOnSignal);
};

Object.defineProperty(Stream.prototype, 'scope', {
  get<F, A>(this: Stream<F, A>): Stream<F, A> {
    return scope(this);
  },
});

Object.defineProperty(Stream.prototype, 'interruptScope', {
  get<F, A>(this: Stream<F, A>): Stream<F, A> {
    return interruptScope(this);
  },
});

Stream.prototype.concurrently = function (F) {
  return that => concurrently_(F)(this, that);
};

Stream.prototype.enqueueNoneTerminated = function (q) {
  return enqueueNoneTerminated_(this, q);
};
Stream.prototype.enqueueNoneTerminatedChunks = function (q) {
  return enqueueNoneTerminatedChunks_(this, q);
};

Stream.prototype.covary = function () {
  return covary()(this) as any;
};
Stream.prototype.covaryOutput = function () {
  return covaryOutput()(this) as any;
};
Stream.prototype.covaryAll = function () {
  return covaryAll()(this) as any;
};

Stream.prototype.mapK = function (nt) {
  return mapK_(this, nt);
};

Stream.prototype.compile = function (compiler = Compiler.Pure) {
  return compile(this, compiler);
};

Stream.prototype.compileSync = function (this: any, F = SyncIO.Sync) {
  return compileSync(this, F as any);
} as any;

Stream.prototype.compileConcurrent = function (this: any, F = IO.Concurrent) {
  return compileConcurrent(this, F as any);
} as any;

Object.defineProperty(Stream.prototype, 'toList', {
  get<A>(this: Stream<PureF, A>): List<A> {
    return this.compile().toList;
  },
});

Object.defineProperty(Stream.prototype, 'toVector', {
  get<A>(this: Stream<PureF, A>): Vector<A> {
    return this.compile().toVector;
  },
});
