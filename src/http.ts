import { PaginatedResult, Result } from "./opensearch";

const DEFAULT_HEADERS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
};
export enum StatusCodes {
  OK = 200,
  CREATED = 201,
  BAD_REQUEST = 400,
  NOT_FOUND = 404,
  SERVER_ERROR = 500,
}

type ErrorCodes =
  | StatusCodes.BAD_REQUEST
  | StatusCodes.NOT_FOUND
  | StatusCodes.SERVER_ERROR;
type SuccessCodes = Exclude<StatusCodes, ErrorCodes>;

export class ApplicationError {
  public readonly message: string;
  public readonly errors: string[];
  public readonly statusCode: ErrorCodes;

  public constructor(message: string, errors: string[], status: ErrorCodes) {
    this.message = message;
    this.errors = errors;
    this.statusCode = status;
  }
}

type SuccessResponse = {
  statusCode: SuccessCodes;
  headers: typeof DEFAULT_HEADERS;
  body: string;
};

export const successResponse =
  (statusCode: SuccessCodes) =>
  <T>(result: Result<T> | PaginatedResult<T>): Response => {
    return {
      statusCode,
      headers: DEFAULT_HEADERS,
      body: JSON.stringify(result),
    };
  };

type ErrorResponse = {
  statusCode: ErrorCodes;
  headers: typeof DEFAULT_HEADERS;
  body: string;
};

export const errorResponse = (error: ApplicationError): Response => ({
  statusCode: error.statusCode,
  headers: DEFAULT_HEADERS,
  body: JSON.stringify({ message: error.message, errors: error.errors }),
});

export type Response = SuccessResponse | ErrorResponse;
