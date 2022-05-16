import {
  validateBlocksEvent,
  validateSnapshotsEvent,
  validateTransactionByAddressEvent,
  validateTransactionByHashEvent,
} from "../src/validation";
import { APIGatewayEvent } from "aws-lambda";
import { Lens } from "monocle-ts";
import { isLeft, right } from "fp-ts/lib/Either";
import { pipe } from "fp-ts/lib/pipeable";

const baseEvent: APIGatewayEvent = {
  httpMethod: "get",
  isBase64Encoded: false,
  path: "",
  resource: "",
  body: null,
  headers: {},
  multiValueHeaders: {},
  pathParameters: null,
  queryStringParameters: null,
  multiValueQueryStringParameters: null,
  stageVariables: null,
  requestContext: {} as any,
};

const pathParams = Lens.fromProp<APIGatewayEvent>()("pathParameters");
const queryParams = Lens.fromProp<APIGatewayEvent>()("queryStringParameters");

const setParam = (param: string, value: string) =>
  pathParams.modify((a) => ({ ...a, [param]: value }));
const setTerm = (term: string) => setParam("term", term);
const setSearchAfter = (searchAfter: string) =>
  queryParams.modify((a) => ({ ...a, search_after: searchAfter }));
const setLimit = (limit: string) =>
  queryParams.modify((a) => ({ ...a, limit }));

describe("validateSnapshotsEvent ", () => {
  it("should not pass when no term in path parameter is provided", async () => {
    const event = baseEvent;

    const result = await validateSnapshotsEvent(event)();

    expect(isLeft(result)).toBe(true);
  });

  it("should pass returning event when term in path parameter is present", async () => {
    const event = setTerm("123")(baseEvent);

    const result = await validateSnapshotsEvent(event)();
    const expected = right(event);

    expect(result).toStrictEqual(expected);
  });
});

describe("validateBlocksEvent", () => {
  it("should not pass when no term in path parameter is provided", async () => {
    const event = baseEvent;

    const result = await validateBlocksEvent(event)();

    expect(isLeft(result)).toBe(true);
  });

  it("should pass returning event when term in path parameter is present", async () => {
    const event = setParam("hash", "hash")(baseEvent);

    const result = await validateBlocksEvent(event)();
    const expected = right(event);

    expect(result).toStrictEqual(expected);
  });
});

describe("validateTransactionByHashEvent", () => {
  it("should not pass when no term in path parameter is provided", async () => {
    const event = pipe(baseEvent, setLimit("2"), setSearchAfter("aa"));

    const result = await validateTransactionByHashEvent(event)();

    expect(isLeft(result)).toBe(true);
  });

  it("should pass when searchAfter is provided but limit not", async () => {
    const event = pipe(
      baseEvent,
      setParam("hash", "foo"),
      setSearchAfter("aa")
    );

    const result = await validateTransactionByHashEvent(event)();
    const expected = right(event);

    expect(result).toStrictEqual(expected);
  });

  it("should pass when limit is provided but searchAfter not", async () => {
    const event = pipe(baseEvent, setParam("hash", "foo"), setLimit("12"));

    const result = await validateTransactionByHashEvent(event)();
    const expected = right(event);

    expect(result).toStrictEqual(expected);
  });

  it("should pass returning event when term in path parameter is present", async () => {
    const event = setParam("hash", "foo")(baseEvent);

    const result = await validateTransactionByHashEvent(event)();
    const expected = right(event);

    expect(result).toStrictEqual(expected);
  });

  it("should pass returning event when both searchAfter and limit are provided", async () => {
    const event = pipe(
      baseEvent,
      setParam("hash", "foo"),
      setSearchAfter("aa"),
      setLimit("2")
    );

    const result = await validateTransactionByHashEvent(event)();
    const expected = right(event);

    expect(result).toStrictEqual(expected);
  });
});

describe("validateTransactionByAddressEvent", () => {
  it("should not pass when no term in path parameter is provided", async () => {
    const event = pipe(baseEvent, setLimit("2"), setSearchAfter("aa"));

    const result = await validateTransactionByAddressEvent(event)();

    expect(isLeft(result)).toBe(true);
  });

  it("should pass when searchAfter is provided but limit not", async () => {
    const event = pipe(
      baseEvent,
      setParam("address", "123"),
      setSearchAfter("aa")
    );

    const result = await validateTransactionByAddressEvent(event)();
    const expected = right(event);

    expect(result).toStrictEqual(expected);
  });

  it("should pass when limit is provided but searchAfter not", async () => {
    const event = pipe(baseEvent, setParam("address", "123"), setLimit("12"));

    const result = await validateTransactionByAddressEvent(event)();
    const expected = right(event);

    expect(result).toStrictEqual(expected);
  });

  it("should pass returning event when term in path parameter is present", async () => {
    const event = setParam("address", "123")(baseEvent);

    const result = await validateTransactionByAddressEvent(event)();
    const expected = right(event);

    expect(result).toStrictEqual(expected);
  });

  it("should pass returning event when both searchAfter and limit are provided", async () => {
    const event = pipe(
      baseEvent,
      setParam("address", "123"),
      setSearchAfter("aa"),
      setLimit("2")
    );

    const result = await validateTransactionByAddressEvent(event)();
    const expected = right(event);

    expect(result).toStrictEqual(expected);
  });
});
