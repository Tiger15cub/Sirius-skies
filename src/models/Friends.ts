import { DateTime } from "luxon";
import { Schema, model, Document } from "mongoose";

interface Friends {
  accepted: Array<Record<string, any>>;
  incoming: Array<Record<string, any>>;
  outgoing: Array<Record<string, any>>;
  blocked: Array<Record<string, any>>;
}

export interface IFriends extends Document {
  accountId: string;
  friends: Friends;
}

const FriendsSchema = new Schema<IFriends>({
  accountId: { type: String, default: "" },
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

export default model<IFriends>("Friends", FriendsSchema);
