export interface CreativeDiscoverySurface {
  FortCreativeDiscoverySurface: {
    meta: {
      promotion: number;
    };
    assets: {
      CreativeDiscoverySurface_Frontend: {
        meta: {
          revision: number;
          headRevision: number;
          revisedAt: string;
          promotion: number;
          promotedAt: string;
        };
        assetData: {
          AnalyticsId: string;
          TestCohorts: TestCohort[];
          GlobalLinkCodeBlacklist: any[];
          SurfaceName: string;
          TestName: string;
          primaryAssetId: string;
          GlobalLinkCodeWhitelist: any[];
        };
      };
    };
  };
}

interface TestCohort {
  AnalyticsId: string;
  CohortSelector: string;
  PlatformBlacklist: string[];
  ContentPanels: ContentPanel[];
  PlatformWhitelist: string[];
  SelectionChance: number;
  TestName: string;
}

interface ContentPanel {
  NumPages: number;
  AnalyticsId: string;
  PanelType: string;
  AnalyticsListName: string;
  CuratedListOfLinkCodes: any[];
  ModelName: string;
  PageSize: number;
  PlatformBlacklist: string[];
  PanelName: string;
  MetricInterval: string;
  SkippedEntriesCount: number;
  SkippedEntriesPercent: number;
  SplicedEntries: any[];
  PlatformWhitelist: string[];
  EntrySkippingMethod: string;
  PanelDisplayName: {
    Category: string;
    NativeCulture: string;
    Namespace: string;
    LocalizedStrings: LocalizedString[];
    bIsMinimalPatch: boolean;
    NativeString: string;
    Key: string;
  };
  PlayHistoryType: string;
  bLowestToHighest: boolean;
  PanelLinkCodeBlacklist: any[];
  PanelLinkCodeWhitelist: any[];
  FeatureTags: any[];
  MetricName: string;
}

interface LocalizedString {
  key: string;
  value: string;
}
