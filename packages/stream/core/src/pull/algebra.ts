// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Kind } from '@fp4ts/core';
import { FunctionK, Either, Option, None, Some } from '@fp4ts/cats';
import { UniqueToken, ExitCase } from '@fp4ts/effect';

import { Chunk } from '../chunk/algebra';
import { Scope } from '../internal';

export abstract class Pull<out F, out O, out R> {
  readonly __void!: void;
  readonly _F!: <X>() => Kind<F, [X]>;
  readonly _O!: () => O;
  readonly _R!: () => R;
}

export class Succeed<R> extends Pull<any, never, R> {
  public readonly tag = 'succeed';
  public constructor(public readonly result: R) {
    super();
  }
}

export class Fail extends Pull<any, never, never> {
  public readonly tag = 'fail';
  public constructor(public readonly error: Error) {
    super();
  }
}

export class Interrupted extends Pull<any, never, never> {
  public readonly tag = 'interrupted';
  public constructor(
    public readonly context: UniqueToken,
    public readonly deferredError: Option<Error>,
  ) {
    super();
  }
}

export type Terminal<R> = Succeed<R> | Fail | Interrupted;

export class Output<F, O> extends Pull<F, O, void> {
  public readonly tag = 'output';
  public constructor(public readonly values: Chunk<O>) {
    super();
  }
}

export class Translate<G, F, O> extends Pull<F, O, void> {
  public readonly tag = 'translate';
  public constructor(
    public readonly self: Pull<G, O, void>,
    public readonly nt: FunctionK<G, F>,
  ) {
    super();
  }
}

export class FlatMapOutput<F, O, P> extends Pull<F, P, void> {
  public readonly tag = 'flatMapOutput';
  public constructor(
    public readonly self: Pull<F, O, void>,
    public readonly fun: (o: O) => Pull<F, P, void>,
  ) {
    super();
  }
}

export class Uncons<F, O> extends Pull<
  F,
  never,
  Option<[Chunk<O>, Pull<F, O, void>]>
> {
  public readonly tag = 'uncons';
  public constructor(public readonly self: Pull<F, O, void>) {
    super();
  }
}

export class Eval<F, R> extends Pull<F, never, R> {
  public readonly tag = 'eval';
  public constructor(public readonly value: Kind<F, [R]>) {
    super();
  }
}

export class Acquire<F, R> extends Pull<F, never, R> {
  public readonly tag = 'acquire';
  public constructor(
    public readonly resource: Kind<F, [R]>,
    public readonly release: (r: R, ec: ExitCase) => Kind<F, [void]>,
    public readonly cancelable: boolean,
  ) {
    super();
  }
}

export class InterruptWhen<F> extends Pull<F, never, void> {
  public readonly tag = 'interruptWhen';
  public constructor(
    public readonly haltOnSignal: Kind<F, [Either<Error, void>]>,
  ) {
    super();
  }
}

export class SucceedScope extends Pull<any, never, void> {
  public readonly tag = 'succeedScope';
  public readonly exitCase: ExitCase = ExitCase.Succeeded;
  public readonly interruption: Option<Interrupted> = None;
  public constructor(public readonly scopeId: UniqueToken) {
    super();
  }
}

export class CanceledScope extends Pull<any, never, void> {
  public readonly tag = 'canceledScope';
  public readonly exitCase: ExitCase = ExitCase.Canceled;
  public readonly interruption: Option<Interrupted>;
  public constructor(public readonly scopeId: UniqueToken, inter: Interrupted) {
    super();
    this.interruption = Some(inter);
  }
}

export class FailedScope extends Pull<any, never, void> {
  public readonly tag = 'failedScope';
  public readonly exitCase: ExitCase;
  public readonly interruption: Option<Interrupted> = None;
  public constructor(public readonly scopeId: UniqueToken, error: Error) {
    super();
    this.exitCase = ExitCase.Errored(error);
  }
}

export type CloseScope = SucceedScope | CanceledScope | FailedScope;

export class GetScope<F> extends Pull<F, never, Scope<F>> {
  public readonly tag = 'getScope';
}

export type AlgEffect<F, R> =
  | Acquire<F, R>
  | Eval<F, R>
  | InterruptWhen<F>
  | GetScope<F>
  | CloseScope;

export class InScope<F, O> extends Pull<F, O, void> {
  public readonly tag = 'inScope';
  public constructor(
    public readonly self: Pull<F, O, void>,
    public readonly useInterruption: boolean,
  ) {
    super();
  }
}

export type Action<F, O, R> =
  | Output<F, O>
  | Translate<any, F, O>
  | FlatMapOutput<F, any, O>
  | AlgEffect<F, R>
  | Uncons<F, O>
  | InScope<F, O>;

export class Bind<F, O, X, R> extends Pull<F, O, R> {
  public readonly tag = 'bind';
  public constructor(
    public readonly step: Pull<F, O, X>,
    public readonly cont: (r: Terminal<X>) => Pull<F, O, R>,
  ) {
    super();
  }
}

export type View<F, O, R> = Terminal<R> | Action<F, O, R> | Bind<F, O, any, R>;

export const view = <F, O, R>(_: Pull<F, O, R>): View<F, O, R> => _ as any;
