
import { supabase } from "../lib/supabase";

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

function validateImage(file) {
  if (!file) {
    throw new Error("STEP 0 FAILED: No image selected.");
  }

  if (!file.type) {
    throw new Error(
      "STEP 0 FAILED: Unable to determine the image type."
    );
  }

  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    throw new Error(
      "STEP 0 FAILED: Only PNG, JPG, JPEG or WEBP images are allowed."
    );
  }

  if (file.size > MAX_IMAGE_SIZE) {
    throw new Error(
      "STEP 0 FAILED: Image must be less than 5MB."
    );
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
      "STEP 0 FAILED: Invalid image file extension."
    );
  }

  return extension;
}

async function getAuthenticatedUser() {
  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error) {
      console.error("STEP 1 - Supabase auth error:", error);

      throw new Error(
        `STEP 1 FAILED: Supabase authentication - ${
          error.message || "Unknown authentication error"
        }`
      );
    }

    if (!user) {
      throw new Error(
        "STEP 1 FAILED: No authenticated Supabase user found."
      );
    }

    return user;
  } catch (error) {
    console.error("STEP 1 - Authentication exception:", error);

    if (error?.message?.startsWith("STEP 1 FAILED")) {
      throw error;
    }

    throw new Error(
      `STEP 1 FAILED: Could not reach Supabase authentication - ${
        error?.message || "Failed to fetch"
      }`
    );
  }
}

function generateUUID() {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    try {
      return crypto.randomUUID();
    } catch {
      // Use fallback below.
    }
  }

  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
    /[xy]/g,
    (character) => {
      const random = (Math.random() * 16) | 0;

      const value =
        character === "x"
          ? random
          : (random & 0x3) | 0x8;

      return value.toString(16);
    }
  );
}

export async function uploadNFTImage(file, userId) {
  if (!userId) {
    throw new Error(
      "STEP 1 FAILED: User is not authenticated."
    );
  }

  const extension = validateImage(file);

  const authUser = await getAuthenticatedUser();

  if (authUser.id !== userId) {
    throw new Error(
      "STEP 1 FAILED: Authenticated user does not match NFT creator."
    );
  }

  const fileName = `${generateUUID()}.${extension}`;
  const filePath = `${userId}/${fileName}`;

  try {
    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, file, {
        cacheControl: "31536000",
        contentType: file.type,
        upsert: false,
      });

    if (error) {
      console.error(
        "STEP 2 - Supabase storage error:",
        error
      );

      throw new Error(
        `STEP 2 FAILED: Image upload - ${
          error.message ||
          error.details ||
          error.hint ||
          "Unknown storage error"
        }`
      );
    }
  } catch (error) {
    console.error(
      "STEP 2 - Image upload exception:",
      error
    );

    if (error?.message?.startsWith("STEP 2 FAILED")) {
      throw error;
    }

    throw new Error(
      `STEP 2 FAILED: Could not reach Supabase Storage - ${
        error?.message || "Failed to fetch"
      }`
    );
  }

  try {
    const { data } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(filePath);

    if (!data?.publicUrl) {
      throw new Error(
        "Unable to generate public image URL."
      );
    }

    return {
      publicUrl: data.publicUrl,
      filePath,
    };
  } catch (error) {
    console.error(
      "STEP 2 - Public URL error:",
      error
    );

    throw new Error(
      `STEP 2 FAILED: Could not generate image URL - ${
        error?.message || "Unknown error"
      }`
    );
  }
}

export async function deleteNFTImage(filePath) {
  if (!filePath) {
    return true;
  }

  const authUser = await getAuthenticatedUser();

  if (!filePath.startsWith(`${authUser.id}/`)) {
    throw new Error(
      "You are not authorized to delete this image."
    );
  }

  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .remove([filePath]);

  if (error) {
    console.error(
      "Supabase storage delete error:",
      error
    );

    throw new Error(
      error.message ||
        error.details ||
        error.hint ||
        "Unable to delete NFT image."
    );
  }

  return true;
}

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
    throw new Error(
      "STEP 3 FAILED: NFT creator is missing."
    );
  }

  if (!name?.trim()) {
    throw new Error(
      "STEP 3 FAILED: NFT name is required."
    );
  }

  if (!image_url) {
    throw new Error(
      "STEP 3 FAILED: NFT image is missing."
    );
  }

  if (!category) {
    throw new Error(
      "STEP 3 FAILED: NFT category is required."
    );
  }

  const numericPrice = Number(price);

  if (
    price === undefined ||
    price === null ||
    !Number.isFinite(numericPrice) ||
    numericPrice <= 0
  ) {
    throw new Error(
      "STEP 3 FAILED: NFT price must be greater than zero."
    );
  }

  const authUser = await getAuthenticatedUser();

  if (authUser.id !== creator_id) {
    throw new Error(
      "STEP 3 FAILED: You are not authorized to create this NFT."
    );
  }

  try {
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
      console.error(
        "STEP 3 - Supabase NFT creation error:",
        error
      );

      throw new Error(
        `STEP 3 FAILED: NFT database insert - ${
          error.message ||
          error.details ||
          error.hint ||
          "Unknown database error"
        }`
      );
    }

    return data;
  } catch (error) {
    console.error(
      "STEP 3 - NFT creation exception:",
      error
    );

    if (error?.message?.startsWith("STEP 3 FAILED")) {
      throw error;
    }

    throw new Error(
      `STEP 3 FAILED: Could not reach Supabase database - ${
        error?.message || "Failed to fetch"
      }`
    );
  }
}

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

  const { error } = await supabase
    .from("nfts")
    .delete()
    .eq("id", nft.id)
    .eq("creator_id", authUser.id);

  if (error) {
    console.error(
      "Supabase NFT delete error:",
      error
    );

    throw new Error(
      error.message ||
        error.details ||
        error.hint ||
        "Unable to delete NFT."
    );
  }

  const filePath = getStoragePathFromUrl(
    nft.image_url
  );

  if (filePath) {
    try {
      await deleteNFTImage(filePath);
    } catch (storageError) {
      console.error(
        "NFT image cleanup failed:",
        storageError
      );
    }
  }

  return true;
}
