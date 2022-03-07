// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Either, IdentityF, NonEmptyList } from '@fp4ts/cats';
import { Header, SelectHeader, RawHeader, SingleSelectHeader } from '../header';
import { MediaType } from '../media-type';

export class ContentType {
  public constructor(public readonly mediaType: MediaType) {}

  public toRaw(): NonEmptyList<RawHeader> {
    return ContentType.Select.toRaw(this);
  }

  public static readonly Header: Header<ContentType, 'single'> = {
    headerName: 'Content-Type',
    value(a: ContentType): string {
      return `${a.mediaType.mainType}/${a.mediaType.subType}`;
    },
    parse(s: string): Either<Error, ContentType> {
      const [x = ''] = s.split(';');
      return MediaType.fromString(x).map(mt => new ContentType(mt));
    },
  };

  public static readonly Select: SelectHeader<IdentityF, ContentType> =
    new SingleSelectHeader(ContentType.Header);
}
