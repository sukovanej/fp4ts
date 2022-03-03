export const MapK = 0;
export const FlatMapK = 1;
export const HandleErrorWithK = 2;
export const AttemptK = 3;
export const OnCancelK = 4;
export const UncancelableK = 5;
export const UnmaskK = 6;
export const RunOnK = 7;
export const CancelationLoopK = 8;
export type Continuation =
  | typeof MapK
  | typeof FlatMapK
  | typeof HandleErrorWithK
  | typeof AttemptK
  | typeof OnCancelK
  | typeof UncancelableK
  | typeof UnmaskK
  | typeof RunOnK
  | typeof CancelationLoopK;
