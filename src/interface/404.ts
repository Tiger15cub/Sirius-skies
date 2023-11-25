export interface NotFound {
  status: number;
  errorCode: string;
  errorMessage: string;
  numericErrorCode: number;
  originatingService: string;
  intent: string;
  url: string;
}
