
import { useCallback, useEffect, useState } from "react";
import { Sun, Zap, Loader2 } from "lucide-react";

import { useWallet } from "../../context/walletContext";
import { supabase } from "../../lib/supabase";
import {
  initNimiq,
  fetchNimiqBalance,
  sendNIMTransaction,
} from "../../lib/nimiq";

// Replace this with the public Nimiq wallet that receives
// payments for tap packs.
const GAME_TREASURY_ADDRESS =
  "REPLACE_WITH_GAME_TREASURY_ADDRESS";

const TAP_PACKS = [
  {
    taps: 10,
    price: 0.1,
    popular: true,
  },
  {
    taps: 50,
    price: 0.5,
  },
  {
    taps: 100,
    price: 1,
  },
];

const MILESTONE_LEVELS = [
  {
    level: 1,
    tapsRequired: 50,
    reward: "Bronze NFT",
  },
  {
    level: 2,
    tapsRequired: 200,
    reward: "Silver NFT",
  },
  {
    level: 3,
    tapsRequired: 500,
    reward: "Gold NFT",
  },
];

function Game() {
  const {
    walletAddress,
    isConnected,
    user,
    balance,
    refreshBalance,
  } = useWallet();

  const [tapCount, setTapCount] = useState(0);

  const [isLoadingGame, setIsLoadingGame] =
    useState(true);

  const [isTapping, setIsTapping] =
    useState(false);

  const [buyingPack, setBuyingPack] =
    useState(null);

  const [claimedRewardLevels, setClaimedRewardLevels] =
    useState([]);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [leaderboard, setLeaderboard] =
    useState([]);

  const [loadingLeaderboard, setLoadingLeaderboard] =
    useState(true);

  const [errorLeaderboard, setErrorLeaderboard] =
    useState("");

  /*
   * ========================================================
   * LOAD GAME DATA
   * ========================================================
   */

  const loadGameData = useCallback(async () => {
    if (!user?.id) {
      setTapCount(0);
      setClaimedRewardLevels([]);
      setIsLoadingGame(false);
      return;
    }

    setIsLoadingGame(true);
    setError("");

    try {
      const [
        { data: profile, error: profileError },
        { data: claims, error: claimsError },
      ] = await Promise.all([
        supabase
          .from("profiles")
          .select("tap_count")
          .eq("id", user.id)
          .single(),

        supabase
          .from("reward_claims")
          .select("reward_level")
          .eq("user_id", user.id),
      ]);

      if (profileError) {
        throw new Error(
          profileError.message ||
            "Unable to load your game profile."
        );
      }

      if (claimsError) {
        throw new Error(
          claimsError.message ||
            "Unable to load your rewards."
        );
      }

      setTapCount(
        Number(profile?.tap_count) || 0
      );

      setClaimedRewardLevels(
        (claims || []).map((claim) =>
          Number(claim.reward_level)
        )
      );
    } catch (err) {
      console.error(
        "Game data error:",
        err
      );

      setError(
        err?.message ||
          "Failed to load your game data."
      );
    } finally {
      setIsLoadingGame(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadGameData();
  }, [loadGameData]);

  /*
   * ========================================================
   * LEADERBOARD
   * ========================================================
   */

  const loadLeaderboard = useCallback(
    async () => {
      setLoadingLeaderboard(true);
      setErrorLeaderboard("");

      try {
        const {
          data,
          error: leaderboardError,
        } = await supabase
          .from("profiles")
          .select(
            "id, username, display_name, tap_count"
          )
          .order("tap_count", {
            ascending: false,
          })
          .limit(10);

        if (leaderboardError) {
          throw leaderboardError;
        }

        setLeaderboard(
          (data || []).map((entry, index) => ({
            id: entry.id,

            username:
              entry.username ||
              entry.display_name ||
              `Player ${index + 1}`,

            tap_count:
              Number(entry.tap_count) || 0,
          }))
        );
      } catch (err) {
        console.error(
          "Leaderboard error:",
          err
        );

        setErrorLeaderboard(
          err?.message ||
            "Failed to load leaderboard."
        );
      } finally {
        setLoadingLeaderboard(false);
      }
    },
    []
  );

  useEffect(() => {
    loadLeaderboard();
  }, [loadLeaderboard]);

  /*
   * ========================================================
   * TAP THE COIN
   * ========================================================
   */

  const handleTap = async () => {
    if (
      !user?.id ||
      isTapping ||
      isLoadingGame
    ) {
      return;
    }

    setIsTapping(true);
    setError("");
    setSuccess("");

    const previousCount = tapCount;
    const newCount = previousCount + 1;

    // Update UI immediately.
    setTapCount(newCount);

    try {
      const {
        error: updateError,
      } = await supabase
        .from("profiles")
        .update({
          tap_count: newCount,
        })
        .eq("id", user.id);

      if (updateError) {
        throw updateError;
      }
    } catch (err) {
      console.error(
        "Tap update error:",
        err
      );

      // Roll back if database update fails.
      setTapCount(previousCount);

      setError(
        err?.message ||
          "Tap could not be saved."
      );
    } finally {
      setIsTapping(false);
    }
  };

  /*
   * ========================================================
   * BUY TAP PACK
   * ========================================================
   */

  const handleBuyTapPack = async (pack) => {
    const { taps, price } = pack;

    if (
      !user?.id ||
      !walletAddress ||
      !isConnected
    ) {
      setError(
        "Connect your Nimiq wallet first."
      );
      return;
    }

    if (
      GAME_TREASURY_ADDRESS ===
      "REPLACE_WITH_GAME_TREASURY_ADDRESS"
    ) {
      setError(
        "Game payment wallet has not been configured."
      );
      return;
    }

    if (buyingPack !== null) {
      return;
    }

    setBuyingPack(taps);
    setError("");
    setSuccess("");

    try {
      /*
       * Check balance.
       */

      const currentBalance =
        await fetchNimiqBalance(
          walletAddress
        );

      if (
        (currentBalance || 0) < price
      ) {
        throw new Error(
          `You need at least ${price} NIM to purchase this pack.`
        );
      }

      /*
       * Initialize Nimiq wallet.
       */

      const provider =
        await initNimiq({
          timeout: 10000,
        });

      /*
       * Send NIM to the game treasury.
       */

      const txHash =
        await sendNIMTransaction(
          provider,
          {
            recipient:
              GAME_TREASURY_ADDRESS,

            valueInNim: price,
          }
        );

      if (!txHash) {
        throw new Error(
          "Transaction did not return a transaction hash."
        );
      }

      /*
       * Add purchased taps.
       *
       * NOTE:
       * A production implementation should verify the
       * blockchain transaction on the backend before
       * awarding the taps.
       */

      const newTapCount =
        tapCount + taps;

      const {
        error: updateError,
      } = await supabase
        .from("profiles")
        .update({
          tap_count: newTapCount,
        })
        .eq("id", user.id);

      if (updateError) {
        throw new Error(
          "Payment was submitted, but the taps could not be recorded. Transaction: " +
            txHash
        );
      }

      setTapCount(newTapCount);

      setSuccess(
        `Purchased ${taps} taps for ${price} NIM.`
      );

      /*
       * Refresh balance.
       */

      if (refreshBalance) {
        await refreshBalance(
          walletAddress
        );
      }

      await loadLeaderboard();
    } catch (err) {
      console.error(
        "Tap purchase error:",
        err
      );

      setError(
        err?.message ||
          "Tap purchase failed."
      );
    } finally {
      setBuyingPack(null);
    }
  };

  /*
   * ========================================================
   * REWARDS
   * ========================================================
   */

  const hasClaimedReward = (level) => {
    return claimedRewardLevels.includes(
      level
    );
  };

  const claimReward = async (level) => {
    if (!user?.id) {
      setError(
        "Connect your wallet first."
      );
      return;
    }

    const milestone =
      MILESTONE_LEVELS.find(
        (item) =>
          item.level === level
      );

    if (!milestone) {
      return;
    }

    if (
      tapCount <
      milestone.tapsRequired
    ) {
      setError(
        `You need ${milestone.tapsRequired} taps to claim this reward.`
      );
      return;
    }

    if (
      hasClaimedReward(level)
    ) {
      setError(
        "This reward has already been claimed."
      );
      return;
    }

    setError("");
    setSuccess("");

    try {
      const {
        error: claimError,
      } = await supabase
        .from("reward_claims")
        .insert({
          user_id: user.id,
          reward_level: level,
        });

      if (claimError) {
        throw claimError;
      }

      setClaimedRewardLevels(
        (previous) => [
          ...previous,
          level,
        ]
      );

      setSuccess(
        `${milestone.reward} claimed successfully.`
      );
    } catch (err) {
      console.error(
        "Reward claim error:",
        err
      );

      setError(
        err?.message ||
          "Failed to claim reward."
      );
    }
  };

  /*
   * ========================================================
   * WALLET DISPLAY
   * ========================================================
   */

  const shortWallet =
    walletAddress
      ? `${walletAddress.slice(
          0,
          6
        )}...${walletAddress.slice(-6)}`
      : "Not connected";

  /*
   * ========================================================
   * LOADING
   * ========================================================
   */

  if (isLoadingGame) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#08080f] text-white">
        <div className="flex flex-col items-center gap-3">
          <Loader2
            size={28}
            className="animate-spin text-purple-500"
          />

          <p className="text-sm text-gray-400">
            Loading Game Center...
          </p>
        </div>
      </div>
    );
  }

  /*
   * ========================================================
   * PAGE
   * ========================================================
   */

  return (
    <div className="min-h-screen bg-[#08080f] p-6 text-white">

      {/* HEADER */}

      <div className="mb-8">
        <h1 className="text-3xl font-bold">
          Game Center
        </h1>

        <p className="mt-2 text-sm text-gray-400">
          Tap the Nimiq coin, earn taps,
          and unlock NFT rewards.
        </p>

        {isConnected &&
          walletAddress && (
            <p className="mt-3 text-xs text-gray-500">
              Wallet:{" "}
              <span className="text-gray-300">
                {shortWallet}
              </span>
            </p>
          )}
      </div>

      {/* ERROR */}

      {error && (
        <div className="mb-6 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {/* SUCCESS */}

      {success && (
        <div className="mb-6 rounded-xl border border-green-500/20 bg-green-500/10 px-4 py-3 text-sm text-green-300">
          {success}
        </div>
      )}

      {/* TAP GAME */}

      <div className="mb-8">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">
              Tap the Nimiq Coin
            </h2>

            <p className="text-sm text-gray-400">
              Every tap increases your total.
            </p>
          </div>

          <div className="text-right">
            <p className="text-xs text-gray-500">
              Total taps
            </p>

            <p className="text-2xl font-bold">
              {tapCount}
            </p>
          </div>
        </div>

        <div
          className={`
            rounded-3xl border border-white/10
            bg-white/[0.03] p-8 text-center
            transition-transform duration-100
            ${
              isTapping
                ? "scale-[0.97]"
                : "hover:bg-white/[0.05]"
            }
            ${
              !user?.id
                ? "cursor-not-allowed opacity-60"
                : "cursor-pointer"
            }
          `}
          onClick={handleTap}
          role="button"
          tabIndex={0}
          onKeyDown={(event) => {
            if (
              event.key === "Enter" ||
              event.key === " "
            ) {
              event.preventDefault();
              handleTap();
            }
          }}
          aria-label="Tap the Nimiq coin"
        >
          <div className="relative mx-auto flex h-28 w-28 items-center justify-center">
            <Sun
              size={100}
              className="text-purple-500/60"
            />

            <Zap
              size={45}
              className={`
                absolute text-yellow-400
                transition-opacity duration-100
                ${
                  isTapping
                    ? "opacity-100"
                    : "opacity-0"
                }
              `}
            />
          </div>

          <p className="mt-5 text-xl font-bold">
            {user?.id
              ? "Tap"
              : "Connect wallet to play"}
          </p>

          {isTapping && (
            <p className="mt-2 text-sm text-purple-400">
              +1 tap
            </p>
          )}
        </div>
      </div>

      {/* TAP BALANCE */}

      <div className="mb-8 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
        <div className="mb-5 flex items-center justify-between">
          <span className="text-gray-300">
            Tap Balance
          </span>

          <p className="text-2xl font-bold">
            {tapCount} taps
          </p>
        </div>

        <div className="space-y-3">
          {MILESTONE_LEVELS.map(
            (milestone) => {
              const alreadyClaimed =
                hasClaimedReward(
                  milestone.level
                );

              const unlocked =
                tapCount >=
                milestone.tapsRequired;

              return (
                <div
                  key={milestone.level}
                  className={`
                    flex items-center gap-3
                    rounded-xl border
                    border-white/5 p-3
                    ${
                      unlocked &&
                      !alreadyClaimed
                        ? "bg-purple-500/5"
                        : ""
                    }
                  `}
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-purple-600/10 text-sm font-medium text-purple-400">
                    {milestone.level}
                  </span>

                  <div className="flex-1">
                    <p className="font-medium">
                      Level{" "}
                      {milestone.level}
                    </p>

                    <p className="text-xs text-gray-400">
                      {
                        milestone.tapsRequired
                      }{" "}
                      taps •{" "}
                      {milestone.reward}
                    </p>
                  </div>

                  {alreadyClaimed ? (
                    <span className="text-xs text-gray-500">
                      Claimed
                    </span>
                  ) : unlocked ? (
                    <button
                      onClick={() =>
                        claimReward(
                          milestone.level
                        )
                      }
                      className="rounded-xl bg-purple-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-purple-700"
                    >
                      Claim
                    </button>
                  ) : (
                    <span className="text-xs text-gray-500">
                      Locked
                    </span>
                  )}
                </div>
              );
            }
          )}
        </div>
      </div>

      {/* BUY TAPS */}

      <div className="mb-8 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
        <div className="mb-5">
          <h2 className="text-xl font-bold">
            Buy Taps
          </h2>

          <p className="mt-1 text-sm text-gray-400">
            Purchase additional taps using
            NIM.
          </p>
        </div>

        {!isConnected ||
        !walletAddress ? (
          <div className="rounded-xl border border-white/5 bg-white/[0.02] p-6 text-center">
            <p className="text-sm text-gray-400">
              Connect your Nimiq wallet
              to buy taps.
            </p>
          </div>
        ) : (
          <>
            {/* BALANCE */}

            <div className="mb-5 flex items-center justify-between rounded-xl bg-white/[0.03] p-4">
              <span className="text-sm text-gray-400">
                NIM Balance
              </span>

              <span className="font-semibold">
                {(balance || 0).toFixed(
                  4
                )}{" "}
                NIM
              </span>
            </div>

            {/* PACKS */}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {TAP_PACKS.map(
                (pack) => {
                  const affordable =
                    (balance || 0) >=
                    pack.price;

                  const purchasing =
                    buyingPack ===
                    pack.taps;

                  return (
                    <div
                      key={pack.taps}
                      className={`
                        rounded-xl border
                        border-white/10
                        bg-white/[0.03] p-5
                        ${
                          pack.popular
                            ? "border-purple-500/30"
                            : ""
                        }
                        ${
                          !affordable
                            ? "opacity-60"
                            : ""
                        }
                      `}
                    >
                      {pack.popular && (
                        <span className="mb-3 inline-block rounded-full bg-purple-500/10 px-2 py-1 text-[10px] font-medium uppercase tracking-wide text-purple-400">
                          Popular
                        </span>
                      )}

                      <p className="text-sm text-gray-400">
                        +{pack.taps} taps
                      </p>

                      <p className="mt-1 text-xl font-bold">
                        {pack.price} NIM
                      </p>

                      <button
                        onClick={() =>
                          handleBuyTapPack(
                            pack
                          )
                        }
                        disabled={
                          !affordable ||
                          buyingPack !==
                            null
                        }
                        className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-purple-600 py-3 font-medium text-white transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {purchasing ? (
                          <>
                            <Loader2
                              size={16}
                              className="animate-spin"
                            />
                            Processing...
                          </>
                        ) : affordable ? (
                          "Purchase"
                        ) : (
                          "Insufficient NIM"
                        )}
                      </button>
                    </div>
                  );
                }
              )}
            </div>
          </>
        )}
      </div>

      {/* STATISTICS */}

      <div className="mb-8 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
        <h2 className="mb-4 text-xl font-bold">
          Statistics
        </h2>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-400">
              Total taps
            </p>

            <p className="text-2xl font-bold">
              {tapCount}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-400">
              Games played
            </p>

            <p className="text-2xl font-bold">
              —
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-400">
              Avg taps/game
            </p>

            <p className="text-2xl font-bold">
              —
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-400">
              Best streak
            </p>

            <p className="text-2xl font-bold">
              —
            </p>
          </div>
        </div>
      </div>

      {/* LEADERBOARD */}

      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
        <div className="mb-4">
          <h2 className="text-xl font-bold">
            Leaderboard
          </h2>

          <p className="mt-1 text-sm text-gray-400">
            Top players by total taps.
          </p>
        </div>

        {loadingLeaderboard ? (
          <div className="flex min-h-[160px] items-center justify-center gap-3">
            <Loader2
              size={20}
              className="animate-spin text-purple-500"
            />

            <p className="text-sm text-gray-400">
              Loading leaderboard...
            </p>
          </div>
        ) : errorLeaderboard ? (
          <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-6 text-center">
            <p className="text-sm text-red-400">
              {errorLeaderboard}
            </p>

            <button
              onClick={
                loadLeaderboard
              }
              className="mt-3 text-xs text-gray-400 underline"
            >
              Try again
            </button>
          </div>
        ) : leaderboard.length ===
          0 ? (
          <div className="py-10 text-center">
            <p className="text-gray-400">
              No leaderboard data
              available.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {leaderboard.map(
              (entry, index) => (
                <div
                  key={entry.id}
                  className={`
                    flex items-center gap-3
                    rounded-xl border
                    border-white/10
                    bg-white/[0.03] p-4
                    ${
                      entry.id ===
                      user?.id
                        ? "border-purple-500/30 bg-purple-500/5"
                        : ""
                    }
                  `}
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-purple-600/10 text-sm font-bold text-purple-400">
                    {index + 1}
                  </span>

                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">
                      {entry.username}

                      {entry.id ===
                        user?.id && (
                        <span className="ml-2 text-xs text-purple-400">
                          You
                        </span>
                      )}
                    </p>

                    <p className="text-xs text-gray-400">
                      {
                        entry.tap_count
                      }{" "}
                      taps
                    </p>
                  </div>
                </div>
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default Game;
