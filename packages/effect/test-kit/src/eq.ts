// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Eq, Option, Some, None, Try, Either } from '@fp4ts/cats';
import { SyncIO, IO, IORuntime, IOOutcome, IOF } from '@fp4ts/effect-core';
import { Outcome, ExecutionContext } from '@fp4ts/effect-kernel';

import { Ticker } from './ticker';

export * from '@fp4ts/cats-test-kit/lib/eq';

export const eqSyncIO = <A>(E: Eq<A>): Eq<SyncIO<A>> =>
  Eq.by(Try.Eq(Eq.Error.strict, E), x => Try(() => x.unsafeRunSync()));

export const eqIO = <A>(
  E: Eq<A>,
  ec: Ticker,
  autoSuspendThreshold: number = Infinity,
  traceBufferSize: number = 16,
): Eq<IO<A>> => {
  const _Eq = Option.Eq(Either.Eq(Eq.Error.strict, E));

  return Eq.by(_Eq, ioa => {
    let result: Option<Either<Error, A>> = None;
    ioa.unsafeRunAsync(
      ea => (result = Some(ea)),
      new IORuntime(ec.ctx, () => {}, {
        autoSuspendThreshold,
        traceBufferSize,
      }),
    );

    ec.ctx.tickAll();

    return result;
  });
};

export const eqIOOutcome = <A>(E: Eq<IO<A>>): Eq<IOOutcome<A>> =>
  Eq.by(Outcome.Eq<IOF, Error, A>(Eq.Error.strict, E), oc =>
    oc.fold(
      () => Outcome.canceled(),
      Outcome.failure,
      ioa => {
        if ((ioa as any).tag === 0) return (ioa as any).value;
        throw new Error('Unexpected IO result');
      },
    ),
  );

export const eqExecutionContext: Eq<ExecutionContext> =
  Eq.fromUniversalEquals();
