import { supabase } from "../lib/supabase";

// =========================================================
// CONSTANTS
// =========================================================

const BUCKET_NAME = "nft-images";
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

const ALLOWED_IMAGE_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
];

const ALLOWED_EXTENSIONS = [
  "png",
  "jpg",
  "jpeg",
  "webp",
];

// =========================================================
// VALIDATE IMAGE
// =========================================================

function validateImage(file) {
  if (!file) {
    throw new Error("No image selected.");
  }

  if (!file.type) {
    throw new Error("Unable to determine the image type.");
  }

  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    throw new Error(
      "Only PNG, JPG, JPEG or WEBP images are allowed."
    );
  }

  if (file.size > MAX_IMAGE_SIZE) {
    throw new Error("Image must be less than 5MB.");
  }

  const extension = file.name
    ?.split(".")
    .pop()
    ?.toLowerCase();

  if (
    !extension ||
    !ALLOWED_EXTENSIONS.includes(extension)
  ) {
    throw new Error(
      "Invalid image file extension."
    );
  }

  return extension;
}

// =========================================================
// GET AUTHENTICATED USER
// =========================================================

async function getAuthenticatedUser() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    throw error;
  }

  if (!user) {
    throw new Error(
      "Your session has expired. Please log in again."
    );
  }

  return user;
}

function generateUUID() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    try {
      return crypto.randomUUID();
    } catch {
      // Fall back if not in secure context
    }
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// =========================================================
// UPLOAD NFT IMAGE
// =========================================================

export async function uploadNFTImage(file, userId) {
  if (!userId) {
    throw new Error("User is not authenticated.");
  }

  const extension = validateImage(file);

  const authUser = await getAuthenticatedUser();

  if (authUser.id !== userId) {
    throw new Error(
      "You are not authorized to upload for this user."
    );
  }

  const fileName = `${generateUUID()}.${extension}`;

  const filePath = `${userId}/${fileName}`;

  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(filePath, file, {
      cacheControl: "31536000",
      contentType: file.type,
      upsert: false,
    });

  if (error) {
    throw error;
  }

  const { data } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(filePath);

  if (!data?.publicUrl) {
    await supabase.storage
      .from(BUCKET_NAME)
      .remove([filePath]);

    throw new Error(
      "Unable to generate the NFT image URL."
    );
  }

  return {
    publicUrl: data.publicUrl,
    filePath,
  };
}

// =========================================================
// DELETE NFT IMAGE
// =========================================================

export async function deleteNFTImage(filePath) {
  if (!filePath) {
    return true;
  }

  const authUser = await getAuthenticatedUser();

  // Make sure the file belongs to the authenticated user.
  if (!filePath.startsWith(`${authUser.id}/`)) {
    throw new Error(
      "You are not authorized to delete this image."
    );
  }

  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .remove([filePath]);

  if (error) {
    throw error;
  }

  return true;
}

// =========================================================
// CREATE NFT
// =========================================================

export async function createNFT({
  creator_id,
  name,
  description,
  image_url,
  category,
  price,
  currency,
}) {
  if (!creator_id) {
    throw new Error("NFT creator is missing.");
  }

  if (!name?.trim()) {
    throw new Error("NFT name is required.");
  }

  if (!image_url) {
    throw new Error("NFT image is missing.");
  }

  if (!category) {
    throw new Error("NFT category is required.");
  }

  const numericPrice = Number(price);

  if (
    price === undefined ||
    price === null ||
    !Number.isFinite(numericPrice) ||
    numericPrice <= 0
  ) {
    throw new Error(
      "NFT price must be greater than zero."
    );
  }

  const authUser = await getAuthenticatedUser();

  if (authUser.id !== creator_id) {
    throw new Error(
      "You are not authorized to create this NFT."
    );
  }

  const { data, error } = await supabase
    .from("nfts")
    .insert([
      {
        creator_id: authUser.id,
        name: name.trim(),
        description: description?.trim() || "",
        image_url,
        category,
        price: numericPrice,
        currency: currency || "NIM",
      },
    ])
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

// =========================================================
// GET STORAGE PATH FROM IMAGE URL
// =========================================================

function getStoragePathFromUrl(imageUrl) {
  if (!imageUrl) {
    return null;
  }

  try {
    const url = new URL(imageUrl);

    const marker =
      `/storage/v1/object/public/${BUCKET_NAME}/`;

    const markerIndex =
      url.pathname.indexOf(marker);

    if (markerIndex === -1) {
      return null;
    }

    return decodeURIComponent(
      url.pathname.substring(
        markerIndex + marker.length
      )
    );
  } catch (error) {
    console.error(
      "Unable to extract storage path:",
      error
    );

    return null;
  }
}

// =========================================================
// DELETE NFT
// =========================================================

export async function deleteNFT(nft) {
  if (!nft?.id) {
    throw new Error("NFT ID is missing.");
  }

  if (!nft?.creator_id) {
    throw new Error("NFT creator is missing.");
  }

  const authUser = await getAuthenticatedUser();

  if (authUser.id !== nft.creator_id) {
    throw new Error(
      "You are not authorized to delete this NFT."
    );
  }

  // ---------------------------------------------------------
  // Delete database record
  // ---------------------------------------------------------

  const { error } = await supabase
    .from("nfts")
    .delete()
    .eq("id", nft.id)
    .eq("creator_id", authUser.id);

  if (error) {
    throw error;
  }

  // ---------------------------------------------------------
  // Delete image from Storage
  // ---------------------------------------------------------

  const filePath = getStoragePathFromUrl(
    nft.image_url
  );

  if (filePath) {
    try {
      await deleteNFTImage(filePath);
    } catch (storageError) {
      // The NFT is already deleted from the database.
      // Log the storage problem instead of making the
      // user think the NFT deletion failed.
      console.error(
        "NFT image cleanup failed:",
        storageError
      );
    }
  }

  return true;
}