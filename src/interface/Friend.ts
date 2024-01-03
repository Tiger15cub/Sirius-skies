export interface Friend {
  accountId: string;
  status: string;
  direction: string;
  createdAt: string;
  favorite: boolean;
}

export interface IFriends {
  accountId: string;
  groups: string[];
  mutual: number;
  alias: string;
  note: string;
  createdAt: string;
  favorite: boolean;
}

export interface NewFriend {
  accountId: string;
  createdAt: string;
}
