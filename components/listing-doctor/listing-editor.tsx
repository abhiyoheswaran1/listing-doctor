"use client";

import type { ListingDraft } from "@/lib/listing-doctor/types";
import type { InsertionPage } from "@/lib/listing-doctor/flow";
import type {
  DescriptionAssistantMode,
  DescriptionLanguage,
} from "@/lib/listing-doctor/descriptionAssistant";
import type { DescriptionStaleness } from "@/lib/listing-doctor/descriptionStaleness";

import { IdentifyPage } from "./identify-page";
import { ListingDetailsPage } from "./listing-details-page";
import { VersionPage } from "./version-page";

export function ListingEditor({
  page,
  listing,
  selectedDemoId,
  mockSeed,
  onListingChange,
  onSelectedDemoChange,
  onMockSeedChange,
  onLoadDemo,
  onGenerateMock,
  onClear,
  onDescriptionGenerated,
  onDescriptionManuallyEdited,
  descriptionStaleness,
  onRefreshGeneratedDescription,
}: {
  page: InsertionPage;
  listing: ListingDraft;
  selectedDemoId: string;
  mockSeed: string;
  onListingChange: (listing: ListingDraft) => void;
  onSelectedDemoChange: (id: string) => void;
  onMockSeedChange: (seed: string) => void;
  onLoadDemo: () => void;
  onGenerateMock: (listing: ListingDraft) => void;
  onClear: () => void;
  onDescriptionGenerated: (
    mode: DescriptionAssistantMode,
    description: string,
    language?: DescriptionLanguage,
  ) => void;
  onDescriptionManuallyEdited: () => void;
  descriptionStaleness: DescriptionStaleness | null;
  onRefreshGeneratedDescription: () => void;
}) {
  if (page === "identify") {
    return (
      <IdentifyPage
        listing={listing}
        selectedDemoId={selectedDemoId}
        mockSeed={mockSeed}
        onListingChange={onListingChange}
        onSelectedDemoChange={onSelectedDemoChange}
        onMockSeedChange={onMockSeedChange}
        onLoadDemo={onLoadDemo}
        onGenerateMock={onGenerateMock}
        onClear={onClear}
      />
    );
  }

  if (page === "version") {
    return <VersionPage listing={listing} onListingChange={onListingChange} />;
  }

  return (
    <ListingDetailsPage
      listing={listing}
      onListingChange={onListingChange}
      onDescriptionGenerated={onDescriptionGenerated}
      onDescriptionManuallyEdited={onDescriptionManuallyEdited}
      descriptionStaleness={descriptionStaleness}
      onRefreshGeneratedDescription={onRefreshGeneratedDescription}
    />
  );
}
