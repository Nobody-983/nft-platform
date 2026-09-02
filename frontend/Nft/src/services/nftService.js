
import { supabase } from "../lib/supabase";

// ================= UPLOAD NFT IMAGE =================

export async function uploadNFTImage(file, userId) {
  if (!file) {
    throw new Error("No image selected.");
  }

  if (!userId) {
    throw new Error("User is not authenticated.");
  }

  const fileExtension = file.name
    .split(".")
    .pop()
    .toLowerCase();

  const fileName = `${crypto.randomUUID()}.${fileExtension}`;

  const filePath = `${userId}/${fileName}`;

  const { error } = await supabase.storage
    .from("nft-images")
    .upload(filePath, file);

  if (error) {
    throw error;
  }

  const { data } = supabase.storage
    .from("nft-images")
    .getPublicUrl(filePath);

  return data.publicUrl;
}

// ================= CREATE NFT =================

export async function createNFT({
  creator_id,
  name,
  description,
  image_url,
  category,
  price,
  currency,
}) {
  const { data, error } = await supabase
    .from("nfts")
    .insert([
      {
        creator_id,
        name,
        description,
        image_url,
        category,
        price,
        currency,
      },
    ])
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

// ================= DELETE NFT =================

export async function deleteNFT(nft) {
  if (!nft?.id) {
    throw new Error("NFT ID is missing.");
  }

  // Get the image path from the public URL
  const imageUrl = nft.image_url;

  if (imageUrl) {
    const marker = "/nft-images/";

    const markerIndex = imageUrl.indexOf(marker);

    if (markerIndex !== -1) {
      const filePath = decodeURIComponent(
        imageUrl.substring(
          markerIndex + marker.length
        )
      );

      const { error: storageError } =
        await supabase.storage
          .from("nft-images")
          .remove([filePath]);

      if (storageError) {
        console.error(
          "Storage delete error:",
          storageError
        );
      }
    }
  }

  // Delete NFT database record
  const { error } = await supabase
    .from("nfts")
    .delete()
    .eq("id", nft.id)
    .eq("creator_id", nft.creator_id);

  if (error) {
    throw error;
  }

  return true;
}
