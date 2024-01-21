import { XmppClients } from "../types/XmppTypes";

export type UpdateClientProps = Partial<XmppClients>;

export function addOrUpdateClient(
  set: Set<XmppClients>,
  updates: UpdateClientProps
): void {
  const clientsArray = Array.from(set);

  const existingIndex = clientsArray.findIndex((client) =>
    Object.keys(updates).every(
      (key) =>
        client[key as keyof XmppClients] ===
        updates[key as keyof UpdateClientProps]
    )
  );

  if (existingIndex !== -1) {
    clientsArray[existingIndex] = {
      ...clientsArray[existingIndex],
      ...updates,
    };
  } else {
    const newClient: XmppClients = {
      socket: updates.socket,
      accountId: updates.accountId as string,
      displayName: updates.displayName as string,
      token: updates.token as string,
      jid: updates.jid as string,
      resource: updates.resource as string,
      lastPresenceUpdate: updates.lastPresenceUpdate,
    };
    clientsArray.push(newClient);
  }

  set.clear();
  clientsArray.forEach((client) => set.add(client));
}
