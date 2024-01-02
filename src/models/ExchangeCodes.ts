import { DateTime } from "luxon";
import { Schema, model, Document } from "mongoose";

export interface IExchangeCodes extends Document {
  accountId: string;
  exchange_code: string;
  creatingClientId: string;
  expiresAt: DateTime;
}

const ExchangeCodesSchema = new Schema<IExchangeCodes>({
  accountId: { type: String, default: "" },
  exchange_code: { type: String, default: "" },
  creatingClientId: { type: String, default: "" },
  expiresAt: { type: Date, default: DateTime.now() },
});

export default model<IExchangeCodes>("ExchangeCodes", ExchangeCodesSchema);
