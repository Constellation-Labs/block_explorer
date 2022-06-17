const DEFAULT_HEADERS = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*'
}

export enum StatusCodes {
    OK = 200,
    CREATED = 201,
    BAD_REQUEST = 400,
    NOT_FOUND = 404,
    SERVER_ERROR = 500
}

export class ApplicationError {
    public readonly message: string
    public readonly errors: string[]
    public readonly statusCode: StatusCodes

    public constructor(message: string, errors: string[], status: StatusCodes) {
        this.message = message
        this.errors = errors
        this.statusCode = status
    }
}

export const successResponse = (statusCode: StatusCodes) => <T>(result: T) =>
    ({
        statusCode,
        headers: DEFAULT_HEADERS,
        body: JSON.stringify(result)
    })

export const errorResponse = (error: ApplicationError) =>
    ({
        statusCode: error.statusCode,
        headers: DEFAULT_HEADERS,
        body: JSON.stringify({message: error.message, errors: error.errors})
    })
