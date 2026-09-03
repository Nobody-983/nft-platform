import { supabase } from "../lib/supabase";

const MARKETPLACE_TABLE = "marketplace_listings";
const DEFAULT_CURRENCY = "NIM";
const ACTIVE_STATUS = "active";
const CANCELLED_STATUS = "cancelled";

// ================= GET MARKETPLACE LISTINGS =================

export async function getMarketplaceListings() {
  const { data, error } = await supabase
    .from(MARKETPLACE_TABLE)
    .select(`
      *,
      nfts (
        id,
        name,
        description,
        image_url,
        category,
        creator_id
      ),
      profiles:seller_id (
        id,
        username,
        display_name,
        avatar_url
      )
    `)
    .eq("status", ACTIVE_STATUS)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("GET MARKETPLACE LISTINGS ERROR:", error);
    throw error;
  }

  return data || [];
}

// ================= GET CURRENT USER =================

async function getCurrentUser() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    console.error("GET CURRENT USER ERROR:", error);
    throw error;
  }

  if (!user) {
    throw new Error("You must be logged in.");
  }

  return user;
}

// ================= CREATE LISTING =================

export async function createListing({
  nft_id,
  price,
  currency = DEFAULT_CURRENCY,
}) {
  if (!nft_id) {
    throw new Error("NFT ID is required.");
  }

  const numericPrice = Number(price);

  if (
    price === undefined ||
    price === null ||
    !Number.isFinite(numericPrice) ||
    numericPrice <= 0
  ) {
    throw new Error("Please enter a valid price greater than zero.");
  }

  const user = await getCurrentUser();

  /*
   * Make sure the NFT actually belongs to the logged-in user.
   * This prevents a user from attempting to list another user's NFT.
   */
  const { data: nft, error: nftError } = await supabase
    .from("nfts")
    .select("id, creator_id")
    .eq("id", nft_id)
    .single();

  if (nftError) {
    console.error("CHECK NFT OWNERSHIP ERROR:", nftError);
    throw nftError;
  }

  if (!nft) {
    throw new Error("NFT not found.");
  }

  if (nft.creator_id !== user.id) {
    throw new Error(
      "You can only list NFTs that belong to you."
    );
  }

  /*
   * Prevent multiple active listings for the same NFT.
   */
  const { data: existingListing, error: existingError } =
    await supabase
      .from(MARKETPLACE_TABLE)
      .select("id")
      .eq("nft_id", nft_id)
      .eq("status", ACTIVE_STATUS)
      .maybeSingle();

  if (existingError) {
    console.error(
      "CHECK EXISTING LISTING ERROR:",
      existingError
    );
    throw existingError;
  }

  if (existingListing) {
    throw new Error("This NFT is already listed for sale.");
  }

  const { data, error } = await supabase
    .from(MARKETPLACE_TABLE)
    .insert({
      nft_id,
      seller_id: user.id,
      price: numericPrice,
      currency: currency?.trim() || DEFAULT_CURRENCY,
      status: ACTIVE_STATUS,
    })
    .select()
    .single();

  if (error) {
    console.error("CREATE LISTING ERROR:", error);
    throw error;
  }

  return data;
}

// ================= CANCEL LISTING =================

export async function cancelListing(listingId) {
  if (!listingId) {
    throw new Error("Listing ID is required.");
  }

  const user = await getCurrentUser();

  const { data, error } = await supabase
    .from(MARKETPLACE_TABLE)
    .update({
      status: CANCELLED_STATUS,
      updated_at: new Date().toISOString(),
    })
    .eq("id", listingId)
    .eq("seller_id", user.id)
    .eq("status", ACTIVE_STATUS)
    .select()
    .single();

  if (error) {
    console.error("CANCEL LISTING ERROR:", error);
    throw error;
  }

  return data;
}

// ================= GET USER LISTINGS =================

export async function getUserListings(userId) {
  if (!userId) {
    throw new Error("User ID is required.");
  }

  const user = await getCurrentUser();

  if (user.id !== userId) {
    throw new Error(
      "You are not authorized to view these listings."
    );
  }

  const { data, error } = await supabase
    .from(MARKETPLACE_TABLE)
    .select(`
      *,
      nfts (
        id,
        name,
        description,
        image_url,
        category,
        creator_id
      )
    `)
    .eq("seller_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("GET USER LISTINGS ERROR:", error);
    throw error;
  }

  return data || [];
}