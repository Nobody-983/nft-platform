
import { supabase } from "../lib/supabase";

// ================= WALLET HELPERS =================

function normalizeWalletAddress(address) {
  if (!address) return "";

  return address
    .replace(/\s+/g, "")
    .toUpperCase();
}

function getCredentialsForWallet(walletAddress) {
  const clean = normalizeWalletAddress(walletAddress);

  return {
    clean,
    email: `${clean.toLowerCase()}@nimiq.id`,
    password: `NimiqAuth_2026_${clean}!`,
  };
}

// ================= LOGIN WITH WALLET =================

export async function loginWithWallet(walletAddress) {
  if (!walletAddress) {
    throw new Error("Wallet address is required.");
  }

  const normalizedAddress =
    normalizeWalletAddress(walletAddress);

  const {
    clean,
    email,
    password,
  } = getCredentialsForWallet(normalizedAddress);

  // Try to sign in to the wallet's Supabase account.
  let {
    data: { user },
    error: signInError,
  } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  // Create the account if it doesn't exist.
  if (signInError || !user) {
    const {
      data: signUpData,
      error: signUpError,
    } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          wallet_address: normalizedAddress,
        },
      },
    });

    if (signUpError) {
      throw new Error(
        signUpError.message ||
          "Unable to create the marketplace account."
      );
    }

    user = signUpData.user;

    if (!signUpData.session) {
      const {
        data: retryData,
        error: retryError,
      } =
        await supabase.auth.signInWithPassword({
          email,
          password,
        });

      if (retryError || !retryData.user) {
        throw new Error(
          "Marketplace account was created, but Supabase email confirmation is enabled. Disable email confirmation for wallet accounts, then reconnect."
        );
      }

      user = retryData.user;
    }
  }

  if (!user) {
    throw new Error(
      "Unable to create the marketplace account."
    );
  }

  // ================= LOAD PROFILE =================

  const {
    data: existingProfile,
    error: profileLookupError,
  } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (profileLookupError) {
    throw new Error(
      profileLookupError.message ||
        "Unable to load the marketplace profile."
    );
  }

  // ================= EXISTING PROFILE =================

  if (existingProfile) {
    const existingWallet =
      normalizeWalletAddress(
        existingProfile.wallet_address
      );

    // The profile already belongs to this wallet.
    if (existingWallet === normalizedAddress) {
      return {
        user,
        profile: existingProfile,
      };
    }

    /*
     * The Supabase account exists, but its stored wallet
     * address is different.
     *
     * The connected Nimiq wallet is the source of truth,
     * so update the profile to the currently connected wallet.
     */
    const {
      data: updatedProfile,
      error: updateError,
    } = await supabase
      .from("profiles")
      .update({
        wallet_address: normalizedAddress,
      })
      .eq("id", user.id)
      .select()
      .single();

    if (updateError) {
      throw new Error(
        updateError.message ||
          "Unable to update the wallet linked to this marketplace account."
      );
    }

    return {
      user,
      profile: updatedProfile,
    };
  }

  // ================= CREATE PROFILE =================

  const username =
    `user_${clean.toLowerCase()}`;

  const displayName =
    `Nimiq ${clean.slice(0, 4)}...${clean.slice(-4)}`;

  const {
    data: profile,
    error: profileError,
  } = await supabase
    .from("profiles")
    .insert({
      id: user.id,
      username,
      display_name: displayName,
      wallet_address: normalizedAddress,
    })
    .select()
    .single();

  if (profileError) {
    throw new Error(
      profileError.message ||
        "Unable to create the marketplace profile."
    );
  }

  return {
    user,
    profile,
  };
}

// ================= GET CURRENT SESSION =================

export async function getCurrentSession() {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session?.user) {
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
    .eq("id", session.user.id)
    .maybeSingle();

  if (error) {
    console.error(
      "GET WALLET PROFILE ERROR:",
      error
    );

    return {
      session,
      user: session.user,
      profile: null,
    };
  }

  return {
    session,
    user: session.user,
    profile,
  };
}

// ================= LOGOUT =================

export async function logoutUser() {
  const { error } =
    await supabase.auth.signOut();

  if (error) {
    throw new Error(
      error.message || "Failed to sign out."
    );
  }

  localStorage.removeItem("nimiq_wallet");

  return true;
}
