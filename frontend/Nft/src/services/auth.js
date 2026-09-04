
import { supabase } from "../lib/supabase";

/**
 * Create or update the profile belonging to a wallet.
 *
 * IMPORTANT:
 * This does NOT create a Supabase email/password account.
 * The wallet address is the identity used by the application.
 */
export async function loginWithWallet(walletAddress) {
  if (!walletAddress) {
    throw new Error("Wallet address is required.");
  }

  const profile = await syncWalletProfile(walletAddress);

  if (!profile) {
    throw new Error("Unable to create or load wallet profile.");
  }

  return {
    user: null,
    profile,
  };
}

/**
 * Create or update the wallet profile.
 */
export async function syncWalletProfile(walletAddress) {
  if (!walletAddress) {
    return null;
  }

  try {
    const clean = walletAddress
      .replace(/[^a-zA-Z0-9]/g, "")
      .toUpperCase();

    const defaultUsername =
      `user_${clean.slice(2, 8).toLowerCase()}`;

    const defaultDisplayName =
      `Nimiq ${clean.slice(0, 4)}...${clean.slice(-4)}`;

    // Check whether this wallet already has a profile.
    const {
      data: existingProfile,
      error: fetchError,
    } = await supabase
      .from("profiles")
      .select("*")
      .eq("wallet_address", walletAddress)
      .maybeSingle();

    if (fetchError) {
      console.error(
        "PROFILE LOOKUP ERROR:",
        fetchError
      );

      throw fetchError;
    }

    // Existing wallet profile
    if (existingProfile) {
      return existingProfile;
    }

    /*
     * There is no Supabase auth user here.
     *
     * Therefore we cannot use auth.uid() as the profile id.
     *
     * We use a generated UUID for the profile.
     */
    const profileId = crypto.randomUUID();

    const {
      data: newProfile,
      error: insertError,
    } = await supabase
      .from("profiles")
      .insert({
        id: profileId,
        username: defaultUsername,
        display_name: defaultDisplayName,
        wallet_address: walletAddress,
      })
      .select()
      .single();

    if (insertError) {
      console.error(
        "PROFILE INSERT ERROR:",
        insertError
      );

      throw insertError;
    }

    return newProfile;
  } catch (error) {
    console.error(
      "SYNC WALLET PROFILE ERROR:",
      error
    );

    throw error;
  }
}

/**
 * Wallet-only logout.
 *
 * There is no Supabase auth session to sign out from yet.
 */
export async function logoutUser() {
  return true;
}

/**
 * Restore the wallet profile from localStorage.
 *
 * This is only a temporary client-side session mechanism.
 * Proper server-verified wallet authentication will replace this.
 */
export async function getCurrentSession() {
  const walletAddress =
    localStorage.getItem("nimiq_wallet");

  if (!walletAddress) {
    return {
      session: null,
      user: null,
      profile: null,
    };
  }

  const {
    data: profile,
    error,
  } = await supabase
    .from("profiles")
    .select("*")
    .eq("wallet_address", walletAddress)
    .maybeSingle();

  if (error) {
    console.error(
      "GET WALLET PROFILE ERROR:",
      error
    );

    return {
      session: null,
      user: null,
      profile: null,
    };
  }

  return {
    session: {
      walletAddress,
    },
    user: null,
    profile,
  };
}
