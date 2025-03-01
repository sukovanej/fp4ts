// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import fc from 'fast-check';
import { Char } from '@fp4ts/core';
import { Eq, Identity, Left, List, None, Right, Some } from '@fp4ts/cats';
import {
  Parser,
  ParseError,
  SourcePosition,
  StringSource,
} from '@fp4ts/parse-core';
import { Stream } from '@fp4ts/parse-kernel';
import { text } from '@fp4ts/parse-text';
import { forAll } from '@fp4ts/cats-test-kit';
import { eq, fp4tsStringParser, fp4tsStringParser0 } from './arbitraries';

const { anyChar, char, digit, parens, spaces, string, stringF } = text;

describe('Parser', () => {
  it('should parse a single character from a string', () => {
    expect(anyChar().parse('x')).toEqual(Right('x'));
  });

  it('should fail to parse a single character when the input is empty', () => {
    expect(anyChar().parse('')).toEqual(
      Left(new ParseError(new SourcePosition(1, 1), [expect.any(Object)])),
    );
  });

  it('should consume two characters from the input', () => {
    expect(anyChar().product(anyChar()).parse('xyz')).toEqual(
      Right(['x', 'y']),
    );
  });

  describe('optional', () => {
    it('should succeed with original parser when failed', () => {
      expect(
        char('x' as Char)
          .optional()
          .parse('x'),
      ).toEqual(Right(Some('x')));
    });

    it('should succeed with none when did not consume any input', () => {
      expect(
        Parser.fail<StringSource, never>('').optional().parse('x'),
      ).toEqual(Right(None));
      expect(
        char('y' as Char)
          .optional()
          .parse('x'),
      ).toEqual(Right(None));
    });

    it('should fail when the p consumes and fails', () => {
      expect(
        Parser.fail<StringSource, never>('').optional().parse('x'),
      ).toEqual(Right(None));
      expect(string('xy').optional().parse('x').isLeft).toBe(true);
    });
  });

  describe('flatMap', () => {
    it('should recover when the initial parser does not consume any input', () => {
      expect(
        char('x' as Char)
          .flatMap(() => Parser.succeed(42))
          .orElse(() => Parser.succeed(84))
          .parse('y'),
      ).toEqual(Right(84));
    });

    it('should not recover when the initial parser does consume some input', () => {
      expect(
        string('xy')
          .flatMap(() => Parser.succeed(42))
          .orElse(() => Parser.succeed(84))
          .parse('x').isLeft,
      ).toBe(true);
    });

    it('should recover from second failure when the first parser does not consume', () => {
      expect(
        char('x' as Char)
          .flatMap(() => Parser.fail(''))
          .orElse(() => Parser.succeed(84))
          .parse('y'),
      ).toEqual(Right(84));
    });

    it('should not recover from second failure when the first parser does consume', () => {
      expect(
        char('x' as Char)
          .flatMap(() => Parser.fail(''))
          .orElse(() => Parser.succeed(84))
          .parse('x').isLeft,
      ).toBe(true);
    });
  });

  describe('rep', () => {
    it('should throw when repeating empty parser', () => {
      expect(() => Parser.unit<StringSource>().rep().parse('')).toThrow();
    });

    it('should succeed to parse an empty input', () => {
      expect(anyChar().rep().parse('')).toEqual(Right(List.empty));
    });

    it(
      'should all of the characters from the input',
      forAll(fc.string(), s =>
        anyChar()
          .rep()
          .parse(s)
          .get.equals(Eq.fromUniversalEquals(), List.fromArray(s.split(''))),
      ),
    );

    it('should be stack safe', () => {
      const input = 'x'.repeat(1_000_000);
      expect(anyChar().rep().parse(input).isRight).toBe(true);
    });
  });

  describe('rep1', () => {
    it('should fail to parse an empty input', () => {
      expect(anyChar().rep1().parse('').isLeft).toBe(true);
    });

    it(
      'should all of the characters from the input and succeed only if the input is non-empty',
      forAll(fc.string(), s =>
        s !== ''
          ? anyChar()
              .rep1()
              .parse(s)
              .get.equals(Eq.fromUniversalEquals(), List.fromArray(s.split('')))
          : anyChar().rep1().parse(s).isLeft,
      ),
    );

    it('should be stack safe', () => {
      const input = 'x'.repeat(1_000_000);
      expect(anyChar().rep1().complete().parse(input).isRight).toBe(true);
    });
  });

  describe('expressions', () => {
    const add = (x: number, y: number) => x + y;
    const sub = (x: number, y: number) => x - y;
    const mul = (x: number, y: number) => x * y;
    const div = (x: number, y: number) => x / y;
    const exp = (x: number, y: number) => x ** y;

    /* eslint-disable prettier/prettier */
    const addOp =   char('+' as Char).as(add)
      ['<|>'](() => char('-' as Char).as(sub));
    const mulOp =   char('*' as Char).as(mul)
      ['<|>'](() => char('/' as Char).as(div));
    const expOp =   char('^' as Char).as(exp)

    const number = digit().rep1().map(xs => parseInt(xs.toArray.join('')));

    const atom: Parser<StringSource, number> =
      number['<|>'](() => parens(Parser.defer(() => expr)))
        .surroundedBy(spaces());
    const factor: Parser<StringSource, number> =
      atom.chainLeft1(expOp);
    const term: Parser<StringSource, number> =
      factor.chainLeft1(mulOp);
    const expr: Parser<StringSource, number> =
      term.chainLeft1(addOp);
    /* eslint-enable prettier/prettier */

    it.each`
      expr                      | result
      ${'12'}                   | ${12}
      ${'1+1'}                  | ${2}
      ${'4*3'}                  | ${12}
      ${'2+4*3'}                | ${14}
      ${'(2+4)*3'}              | ${18}
      ${'2^3^3'}                | ${512}
      ${'( 2 +   4 ) *   3   '} | ${18}
    `('should parse "$expr" into $result', ({ expr: e, result }) => {
      expect(expr.chainLeft1(addOp).parse(e)).toEqual(Right(result));
    });

    it('should be stack safe', () => {
      const input = '1' + '+1'.repeat(50_000);

      expect(expr.complete().parse(input)).toEqual(Right(50_001));
    });
  });

  describe('message formatting', () => {
    it("should print unexpected '3', expecting space or ','", () => {
      expect(
        digit()
          .sepBy(char(',' as Char).surroundedBy(spaces()))
          .complete()
          .parse('1, 2 3')
          .leftMap(e => e.toString()).getLeft,
      ).toEqual(`(line: 1, column: 6)
unexpected '3'
expecting space or ','`);
    });

    it('should print expecting digit', () => {
      const number = digit()
        .repAs1<string>((x, y) => x + y)
        .map(parseInt);

      // prettier-ignore
      const addOp =   char('+' as Char).as((x: number, y: number) => x + y)
        ['<|>'](() => char('-' as Char).as((x: number, y: number) => x - y));

      const expr = number.chainLeft1(addOp).complete();

      expect(expr.parse('1+1+').leftMap(p => p.toString())).toEqual(
        Left(`(line: 1, column: 5)
unexpected end of input
expecting digit`),
      );
    });
  });

  describe('Laws', () => {
    test(
      'consume identity input',
      forAll(fc.string(), s => string(s).parse(s).get === s),
    );

    test(
      'consume identity input',
      forAll(fc.string(), s => stringF(s).parse(s).get === s),
    );

    test(
      'label to be identity',
      forAll(fp4tsStringParser0(), fc.string(), (p, s) =>
        p
          .label('my helpful message')
          .parse(s)
          .fold(
            () => p.parse(s).isLeft,
            x => {
              expect(x).toEqual(p.parse(s).get);
              return true;
            },
          ),
      ),
    );

    test(
      'p.void <=> p.map(() => undefined)',
      forAll(fp4tsStringParser0(), fc.string(), (p, s) =>
        eq(p.void.parse(s), p.map(() => undefined).parse(s)),
      ),
    );

    test(
      'p orElse p is p',
      forAll(fp4tsStringParser0(), fc.string(), (p, s) => {
        expect(p.orElse(() => p).parse(s).toOption).toEqual(
          p.parse(s).toOption,
        );
        return true;
      }),
    );

    test(
      'p1 backtrack orElse p2 succeeds if p1 or p2 succeeds',
      forAll(
        fp4tsStringParser0(),
        fp4tsStringParser0(),
        fc.string(),
        (p1, p2, s) => {
          const r = p1
            .backtrack()
            .orElse(() => p2)
            .parse(s);
          const p1r = p1.parse(s);
          const p2r = p2.parse(s);

          return r.isRight === (p1r.isRight || p2r.isRight);
        },
      ),
    );

    test(
      'orElse map distributes',
      forAll(
        fp4tsStringParser0(),
        fp4tsStringParser0(),
        fc.func<[string], string>(fc.string()),
        fc.string(),
        (l, r, f, s) => {
          const r1 = l
            .orElse(() => r)
            .map(f)
            .parse(s);
          const r2 = l
            .map(f)
            .orElse(() => r.map(f))
            .parse(s);
          expect(r1).toEqual(r2);
          return true;
        },
      ),
    );

    test(
      'backtrack orElse succeed always succeeds',
      forAll(
        fp4tsStringParser0(),
        fc.string(),
        (p, s) =>
          p
            .backtrack()
            .orElse(() => Parser.succeed(''))
            .parse(s).isRight,
      ),
    );

    test(
      'a.backtrack orElse b succeeds iff b.backtrack orElse a succeeds',
      forAll(
        fp4tsStringParser0(),
        fp4tsStringParser0(),
        fc.string(),
        (l, r, s) =>
          l
            .backtrack()
            .orElse(() => r)
            .parse(s).isRight ===
          r
            .backtrack()
            .orElse(() => l)
            .parse(s).isRight,
      ),
    );

    test(
      'backtrack either succeeds or fails without consuming any input',
      forAll(fp4tsStringParser0(), fc.string(), (p, s) => {
        const r = p
          .backtrack()
          .parseConsumedF(Stream.forSource(Identity.Monad))(
          StringSource.fromString(s),
        );

        return r.tag === 'consumed'
          ? r.value.fold(
              () => true,
              () => false,
            )
          : true;
      }),
    );

    test(
      'rep1 consistent with product . rep',
      forAll(fp4tsStringParser(), fc.string(), (p, s) => {
        const rep1 = p.rep1().parse(s);
        const rep = p.flatMap(x => p.rep().map(xs => xs.prepend(x))).parse(s);
        expect(rep1).toEqual(rep);
        return true;
      }),
    );

    test(
      'rep is sepBy uni',
      forAll(fp4tsStringParser(), fc.string(), (p, s) => {
        const lhs = p.rep().parse(s);
        const rhs = p.sepBy(Parser.unit()).parse(s);
        expect(lhs).toEqual(rhs);
        return true;
      }),
    );

    test(
      'p1 between p2 p3 is p2 *> p1 <* p3',
      forAll(
        fp4tsStringParser0(),
        fp4tsStringParser0(),
        fp4tsStringParser0(),
        fc.string(),
        (p1, p2, p3, s) =>
          eq(p1.between(p2, p3).parse(s), p2['*>'](p1)['<*'](p3).parse(s)),
      ),
    );

    test(
      'surroundedBy consistent with between',
      forAll(
        fp4tsStringParser0(),
        fp4tsStringParser0(),
        fc.string(),
        (p1, p2, s) =>
          eq(p1.surroundedBy(p2).parse(s), p1.between(p2, p2).parse(s)),
      ),
    );

    test(
      'complete parse consistent with notFollowedBy anyToken',
      forAll(fp4tsStringParser0(), fc.string(), (p, s) => {
        const l = p.complete().parse(s);
        const r = p.notFollowedBy(Parser.anyToken()).parse(s);
        return (l.isLeft && r.isLeft) || (expect(l).toEqual(r), true);
      }),
    );
  });
});
