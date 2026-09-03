import { supabase } from "../lib/supabase";

// ================= GET MARKETPLACE LISTINGS =================

export async function getMarketplaceListings() {
  const { data, error } = await supabase
    .from("marketplace_listings")
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
    .eq("status", "active")
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return data || [];
}

// ================= CREATE LISTING =================

export async function createListing({
  nft_id,
  price,
  currency = "NIM",
}) {
  if (!nft_id) {
    throw new Error("NFT ID is required.");
  }

  if (!price || Number(price) <= 0) {
    throw new Error("Please enter a valid price.");
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw userError;
  }

  if (!user) {
    throw new Error(
      "You must be logged in to create a listing."
    );
  }

  const { data, error } = await supabase
    .from("marketplace_listings")
    .insert({
      nft_id,
      seller_id: user.id,
      price: Number(price),
      currency,
      status: "active",
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

// ================= CANCEL LISTING =================

export async function cancelListing(listingId) {
  if (!listingId) {
    throw new Error("Listing ID is required.");
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw userError;
  }

  if (!user) {
    throw new Error(
      "You must be logged in to cancel a listing."
    );
  }

  const { data, error } = await supabase
    .from("marketplace_listings")
    .update({
      status: "cancelled",
      updated_at: new Date().toISOString(),
    })
    .eq("id", listingId)
    .eq("seller_id", user.id)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

// ================= GET USER LISTINGS =================

export async function getUserListings(userId) {
  if (!userId) {
    throw new Error("User ID is required.");
  }

  const { data, error } = await supabase
    .from("marketplace_listings")
    .select(`
      *,
      nfts (
        id,
        name,
        description,
        image_url,
        category
      )
    `)
    .eq("seller_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return data || [];
}