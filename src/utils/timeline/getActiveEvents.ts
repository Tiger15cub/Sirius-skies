import { ActiveEvents } from "../../interface";

export default function getActiveEvents(
  buildUpdate: string | number | undefined,
  season: number,
  activeEvents: ActiveEvents[]
) {
  switch (buildUpdate) {
    case "11.31":
    case "11.40":
      activeEvents = [
        {
          eventType: `EventFlag.LobbySeason${season}`,
          activeUntil: "9999-12-31T23:59:59.999Z",
          activeSince: "2020-01-01T23:59:59.999Z",
        },
        {
          eventType: "EventFlag.Winterfest.Tree",
          activeUntil: "9999-01-01T00:00:00.000Z",
          activeSince: "2020-01-01T23:59:59.999Z",
        },
        {
          eventType: "EventFlag.LTE_WinterFest",
          activeUntil: "9999-01-01T00:00:00.000Z",
          activeSince: "2020-01-01T23:59:59.999Z",
        },
        {
          eventType: "EventFlag.LTE_WinterFest2019",
          activeUntil: "9999-01-01T00:00:00.000Z",
          activeSince: "2020-01-01T23:59:59.999Z",
        },
      ];
      break;
  }
}
