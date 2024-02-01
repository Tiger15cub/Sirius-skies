import { DateTime } from "luxon";
import { Schema, model, Document } from "mongoose";

export interface ICloudStorageEntry extends Document {
  file: string;
  section: string;
  key: string;
  value: string;
  enabled: boolean;
}

const CloudStorageEntries = new Schema<ICloudStorageEntry>({
  file: { type: String, default: "" },
  section: { type: String, default: "" },
  key: { type: String, default: "" },
  value: { type: String, default: "" },
  enabled: { type: Boolean, default: true },
});

export default model<ICloudStorageEntry>(
  "CloudStorageEntries",
  CloudStorageEntries
);
