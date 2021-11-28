// Copyright (c) 2021 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import '../../../benchmarking';
import { pipe } from '@fp4ts/core';
import { Either, List, Some } from '@fp4ts/cats-core/lib/data';
import { IO } from '@fp4ts/effect-core';

const size = 1000;
const ticks = 1000;

const consumeTicks = (n: number): IO<void> =>
  IO.async(cb =>
    IO(() => {
      let canceled = false;
      const onCancel = IO(() => (canceled = false));

      const tick = () =>
        n-- > 0 && !canceled ? process.nextTick(tick) : cb(Either.rightUnit);
      tick();

      return Some(onCancel.void);
    }),
  );

pipe(
  benchmark('parTraverse', async () => {
    const arr = List.fromArray([...new Array(size).keys()]);

    await IO.parTraverse_(List.Traversable)(arr, () =>
      consumeTicks(ticks),
    ).unsafeRunToPromise();
  }),
  runBenchmark(),
);
