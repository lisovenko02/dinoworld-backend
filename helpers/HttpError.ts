interface HttpErrorType extends Error {
  status?: number
}

const messageList: { [key: number]: string } = {
  400: 'Bad Request',
  401: 'Unauthorized',
  403: 'Forbidden',
  404: 'Not Found',
  409: 'Conflict',
}

const HttpError = (status: number, message = messageList[status]) => {
  const error: HttpErrorType = new Error(message)
  error.status = status
  return error
}

export default HttpError
