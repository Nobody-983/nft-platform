import { supabase } from "../lib/supabase";

/**
 * Derives deterministic auth credentials from a Nimiq wallet address
 */
function getCredentialsForWallet(walletAddress) {
  const clean = walletAddress.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
  const email = `${clean.toLowerCase()}@nimiq.id`;
  // Deterministic password seeded with application salt
  const password = `NimiqAuth_2026_${clean}!`;
  return { clean, email, password };
}

/**
 * Authenticate or create a Supabase user for a connected Nimiq wallet,
 * and ensure a matching row exists in the profiles table.
 */
export async function loginWithWallet(walletAddress) {
  if (!walletAddress) {
    throw new Error("Wallet address is required for authentication.");
  }

  const { email, password } = getCredentialsForWallet(walletAddress);

  let user = null;

  // 1. Try signing in with existing wallet credentials
  const { data: signInData, error: signInError } =
    await supabase.auth.signInWithPassword({
      email,
      password,
    });

  if (!signInError && signInData?.user) {
    user = signInData.user;
  } else {
    // 2. If sign-in failed, attempt to register new account
    const { data: signUpData, error: signUpError } =
      await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            wallet_address: walletAddress,
          },
        },
      });

    if (signUpError) {
      // If user already registered but sign-in failed previously
      console.warn("Sign up warning:", signUpError.message);
      // Try sign-in once more in case of edge cases
      const retry = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (retry.data?.user) {
        user = retry.data.user;
      } else {
        throw new Error(signUpError.message || "Failed to authenticate wallet with Supabase.");
      }
    } else if (signUpData?.user) {
      user = signUpData.user;
      // If session was not immediately granted (e.g. confirm email setting), try signing in
      if (!signUpData.session) {
        const retry = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (retry.data?.user) {
          user = retry.data.user;
        }
      }
    }
  }

  if (!user) {
    throw new Error("Unable to establish user session.");
  }

  // 3. Sync or create profile record in `profiles` table
  const profile = await syncWalletProfile(user, walletAddress);

  return { user, profile };
}

/**
 * Ensure the Supabase profile has the correct wallet address and default info
 */
export async function syncWalletProfile(user, walletAddress) {
  if (!user?.id) return null;

  try {
    const clean = walletAddress.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
    const defaultUsername = `user_${clean.slice(2, 8).toLowerCase()}`;
    const defaultDisplayName = `Nimiq ${clean.slice(0, 4)}...${clean.slice(-4)}`;

    const { data: existingProfile, error: fetchError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    if (fetchError) {
      console.warn("Error checking profile:", fetchError);
    }

    if (!existingProfile) {
      const { data: newProfile, error: insertError } = await supabase
        .from("profiles")
        .insert({
          id: user.id,
          username: defaultUsername,
          display_name: defaultDisplayName,
          wallet_address: walletAddress,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .maybeSingle();

      if (insertError) {
        console.error("Failed to insert profile:", insertError);
      }
      return newProfile || { id: user.id, wallet_address: walletAddress, username: defaultUsername };
    }

    // Update if wallet address is missing or different
    if (!existingProfile.wallet_address || existingProfile.wallet_address !== walletAddress) {
      const { data: updatedProfile, error: updateError } = await supabase
        .from("profiles")
        .update({
          wallet_address: walletAddress,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id)
        .select()
        .maybeSingle();

      if (updateError) {
        console.error("Failed to update profile wallet:", updateError);
      }
      return updatedProfile || existingProfile;
    }

    return existingProfile;
  } catch (err) {
    console.error("Error syncing profile:", err);
    return null;
  }
}

/**
 * Sign out from Supabase
 */
export async function logoutUser() {
  try {
    await supabase.auth.signOut();
  } catch (err) {
    console.error("Sign out error:", err);
  }
}

/**
 * Get current session and profile
 */
export async function getCurrentSession() {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error || !session?.user) {
    return { session: null, user: null, profile: null };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", session.user.id)
    .maybeSingle();

  return { session, user: session.user, profile };
}
