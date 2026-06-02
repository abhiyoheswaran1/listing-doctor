import { describe, expect, it } from "vitest";

import { emptyListingDraft, emptyPhotoChecklist } from "./demoListings";
import {
  addUploadedImages,
  removeUploadedImage,
  retagUploadedImage,
  toggleDemoPhotoSlot,
} from "./imageUploads";
import type { ListingDraft } from "./types";

const baseListing: ListingDraft = {
  ...emptyListingDraft,
  make: "BMW",
  model: "320d Touring",
  uploadedImages: [],
  photoCount: 0,
  photoChecklist: { ...emptyPhotoChecklist },
};

describe("image upload state", () => {
  it("turns demo checklist slots into counted mock uploaded images", () => {
    const withFront = toggleDemoPhotoSlot(baseListing, "frontExterior", true);

    expect(withFront.photoCount).toBe(1);
    expect(withFront.uploadedImages).toEqual([
      expect.objectContaining({
        id: "demo-photo-frontExterior",
        coverage: "frontExterior",
      }),
    ]);
    expect(withFront.photoChecklist.frontExterior).toBe(true);

    const withoutFront = toggleDemoPhotoSlot(withFront, "frontExterior", false);

    expect(withoutFront.photoCount).toBe(0);
    expect(withoutFront.uploadedImages).toHaveLength(0);
    expect(withoutFront.photoChecklist.frontExterior).toBe(false);
  });

  it("keeps uploaded files untagged until the seller identifies what they show", () => {
    const uploaded = addUploadedImages(baseListing, [
      { id: "uploaded-1", name: "IMG_001.jpg", sizeKb: 420 },
    ]);

    expect(uploaded.photoCount).toBe(1);
    expect(uploaded.photoChecklist.frontExterior).toBe(false);
    expect(uploaded.uploadedImages?.[0]?.coverage).toBe("other");

    const tagged = retagUploadedImage(uploaded, "uploaded-1", "frontExterior");

    expect(tagged.photoCount).toBe(1);
    expect(tagged.photoChecklist.frontExterior).toBe(true);
    expect(tagged.uploadedImages?.[0]?.coverage).toBe("frontExterior");
  });

  it("recomputes checklist coverage when tagged images are removed", () => {
    const uploaded = retagUploadedImage(
      addUploadedImages(baseListing, [{ id: "uploaded-1", name: "front.jpg" }]),
      "uploaded-1",
      "frontExterior",
    );

    const removed = removeUploadedImage(uploaded, "uploaded-1");

    expect(removed.photoCount).toBe(0);
    expect(removed.uploadedImages).toHaveLength(0);
    expect(removed.photoChecklist.frontExterior).toBe(false);
  });
});
