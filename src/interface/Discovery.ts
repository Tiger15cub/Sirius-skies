export interface LinkData {
  namespace: string;
  mnemonic: string;
  linkType: string;
  active: boolean;
  disabled: boolean;
  version: number;
  moderationStatus: string;
  accountId: string;
  creatorName: string;
  descriptionTags: string[];
  metadata: {
    image_url: string;
    matchmaking: {
      override_playlist: string;
    };
  };
}

export interface Result {
  linkData: LinkData;
  lastVisited: null;
  linkCode: string;
  isFavorite: boolean;
}

interface Page {
  results: Result[];
  hasMore: boolean;
}

export interface Panel {
  PanelName: string;
  Pages: Page[];
}

export interface Discovery {
  Panels: Panel[];
  TestCohorts: string[];
  ModeSets: Record<string, unknown>;
}
