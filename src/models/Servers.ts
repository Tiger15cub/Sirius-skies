import mongoose, { Document, Schema } from "mongoose";

export interface IServer extends Document {
  sessionId: string;
  serverPort: string;
  serverAddress: string;
  buildId: string;
  isMatchJoinable: boolean;
  region: string;
  playerCount: number;
  customKey: string;
  playlist: string;
  maxPlayerAmount: number;
}

const ServerSchema = new Schema<IServer>({
  sessionId: { type: String, required: true },
  serverPort: { type: String, required: true },
  serverAddress: { type: String, required: true },
  buildId: { type: String, required: true },
  isMatchJoinable: { type: Boolean, required: true },
  region: { type: String, required: true },
  playerCount: { type: Number, required: true },
  customKey: { type: String, required: true },
  playlist: { type: String, required: true },
  maxPlayerAmount: { type: Schema.Types.Mixed, required: false },
});

export default mongoose.model<IServer>("Servers", ServerSchema);
