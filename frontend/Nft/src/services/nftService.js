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

// =========================================================
// VALIDATE IMAGE
// =========================================================

function validateImage(file) {
  if (!file) {
    throw new Error("No image selected.");
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

  if (!extension || !ALLOWED_EXTENSIONS.includes(extension)) {
    throw new Error("Invalid image file extension.");
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
    throw new Error(
      `Authentication failed: ${error.message}`
    );
  }

  if (!user) {
    throw new Error(
      "No authenticated Supabase user found."
    );
  }

  return user;
}

// =========================================================
// GENERATE FILE NAME
// =========================================================

function generateFileName(extension) {
  const id =
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random()
          .toString(16)
          .slice(2)}`;

  return `${id}.${extension}`;
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
      "Authenticated user does not match NFT creator."
    );
  }

  const fileName = generateFileName(extension);
  const filePath = `${userId}/${fileName}`;

  console.log("NFT IMAGE UPLOAD");
  console.log("Bucket:", BUCKET_NAME);
  console.log("Path:", filePath);
  console.log("User:", authUser.id);
  console.log("File:", file.name);
  console.log("Size:", file.size);
  console.log("Type:", file.type);

  try {
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, file, {
        cacheControl: "31536000",
        contentType: file.type,
        upsert: false,
      });

    if (error) {
      console.error(
        "Supabase Storage upload error:",
        error
      );

      throw new Error(
        error.message ||
          error.details ||
          error.hint ||
          "Unable to upload image."
      );
    }

    console.log(
      "NFT image uploaded successfully:",
      data
    );
  } catch (error) {
    console.error(
      "NFT image upload failed:",
      error
    );

    if (error instanceof TypeError) {
      throw new Error(
        "Could not connect to Supabase Storage. Check your Supabase URL, key, or network connection."
      );
    }

    throw error;
  }

  // =======================================================
  // GET PUBLIC URL
  // =======================================================

  const {
    data: publicUrlData,
  } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(filePath);

  if (!publicUrlData?.publicUrl) {
    throw new Error(
      "Image uploaded but a public URL could not be generated."
    );
  }

  console.log(
    "NFT image URL:",
    publicUrlData.publicUrl
  );

  return {
    publicUrl: publicUrlData.publicUrl,
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

  if (!filePath.startsWith(`${authUser.id}/`)) {
    throw new Error(
      "You are not authorized to delete this image."
    );
  }

  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .remove([filePath]);

  if (error) {
    throw new Error(
      error.message ||
        error.details ||
        error.hint ||
        "Unable to delete NFT image."
    );
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
    throw new Error(
      "NFT creator is missing."
    );
  }

  if (!name?.trim()) {
    throw new Error(
      "NFT name is required."
    );
  }

  if (!image_url) {
    throw new Error(
      "NFT image is missing."
    );
  }

  if (!category) {
    throw new Error(
      "NFT category is required."
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
      "NFT price must be greater than zero."
    );
  }

  const authUser = await getAuthenticatedUser();

  if (authUser.id !== creator_id) {
    throw new Error(
      "You are not authorized to create this NFT."
    );
  }

  try {
    const {
      data,
      error,
    } = await supabase
      .from("nfts")
      .insert({
        creator_id: authUser.id,
        name: name.trim(),
        description: description?.trim() || "",
        image_url,
        category,
        price: numericPrice,
        currency: currency || "NIM",
      })
      .select()
      .single();

    if (error) {
      console.error(
        "NFT database insert error:",
        error
      );

      throw new Error(
        error.message ||
          error.details ||
          error.hint ||
          "Unable to create NFT."
      );
    }

    return data;
  } catch (error) {
    console.error(
      "NFT creation failed:",
      error
    );

    if (error instanceof TypeError) {
      throw new Error(
        "Could not connect to Supabase database."
      );
    }

    throw error;
  }
}

// =========================================================
// GET STORAGE PATH FROM URL
// =========================================================

function getStoragePathFromUrl(imageUrl) {
  if (!imageUrl) {
    return null;
  }

  try {
    const url = new URL(imageUrl);

    const marker =
      `/storage/v1/object/public/${BUCKET_NAME}/`;

    const index = url.pathname.indexOf(marker);

    if (index === -1) {
      return null;
    }

    return decodeURIComponent(
      url.pathname.substring(
        index + marker.length
      )
    );
  } catch (error) {
    console.error(
      "Could not extract storage path:",
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

  const { error } = await supabase
    .from("nfts")
    .delete()
    .eq("id", nft.id)
    .eq("creator_id", authUser.id);

  if (error) {
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
