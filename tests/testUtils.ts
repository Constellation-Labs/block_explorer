import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

/**
 * Creates an API Gateway event object for testing handler functions
 */
export const createAPIGatewayEvent = (
  pathParameters: Record<string, string> = {},
  queryStringParameters: Record<string, string> = {},
  body: string | null = null
): APIGatewayProxyEvent => ({
  httpMethod: 'GET',
  isBase64Encoded: false,
  path: '',
  resource: '',
  body,
  headers: {},
  multiValueHeaders: {},
  pathParameters: Object.keys(pathParameters).length ? pathParameters : null,
  queryStringParameters: Object.keys(queryStringParameters).length ? queryStringParameters : null,
  multiValueQueryStringParameters: null,
  stageVariables: null,
  requestContext: {} as any,
});

/**
 * Helper function to parse API Gateway response body
 */
export const parseResponseBody = (response: APIGatewayProxyResult) => {
  return JSON.parse(response.body);
};

/**
 * Validates the structure of an API response
 */
export const validateResponseStructure = (response: APIGatewayProxyResult) => {
  expect(response.statusCode).toBeDefined();
  expect(response.headers).toBeDefined();
  
  // Check headers if they exist
  if (response.headers) {
    expect(response.headers['Content-Type']).toBe('application/json');
    expect(response.headers['Access-Control-Allow-Origin']).toBe('*');
  }
  
  expect(response.body).toBeDefined();
  
  const body = parseResponseBody(response);
  expect(body).toBeDefined();
  
  // Success responses should have a data field
  if (response.statusCode === 200) {
    expect(body.data).toBeDefined();
  }
  
  // Error responses should have message and errors fields
  if (response.statusCode >= 400) {
    expect(body.message).toBeDefined();
    expect(body.errors).toBeDefined();
  }
  
  return body;
};

/**
 * Validates that a paginated response has the correct structure
 */
export const validatePaginatedResponse = (response: APIGatewayProxyResult, shouldHaveNext: boolean = false) => {
  const body = validateResponseStructure(response);
  
  expect(Array.isArray(body.data)).toBe(true);

  if (shouldHaveNext) {
    expect(body.meta).toBeDefined();
    expect(body.meta.next !== undefined).toBe(true);
  }
  
  return body;
};
