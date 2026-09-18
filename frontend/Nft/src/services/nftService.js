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

// ---------------------------------------------
// Validate image
// ---------------------------------------------
function validateImage(file) {
  if (!file) {
    throw new Error("IMAGE ERROR: No image selected.");
  }

  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    throw new Error(
      "IMAGE ERROR: Only PNG, JPEG, and WebP images are allowed."
    );
  }

  if (file.size > MAX_IMAGE_SIZE) {
    throw new Error(
      "IMAGE ERROR: Image must be smaller than 5MB."
    );
  }

  const extension = file.name
    ?.split(".")
    .pop()
    ?.toLowerCase();

  if (!extension || !ALLOWED_EXTENSIONS.includes(extension)) {
    throw new Error(
      "IMAGE ERROR: Invalid image file extension."
    );
  }
}

// ---------------------------------------------
// Get authenticated user
// ---------------------------------------------
async function getAuthenticatedUser() {
  const { data, error } = await supabase.auth.getSession();

  if (error) {
    throw new Error(
      `SESSION CHECK FAILED: ${error.message}`
    );
  }

  const session = data?.session;

  if (!session?.user) {
    throw new Error(
      "SESSION CHECK FAILED: No authenticated Supabase user."
    );
  }

  if (!session.access_token) {
    throw new Error(
      "SESSION CHECK FAILED: No Supabase access token."
    );
  }

  return session.user;
}

// ---------------------------------------------
// Generate unique filename
// ---------------------------------------------
function generateFileName(file) {
  const extension = file.name
    .split(".")
    .pop()
    .toLowerCase();

  return `${crypto.randomUUID()}.${extension}`;
}

// ---------------------------------------------
// Upload NFT image
// ---------------------------------------------
export async function uploadNFTImage(file, userId) {
  validateImage(file);

  if (!userId) {
    throw new Error(
      "IMAGE UPLOAD FAILED: Missing user ID."
    );
  }

  const user = await getAuthenticatedUser();

  if (user.id !== userId) {
    throw new Error(
      "IMAGE UPLOAD FAILED: Authenticated user does not match user ID."
    );
  }

  const fileName = generateFileName(file);
  const filePath = `${userId}/${fileName}`;

  // ---------------------------------------------
  // Confirm authenticated Supabase connection
  // ---------------------------------------------
  try {
    const {
      data: sessionData,
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError) {
      throw new Error(
        `SESSION CHECK FAILED: ${sessionError.message}`
      );
    }

    const accessToken =
      sessionData?.session?.access_token;

    if (!accessToken) {
      throw new Error(
        "SESSION CHECK FAILED: No access token available."
      );
    }

    const response = await fetch(
      "https://asjwpgomjnpvhkjajvlc.supabase.co/storage/v1/bucket",
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          apikey:
            import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
      }
    );

    const responseText = await response.text();

    if (!response.ok) {
      throw new Error(
        `SUPABASE CONNECTION FAILED: status=${response.status}, response=${responseText}`
      );
    }
  } catch (error) {
    throw new Error(
      error?.message ||
        `SUPABASE CONNECTION FAILED: ${String(error)}`
    );
  }

  // ---------------------------------------------
  // Actual Storage upload
  // ---------------------------------------------
  try {
    const {
      data,
      error,
    } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, file, {
        cacheControl: "31536000",
        contentType: file.type,
        upsert: false,
      });

    if (error) {
      throw new Error(
        `SUPABASE STORAGE ERROR: ${error.message}`
      );
    }

    if (!data?.path) {
      throw new Error(
        "STORAGE ERROR: Upload succeeded but no file path was returned."
      );
    }

    // ---------------------------------------------
    // Generate public URL
    // ---------------------------------------------
    const {
      data: publicUrlData,
    } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(filePath);

    if (!publicUrlData?.publicUrl) {
      throw new Error(
        "STORAGE ERROR: Could not generate public URL."
      );
    }

    return {
      publicUrl: publicUrlData.publicUrl,
      filePath: data.path,
    };
  } catch (error) {
    throw new Error(
      error?.message ||
        `IMAGE UPLOAD FAILED: ${String(error)}`
    );
  }
}

// ---------------------------------------------
// Delete NFT image
// ---------------------------------------------
export async function deleteNFTImage(filePath) {
  if (!filePath) {
    return;
  }

  try {
    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([filePath]);

    if (error) {
      throw new Error(
        `IMAGE DELETE FAILED: ${error.message}`
      );
    }
  } catch (error) {
    throw new Error(
      error?.message ||
        `IMAGE DELETE FAILED: ${String(error)}`
    );
  }
}

// ---------------------------------------------
// Create NFT
// ---------------------------------------------
export async function createNFT({
  name,
  description,
  image_url,
  category,
  price,
  currency,
}) {
  try {
    const user = await getAuthenticatedUser();

    const {
      data,
      error,
    } = await supabase
      .from("nfts")
      .insert({
        creator_id: user.id,
        name,
        description,
        image_url,
        category,
        price,
        currency,
      })
      .select()
      .single();

    if (error) {
      throw new Error(
        `NFT DATABASE INSERT FAILED: ${error.message}`
      );
    }

    if (!data) {
      throw new Error(
        "NFT DATABASE INSERT FAILED: No NFT was returned."
      );
    }

    return data;
  } catch (error) {
    throw new Error(
      error?.message ||
        `NFT DATABASE INSERT FAILED: ${String(error)}`
    );
  }
}

// ---------------------------------------------
// Delete NFT
// ---------------------------------------------
export async function deleteNFT(nft) {
  if (!nft?.id) {
    throw new Error(
      "DELETE NFT FAILED: Missing NFT ID."
    );
  }

  try {
    const user = await getAuthenticatedUser();

    if (nft.creator_id !== user.id) {
      throw new Error(
        "DELETE NFT FAILED: You are not the owner of this NFT."
      );
    }

    const {
      error: dbError,
    } = await supabase
      .from("nfts")
      .delete()
      .eq("id", nft.id);

    if (dbError) {
      throw new Error(
        `NFT DATABASE DELETE FAILED: ${dbError.message}`
      );
    }

    if (nft.image_path) {
      await deleteNFTImage(nft.image_path);
    }

    return true;
  } catch (error) {
    throw new Error(
      error?.message ||
        `DELETE NFT FAILED: ${String(error)}`
    );
  }
}