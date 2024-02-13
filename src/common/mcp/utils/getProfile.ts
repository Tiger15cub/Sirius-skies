import Accounts from "../../../models/Accounts";

export async function getProfile(accountId: string) {
  try {
    const existingProfile = await Accounts.findOne({
      accountId,
    }).cacheQuery();

    if (!existingProfile) {
      throw new Error("Profile not found");
    }

    Promise.resolve(existingProfile.athena);
    return existingProfile.athena;
  } catch (error) {
    console.error(`Error in getProfile: ${error}`);
    Promise.resolve({ error: "not found" });
  }
}

export async function getCommonCore(accountId: string): Promise<any> {
  try {
    const existingProfile = await Accounts.findOne({
      accountId,
    }).cacheQuery();

    if (!existingProfile) {
      throw new Error("Profile not found");
    }

    Promise.resolve(existingProfile.common_core);
    return existingProfile.common_core;
  } catch (error) {
    console.error(`Error in getProfile: ${error}`);
    Promise.resolve({ error: "not found" });
  }
}

export async function getMeta(accountId: string) {
  const existingProfile = await Accounts.findOne({ accountId }).cacheQuery();

  if (!existingProfile) {
    return { error: "not found" };
  }

  return existingProfile.metadata;
}

export async function getOupost(accountId: string) {
  const existingProfile = await Accounts.findOne({ accountId }).cacheQuery();

  if (!existingProfile) {
    return { error: "not found" };
  }

  return existingProfile.outpost0;
}

export async function getTheater(accountId: string) {
  const existingProfile = await Accounts.findOne({ accountId }).cacheQuery();

  if (!existingProfile) {
    return { error: "not found" };
  }

  return existingProfile.theater0;
}

export async function getBook(type: string, accountId: string) {
  const existingProfile = await Accounts.findOne({ accountId }).cacheQuery();

  if (!existingProfile) {
    return { error: "not found" };
  }

  switch (type) {
    case "collection_book_schematics0":
      return existingProfile.collection_book_schematics0;
    case "collection_book_people0":
      return existingProfile.collection_book_people0;
  }
}
