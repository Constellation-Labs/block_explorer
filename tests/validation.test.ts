import { extractPagination } from "../src/request-params";
import { APIGatewayEvent } from "aws-lambda";
import { Lens } from "monocle-ts";
import { pipe } from "fp-ts/function";

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

describe("extractPagination", () => {
  it("should not pass when both search_after and search_before", async () => {
    const event = pipe(
      baseEvent,
      setLimit("2"),
      setSearchAfter("aa"),
      setSearchBefore("bb")
    );

    const result = () => extractPagination(event);

    expect(result).toThrow(Error);
    expect(result).toThrow("search_after & search_before should be mutually exclusive");
  });

  it("should pass when searchAfter is provided but limit not", async () => {
    const event = pipe(
      baseEvent,
      setParam("address", "123"),
      setSearchAfter("aa")
    );

    const result = await extractPagination(event);
    expect(result).toEqual({searchDirection: "search_after", searchSince: "aa", size: NaN});
  });

  it("should pass when limit is provided but searchAfter not", async () => {
    const event = pipe(baseEvent, setParam("address", "123"), setLimit("12"));

    const result = await extractPagination(event);
    expect(result).toEqual({"searchDirection": undefined, "searchSince": undefined, "size": 12});
  });

  it("should pass returning event when both searchAfter and limit are provided", async () => {
    const event = pipe(
      baseEvent,
      setParam("address", "123"),
      setSearchAfter("aa"),
      setLimit("2")
    );

    const result = await extractPagination(event);
    expect(result).toEqual({"searchDirection": "search_after", "searchSince": "aa", "size": 2});
  });

  it("should pass returning event when both searchBefore and limit are provided", async () => {
    const event = pipe(
      baseEvent,
      setParam("address", "123"),
      setSearchBefore("aa"),
      setLimit("2")
    );

    const result = await extractPagination(event);

    expect(result).toEqual({"searchDirection": "search_before", "searchSince": "aa", "size": 2});
  });
});
