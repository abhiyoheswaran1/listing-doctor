import {
  photoChecklistItems,
  type ImageCoverageKey,
  type ListingDraft,
  type PhotoChecklist,
  type PhotoChecklistKey,
  type UploadedImage,
} from "./types";

export type NewUploadedImage = Pick<UploadedImage, "id" | "name" | "sizeKb"> & {
  coverage?: ImageCoverageKey;
};

export function getUploadedImageCount(listing: ListingDraft) {
  return listing.uploadedImages?.length ?? 0;
}

export function getTaggedImageCount(listing: ListingDraft) {
  return (listing.uploadedImages ?? []).filter((image) => image.coverage !== "other").length;
}

export function buildPhotoChecklistFromUploadedImages(images: UploadedImage[]): PhotoChecklist {
  const checklist = Object.fromEntries(
    photoChecklistItems.map((item) => [item.key, false]),
  ) as PhotoChecklist;

  for (const image of images) {
    if (image.coverage !== "other") {
      checklist[image.coverage] = true;
    }
  }

  return checklist;
}

export function syncImageState(listing: ListingDraft, images: UploadedImage[]): ListingDraft {
  const normalizedImages = images.map((image) => ({
    ...image,
    coverage: image.coverage ?? "other",
  }));

  return {
    ...listing,
    uploadedImages: normalizedImages,
    photoCount: normalizedImages.length,
    photoChecklist: buildPhotoChecklistFromUploadedImages(normalizedImages),
  };
}

export function addUploadedImages(
  listing: ListingDraft,
  newImages: NewUploadedImage[],
): ListingDraft {
  const uploadedImages = newImages.map((image) => ({
    ...image,
    coverage: image.coverage ?? "other",
  }));

  return syncImageState(listing, [...(listing.uploadedImages ?? []), ...uploadedImages]);
}

export function retagUploadedImage(
  listing: ListingDraft,
  imageId: string,
  coverage: ImageCoverageKey,
): ListingDraft {
  return syncImageState(
    listing,
    (listing.uploadedImages ?? []).map((image) =>
      image.id === imageId ? { ...image, coverage } : image,
    ),
  );
}

export function removeUploadedImage(listing: ListingDraft, imageId: string): ListingDraft {
  return syncImageState(
    listing,
    (listing.uploadedImages ?? []).filter((image) => image.id !== imageId),
  );
}

export function toggleDemoPhotoSlot(
  listing: ListingDraft,
  key: PhotoChecklistKey,
  checked: boolean,
): ListingDraft {
  const currentImages = listing.uploadedImages ?? [];

  if (checked) {
    if (currentImages.some((image) => image.coverage === key)) {
      return syncImageState(listing, currentImages);
    }

    return syncImageState(listing, [
      ...currentImages,
      {
        id: demoPhotoId(key),
        name: `${listingImageSlug(listing)}-${kebabCase(key)}.jpg`,
        coverage: key,
      },
    ]);
  }

  return syncImageState(
    listing,
    currentImages.flatMap((image) => {
      if (image.coverage !== key) return [image];
      if (image.id === demoPhotoId(key)) return [];
      return [{ ...image, coverage: "other" }];
    }),
  );
}

function demoPhotoId(key: PhotoChecklistKey) {
  return `demo-photo-${key}`;
}

function listingImageSlug(listing: ListingDraft) {
  return kebabCase(`${listing.make || "vehicle"} ${listing.model || "listing"}`);
}

function kebabCase(value: string) {
  return value
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
