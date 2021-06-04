[Exposed=(Window,Worker)]
interface IDBCursor {
  readonly attribute (IDBObjectStore or IDBIndex) source;
  readonly attribute IDBCursorDirection direction;
  readonly attribute any key;
  readonly attribute any primaryKey;
  [SameObject] readonly attribute IDBRequest request;

  undefined advance([EnforceRange] unsigned long count);
  undefined continue(optional any key);
  undefined continuePrimaryKey(any key, any primaryKey);

  [NewObject] IDBRequest update(any value);
  [NewObject] IDBRequest delete();
};

enum IDBCursorDirection {
  "next",
  "nextunique",
  "prev",
  "prevunique"
};
