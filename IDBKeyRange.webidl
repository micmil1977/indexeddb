[Exposed=(Window,Worker)]
interface IDBKeyRange {
  readonly attribute any lower;
  readonly attribute any upper;
  readonly attribute boolean lowerOpen;
  readonly attribute boolean upperOpen;

  // Static construction methods:
  [NewObject] static IDBKeyRange only(any value);
  [NewObject] static IDBKeyRange lowerBound(any lower, optional boolean open = false);
  [NewObject] static IDBKeyRange upperBound(any upper, optional boolean open = false);
  [NewObject] static IDBKeyRange bound(any lower,
                                       any upper,
                                       optional boolean lowerOpen = false,
                                       optional boolean upperOpen = false);

  boolean includes(any key);
};
