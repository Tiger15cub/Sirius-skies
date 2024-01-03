import { Schema, model, Document } from "mongoose";

export interface IUser extends Document {
  discordId: string;
  accountId: string;
  email: string;
  username: string;
  timesinceLastUpdate: Date;
  password: string;
  banned: boolean;
  hasFL: boolean;
}

const UserSchema = new Schema<IUser>({
  discordId: { type: String, required: true },
  accountId: { type: String, required: true },
  email: { type: String, required: true },
  username: { type: String, required: true },
  timesinceLastUpdate: { type: Date, required: true },
  password: { type: String, required: true },
  banned: { type: Boolean, default: false },
  // hasFullLocker
  hasFL: { type: Boolean, default: false },
});

export default model<IUser>("Users", UserSchema);
