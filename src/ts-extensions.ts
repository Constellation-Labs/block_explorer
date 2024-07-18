type FilterUndefined<T> = T extends undefined ? never : T;
type FilterNull<T> = T extends null ? never : T;
type FilterUndefinedAndNull<T> = FilterUndefined<FilterNull<T>>;

type ExtractFromObject<
  O extends Record<PropertyKey, unknown>,
  K
> = K extends keyof O
  ? O[K]
  : K extends keyof FilterUndefinedAndNull<O>
  ? FilterUndefinedAndNull<O>[K] | undefined
  : undefined;

type ExtractFromArray<A extends readonly any[], K> = any[] extends A
  ? A extends readonly (infer T)[]
    ? T | undefined
    : undefined
  : K extends keyof A
  ? A[K]
  : undefined;

type GetWithArray<O, K> = K extends []
  ? O
  : K extends [infer Key, ...infer Rest]
  ? O extends Record<PropertyKey, unknown>
    ? GetWithArray<ExtractFromObject<O, Key>, Rest>
    : O extends readonly any[]
    ? GetWithArray<ExtractFromArray<O, Key>, Rest>
    : undefined
  : never;

export type Path<T> = T extends `${infer Key}.${infer Rest}`
  ? [Key, ...Path<Rest>]
  : T extends `${infer Key}`
  ? [Key]
  : [];

export type Get<O, K> = GetWithArray<O, Path<K>>;

type Join<K, P> = K extends string | number
  ? P extends string | number
    ? `${K}${"" extends P ? "" : "."}${P}`
    : never
  : never;

type Prev = [
  never,
  0,
  1,
  2,
  3,
  4,
  5,
  6,
  7,
  8,
  9,
  10,
  11,
  12,
  13,
  14,
  15,
  16,
  17,
  18,
  19,
  20,
  ...0[]
];

export type Paths<T, D extends number = 10> = [D] extends [never]
  ? never
  : T extends object
  ? {
      [K in keyof T]-?: K extends string | number
        ? `${K}` | Join<K, Paths<T[K], Prev[D]>>
        : never;
    }[keyof T]
  : "";
