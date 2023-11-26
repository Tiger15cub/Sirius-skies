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
  friends: Friends;
}

interface Friends {
  accepted: Array<Record<string, any>>;
  incoming: Array<Record<string, any>>;
  outgoing: Array<Record<string, any>>;
  blocked: Array<Record<string, any>>;
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
  friends: {
    accepted: {
      type: Array,
      default: [],
    },
    incoming: {
      type: Array,
      default: [],
    },
    outgoing: {
      type: Array,
      default: [],
    },
    blocked: {
      type: Array,
      default: [],
    },
  },
});

export default model<IUser>("Users", UserSchema);
