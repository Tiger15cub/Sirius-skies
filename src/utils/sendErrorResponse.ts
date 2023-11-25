export function sendErrorResponse(
  res: any,
  errorCode: string,
  message: string
): void {
  res.status(400).json({
    errorCode,
    message,
  });
}
