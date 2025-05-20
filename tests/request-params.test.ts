import { APIGatewayEvent } from "aws-lambda";
import * as E from "fp-ts/Either";
import { pipe } from "fp-ts/function";
import { getPathParam, RequestParamMissingError } from "../src/request-params";

describe("getPathParam", () => {
  const mockEvent = (
    pathParameters: Record<string, string | undefined> | null
  ): APIGatewayEvent =>
    ({
      pathParameters,
    } as APIGatewayEvent);

  it("should return the correct path parameter when it exists", async () => {
    const event = mockEvent({ id: "123" });
    const result = await getPathParam("id")(event)();

    pipe(
      result,
      E.fold(
        (error) => {
          fail(`Expected Right, but got Left: ${error}`);
        },
        (value) => {
          expect(value).toBe("123");
        }
      )
    );
  });

  it("should return a RequestParamMissingError when pathParameters is null", async () => {
    const event = mockEvent(null);
    const result = await getPathParam("id")(event)();

    pipe(
      result,
      E.fold(
        (error) => {
          expect(error).toBeInstanceOf(RequestParamMissingError);
        },
        (value) => {
          fail(`Expected Left, but got Right: ${value}`);
        }
      )
    );
  });

  it("should return a RequestParamMissingError when the requested parameter does not exist", async () => {
    const event = mockEvent({ otherId: "456" });
    const result = await getPathParam("id")(event)();

    pipe(
      result,
      E.fold(
        (error) => {
          expect(error).toBeInstanceOf(RequestParamMissingError);
        },
        (value) => {
          fail(`Expected Left, but got Right: ${value}`);
        }
      )
    );
  });

  it("should return a RequestParamMissingError when the parameter value is undefined", async () => {
    const event = mockEvent({ id: undefined });
    const result = await getPathParam("id")(event)();

    pipe(
      result,
      E.fold(
        (error) => {
          expect(error).toBeInstanceOf(RequestParamMissingError);
        },
        (value) => {
          fail(`Expected Left, but got Right: ${value}`);
        }
      )
    );
  });
});
