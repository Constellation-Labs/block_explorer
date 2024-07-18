import {
  extractPagination,
  validateHashParam,
  validateTermParam,
} from "../src/request-params";
import { APIGatewayEvent } from "aws-lambda";
import { Lens } from "monocle-ts";
import { isLeft, isRight, right } from "fp-ts/lib/Either";
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
const setSearchAfter = (search_after: string) =>
  queryParams.modify((a) => ({ ...a, search_after }));
const setSearchBefore = (search_before: string) =>
  queryParams.modify((a) => ({ ...a, search_before }));
const setLimit = (limit: string) =>
  queryParams.modify((a) => ({ ...a, limit }));

describe("validateTermParam ", () => {
  it("should not pass when no term in path parameter is provided", async () => {
    const result = await validateTermParam(baseEvent)();

    expect(isLeft(result)).toBe(true);
  });

  it("should pass returning event when term in path parameter is present", async () => {
    const event = setTerm("123")(baseEvent);

    const result = await validateTermParam(event)();
    const expected = right(event);

    expect(result).toStrictEqual(expected);
  });
});

describe("validateHashParam", () => {
  it("should not pass when no hash in path parameter is provided", async () => {
    const result = await validateHashParam(baseEvent)();

    expect(isLeft(result)).toBe(true);
  });

  it("should pass returning event when hash in path parameter is present", async () => {
    const event = setParam("hash", "hash")(baseEvent);

    const result = await validateHashParam(event)();
    const expected = right(event);

    expect(result).toStrictEqual(expected);
  });
});

describe("extractPagination", () => {
  it("should not pass when both search_after and search_before", async () => {
    const event = pipe(
      baseEvent,
      setLimit("2"),
      setSearchAfter("aa"),
      setSearchBefore("bb")
    );

    const result = await extractPagination(event)();

    expect(isLeft(result)).toBe(true);
  });

  it("should pass when searchAfter is provided but limit not", async () => {
    const event = pipe(
      baseEvent,
      setParam("address", "123"),
      setSearchAfter("aa")
    );

    const result = await extractPagination(event)();
    expect(isRight(result)).toBe(true);
  });

  it("should pass when limit is provided but searchAfter not", async () => {
    const event = pipe(baseEvent, setParam("address", "123"), setLimit("12"));

    const result = await extractPagination(event)();
    right(event);
    expect(isRight(result)).toBe(true);
  });

  it("should pass returning event when both searchAfter and limit are provided", async () => {
    const event = pipe(
      baseEvent,
      setParam("address", "123"),
      setSearchAfter("aa"),
      setLimit("2")
    );

    const result = await extractPagination(event)();
    right(event);
    expect(isRight(result)).toBe(true);
  });

  it("should pass returning event when both searchBefore and limit are provided", async () => {
    const event = pipe(
      baseEvent,
      setParam("address", "123"),
      setSearchBefore("aa"),
      setLimit("2")
    );

    const result = await extractPagination(event)();

    expect(isRight(result)).toBe(true);
  });
});
