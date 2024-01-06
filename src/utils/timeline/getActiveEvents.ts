import { ActiveEvents } from "../../interface";

export default function getActiveEvents(
  buildUpdate: string | number | undefined,
  season: number,
  activeEvents: ActiveEvents[]
) {
  switch (buildUpdate) {
    case "4.0":
      activeEvents = [
        {
          eventType: `EventFlag.LobbySeason${season}`,
          activeUntil: "9999-12-31T23:59:59.999Z",
          activeSince: "2020-01-01T23:59:59.999Z",
        },
        {
          eventType: "EventFlag.Blockbuster2018",
          activeUntil: "9999-12-31T23:59:59.999Z",
          activeSince: "2020-01-01T00:00:00.000Z",
        },
        {
          eventType: "EventFlag.Blockbuster2018Phase1",
          activeUntil: "9999-12-31T23:59:59.999Z",
          activeSince: "2020-01-01T00:00:00.000Z",
        },
      ];
      break;

    case "4.3":
      activeEvents = [
        {
          eventType: "EventFlag.Blockbuster2018Phase2",
          activeUntil: "9999-12-31T23:59:59.999Z",
          activeSince: "2020-01-01T00:00:00.000Z",
        },
      ];
      break;

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
          activeUntil: "9999-12-31T23:59:59.999Z",
          activeSince: "2020-01-01T23:59:59.999Z",
        },
        {
          eventType: "EventFlag.LTE_WinterFest",
          activeUntil: "9999-12-31T23:59:59.999Z",
          activeSince: "2020-01-01T23:59:59.999Z",
        },
        {
          eventType: "EventFlag.LTE_WinterFest2019",
          activeUntil: "9999-12-31T23:59:59.999Z",
          activeSince: "2020-01-01T23:59:59.999Z",
        },
      ];
      break;

    case "12":
      activeEvents = [
        {
          eventType: `EventFlag.LobbySeason${season}`,
          activeUntil: "9999-12-31T23:59:59.999Z",
          activeSince: "2020-01-01T23:59:59.999Z",
        },
        {
          eventType: "EventFlag.LTE_SpyGames",
          activeUntil: "9999-12-31T23:59:59.999Z",
          activeSince: "2020-01-01T00:00:00.000Z",
        },
        {
          eventType: "EventFlag.LTE_JerkyChallenges",
          activeUntil: "9999-12-31T23:59:59.999Z",
          activeSince: "2020-01-01T00:00:00.000Z",
        },
        {
          eventType: "EventFlag.LTE_Oro",
          activeUntil: "9999-12-31T23:59:59.999Z",
          activeSince: "2020-01-01T00:00:00.000Z",
        },
        {
          eventType: "EventFlag.LTE_StormTheAgency",
          activeUntil: "9999-12-31T23:59:59.999Z",
          activeSince: "2020-01-01T00:00:00.000Z",
        },
      ];
      break;

    case "13":
      break;

    case "14":
      activeEvents = [
        {
          eventType: `EventFlag.LobbySeason${season}`,
          activeUntil: "9999-12-31T23:59:59.999Z",
          activeSince: "2020-01-01T23:59:59.999Z",
        },
        {
          eventType: "EventFlag.LTE_Fortnitemares_2020",
          activeUntil: "9999-12-31T23:59:59.999Z",
          activeSince: "2020-01-01T00:00:00.000Z",
        },
      ];
      break;

    case "15":
      break;

    case "16":
      break;

    case "17":
      break;

    case "18":
      break;

    case "19":
      activeEvents = [
        {
          eventType: `EventFlag.LobbySeason${season}`,
          activeUntil: "9999-12-31T23:59:59.999Z",
          activeSince: "2020-01-01T23:59:59.999Z",
        },
        {
          eventType: "EventFlag.LTM_Hyena",
          activeUntil: "9999-12-31T23:59:59.999Z",
          activeSince: "2020-01-01T00:00:00.000Z",
        },
        {
          eventType: "EventFlag.LTM_Vigilante",
          activeUntil: "9999-12-31T23:59:59.999Z",
          activeSince: "2020-01-01T00:00:00.000Z",
        },
        {
          eventType: "EventFlag.LTM_ZebraWallet",
          activeUntil: "9999-12-31T23:59:59.999Z",
          activeSince: "2020-01-01T00:00:00.000Z",
        },
        {
          eventType: "EventFlag.LTE_Galileo_Feats",
          activeUntil: "9999-12-31T23:59:59.999Z",
          activeSince: "2020-01-01T00:00:00.000Z",
        },
        {
          eventType: "EventFlag.Event_S19_Trey",
          activeUntil: "9999-12-31T23:59:59.999Z",
          activeSince: "2020-01-01T00:00:00.000Z",
        },
        {
          eventType: "EventFlag.Event_S19_DeviceQuestsPart1",
          activeUntil: "9999-12-31T23:59:59.999Z",
          activeSince: "2020-01-01T00:00:00.000Z",
        },
        {
          eventType: "EventFlag.Event_S19_DeviceQuestsPart2",
          activeUntil: "9999-12-31T23:59:59.999Z",
          activeSince: "2020-01-01T00:00:00.000Z",
        },
        {
          eventType: "EventFlag.Event_S19_DeviceQuestsPart3",
          activeUntil: "9999-12-31T23:59:59.999Z",
          activeSince: "2020-01-01T00:00:00.000Z",
        },
        {
          eventType: "EventFlag.Event_S19_Gow_Quests",
          activeUntil: "9999-12-31T23:59:59.999Z",
          activeSince: "2020-01-01T00:00:00.000Z",
        },
        {
          eventType: "EventFlag.Event_MonarchLevelUpPack",
          activeUntil: "9999-12-31T23:59:59.999Z",
          activeSince: "2020-01-01T00:00:00.000Z",
        },
        {
          eventType: "EventFlag.S19_WinterfestCrewGrant",
          activeUntil: "9999-12-31T23:59:59.999Z",
          activeSince: "2020-01-01T00:00:00.000Z",
        },
        {
          eventType: "EventFlag.S19_WildWeeks_Chicken",
          activeUntil: "9999-12-31T23:59:59.999Z",
          activeSince: "2020-01-01T00:00:00.000Z",
        },
        {
          eventType: "EventFlag.S19_WildWeeks_BargainBin",
          activeUntil: "9999-12-31T23:59:59.999Z",
          activeSince: "2020-01-01T00:00:00.000Z",
        },
        {
          eventType: "EventFlag.S19_WildWeeks_Spider",
          activeUntil: "9999-12-31T23:59:59.999Z",
          activeSince: "2020-01-01T00:00:00.000Z",
        },
        {
          eventType: "EventFlag.S19_WildWeeks_Primal",
          activeUntil: "9999-12-31T23:59:59.999Z",
          activeSince: "2020-01-01T00:00:00.000Z",
        },
      ];
  }
}
