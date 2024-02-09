import { Schema, model, Document } from "mongoose";
import { SpeedGooseCacheAutoCleaner } from "speedgoose";

export interface IUser extends Document {
  discordId: string;
  accountId: string;
  email: string;
  username: string;
  password: string;
  banned: boolean;
  hasFL: boolean;
}

const UserSchema = new Schema<IUser>({
  discordId: { type: String, required: true },
  accountId: { type: String, required: true },
  email: { type: String, required: true },
  username: { type: String, required: true },
  password: { type: String, required: true },
  banned: { type: Boolean, default: false },
  hasFL: { type: Boolean, default: false },
});

UserSchema.plugin(SpeedGooseCacheAutoCleaner);

export default model<IUser>("Users", UserSchema);
