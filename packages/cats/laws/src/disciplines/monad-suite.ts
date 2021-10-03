import fc, { Arbitrary } from 'fast-check';
import { AnyK, Kind } from '@cats4ts/core';
import { Eq, Monad } from '@cats4ts/cats-core';
import { forAll, IsEq, RuleSet } from '@cats4ts/cats-test-kit';

import { MonadLaws } from '../monad-laws';
import { ApplicativeSuite } from './applicative-suite';
import { FlatMapSuite } from './flat-map-suite';

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const MonadSuite = <F extends AnyK>(F: Monad<F>) => {
  const {
    monadLeftIdentity,
    monadRightIdentity,
    kleisliLeftIdentity,
    kleisliRightIdentity,
    mapFlatMapCoherence,
    tailRecMStackSafety,
  } = MonadLaws(F);
  const self = {
    ...ApplicativeSuite(F),
    ...FlatMapSuite(F),

    monad: <A, B, C, D>(
      arbA: Arbitrary<A>,
      arbB: Arbitrary<B>,
      arbC: Arbitrary<C>,
      arbD: Arbitrary<D>,
      EqA: Eq<A>,
      EqB: Eq<B>,
      EqC: Eq<C>,
      EqD: Eq<D>,
      mkArbF: <X>(arbX: Arbitrary<X>) => Arbitrary<Kind<F, [X]>>,
      mkEqF: <X>(
        E: Eq<X>,
      ) => Eq<Kind<F, [X]>> | ((r: IsEq<Kind<F, [X]>>) => Promise<boolean>),
    ): RuleSet =>
      new RuleSet(
        'monad',
        [
          [
            'monad left identity',
            forAll(
              arbA,
              fc.func<[A], Kind<F, [B]>>(mkArbF(arbB)),
              monadLeftIdentity,
            )(mkEqF(EqB)),
          ],
          [
            'monad right identity',
            forAll(mkArbF(arbA), monadRightIdentity)(mkEqF(EqA)),
          ],
          [
            'monad kleisli left identity',
            forAll(
              arbA,
              fc.func<[A], Kind<F, [B]>>(mkArbF(arbB)),
              kleisliLeftIdentity,
            )(mkEqF(EqB)),
          ],
          [
            'monad kleisli right identity',
            forAll(
              arbA,
              fc.func<[A], Kind<F, [B]>>(mkArbF(arbB)),
              kleisliRightIdentity,
            )(mkEqF(EqB)),
          ],
          [
            'monad map coherence',
            forAll(
              mkArbF(arbA),
              fc.func<[A], B>(arbB),
              mapFlatMapCoherence,
            )(mkEqF(EqB)),
          ],
          [
            'monad tailRecM stack safety',
            () => {
              const res = tailRecMStackSafety();
              const E = mkEqF(Eq.primitive);
              if (typeof E === 'function') {
                return expect(E(res)).resolves.toBe(true);
              }
              const { lhs, rhs } = res;
              return expect(E.equals(lhs, rhs)).toBe(true);
            },
          ],
        ],
        {
          parents: [
            self.flatMap(
              arbA,
              arbB,
              arbC,
              arbD,
              EqA,
              EqB,
              EqC,
              EqD,
              mkArbF,
              mkEqF,
            ),
            self.applicative(arbA, arbB, arbC, EqA, EqB, EqC, mkArbF, mkEqF),
          ],
        },
      ),

    stackUnsafeMonad: <A, B, C, D>(
      arbA: Arbitrary<A>,
      arbB: Arbitrary<B>,
      arbC: Arbitrary<C>,
      arbD: Arbitrary<D>,
      EqA: Eq<A>,
      EqB: Eq<B>,
      EqC: Eq<C>,
      EqD: Eq<D>,
      mkArbF: <X>(arbX: Arbitrary<X>) => Arbitrary<Kind<F, [X]>>,
      mkEqF: <X>(
        E: Eq<X>,
      ) => Eq<Kind<F, [X]>> | ((r: IsEq<Kind<F, [X]>>) => Promise<boolean>),
    ): RuleSet =>
      new RuleSet(
        'monad',
        [
          [
            'monad left identity',
            forAll(
              arbA,
              fc.func<[A], Kind<F, [B]>>(mkArbF(arbB)),
              monadLeftIdentity,
            )(mkEqF(EqB)),
          ],
          [
            'monad right identity',
            forAll(mkArbF(arbA), monadRightIdentity)(mkEqF(EqA)),
          ],
          [
            'monad kleisli left identity',
            forAll(
              arbA,
              fc.func<[A], Kind<F, [B]>>(mkArbF(arbB)),
              kleisliLeftIdentity,
            )(mkEqF(EqB)),
          ],
          [
            'monad kleisli right identity',
            forAll(
              arbA,
              fc.func<[A], Kind<F, [B]>>(mkArbF(arbB)),
              kleisliRightIdentity,
            )(mkEqF(EqB)),
          ],
          [
            'monad map coherence',
            forAll(
              mkArbF(arbA),
              fc.func<[A], B>(arbB),
              mapFlatMapCoherence,
            )(mkEqF(EqB)),
          ],
        ],
        {
          parents: [
            self.flatMap(
              arbA,
              arbB,
              arbC,
              arbD,
              EqA,
              EqB,
              EqC,
              EqD,
              mkArbF,
              mkEqF,
            ),
            self.applicative(arbA, arbB, arbC, EqA, EqB, EqC, mkArbF, mkEqF),
          ],
        },
      ),
  };
  return self;
};
