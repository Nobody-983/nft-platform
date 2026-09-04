
import { supabase } from "../lib/supabase";

function getCredentialsForWallet(walletAddress) {
  const clean = walletAddress.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();

  return {
    clean,
    email: `${clean.toLowerCase()}@nimiq.id`,
    password: `NimiqAuth_2026_${clean}!`,
  };
}

/**
 * Create or restore the Supabase account and profile associated with a wallet.
 * Wallet selection itself happens in Nimiq Pay before this function is called.
 */
export async function loginWithWallet(walletAddress) {
  if (!walletAddress) {
    throw new Error("Wallet address is required.");
  }

  const { clean, email, password } = getCredentialsForWallet(walletAddress);

  let {
    data: { user },
    error: signInError,
  } = await supabase.auth.signInWithPassword({ email, password });

  if (signInError || !user) {
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { wallet_address: walletAddress } },
    });

    if (signUpError) {
      throw new Error(signUpError.message || "Unable to create the marketplace account.");
    }

    user = signUpData.user;

    if (!signUpData.session) {
      const { data: retryData, error: retryError } =
        await supabase.auth.signInWithPassword({ email, password });

      if (retryError || !retryData.user) {
        throw new Error(
          "Marketplace account was created, but Supabase email confirmation is enabled. Disable email confirmation for wallet accounts, then reconnect."
        );
      }

      user = retryData.user;
    }
  }

  if (!user) {
    throw new Error("Unable to create the marketplace account.");
  }

  const { data: existingProfile, error: profileLookupError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (profileLookupError) {
    throw new Error(profileLookupError.message || "Unable to load the marketplace profile.");
  }

  if (existingProfile) {
    return { user, profile: existingProfile };
  }

  const username = `user_${clean.toLowerCase()}`;
  const displayName = `Nimiq ${clean.slice(0, 4)}...${clean.slice(-4)}`;

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .insert({
      id: user.id,
      username,
      display_name: displayName,
      wallet_address: walletAddress,
    })
    .select()
    .single();

  if (profileError) {
    throw new Error(profileError.message || "Unable to create the marketplace profile.");
  }

  return { user, profile };
}

/**
 * Get the current wallet profile.
 */
export async function getCurrentSession() {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session?.user) {
    return { session: null, user: null, profile: null };
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
      session: null,
      user: null,
      profile: null,
    };
  }

  return {
    session,
    user: session.user,
    profile,
  };
}

/**
 * Wallet logout.
 */
export async function logoutUser() {
  await supabase.auth.signOut();
  localStorage.removeItem("nimiq_wallet");
  return true;
}
