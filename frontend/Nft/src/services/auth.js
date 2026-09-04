
import { supabase } from "../lib/supabase";

/**
 * Create or retrieve a profile for a Nimiq wallet.
 *
 * There is NO email authentication here.
 */
export async function loginWithWallet(walletAddress) {
  if (!walletAddress) {
    throw new Error("Wallet address is required.");
  }

  const {
    data: profile,
    error,
  } = await supabase.rpc(
    "get_or_create_wallet_profile",
    {
      p_wallet_address: walletAddress,
    }
  );

  if (error) {
    console.error(
      "WALLET PROFILE ERROR:",
      error
    );

    throw new Error(
      error.message ||
        "Unable to create wallet profile."
    );
  }

  if (!profile) {
    throw new Error(
      "Unable to create or load wallet profile."
    );
  }

  return {
    user: null,
    profile,
  };
}

/**
 * Get the current wallet profile.
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

  if (!profile) {
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

/**
 * Wallet logout.
 */
export async function logoutUser() {
  localStorage.removeItem("nimiq_wallet");
  return true;
}
