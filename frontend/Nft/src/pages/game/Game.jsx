import { useEffect, useState } from "react";
import { Sun, Zap, Loader2 } from "lucide-react";

import { useWallet } from "../../context/walletContext";
import { supabase } from "../../lib/supabase";
import { initNimiq, fetchNimiqBalance, sendNIMTransaction } from "../../lib/nimiq";

function Game() {
  const {
    walletAddress,
    isConnected,
    user,
    balance,
    connectWallet,
    disconnectWallet,
  } = useWallet();

  const [tapCount, setTapCount] = useState(0);
  const [isTapping, setIsTapping] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [buyTapPacks, setBuyTapPacks] = useState([
    { taps: 10, price: 0.1, popular: true },
    { taps: 50, price: 0.5 },
    { taps: 100, price: 1.0 },
  ]);

  const [claimedRewardLevels, setClaimedRewardLevels] = useState([]);

  const [loadingLeaderboard, setLoadingLeaderboard] = useState(true);
  const [errorLeaderboard, setErrorLeaderboard] = useState("");
  const [leaderboard, setLeaderboard] = useState([]);

  useEffect(() => {
    if (!user?.id) return;
    supabase.from("reward_claims").select("reward_level").eq("user_id", user.id).then(
      (res) => {
        if (res.data && res.data.length > 0) {
          setClaimedRewardLevels(res.data.map((r) => r.reward_level));
        }
      }
    );
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;

    setLoadingLeaderboard(true);
    setErrorLeaderboard("");

    supabase.from("profiles").select("username, tap_count").order("tap_count", { ascending: false }).limit(10).then(
      (res) => {
        if (res.data && res.data.length > 0) {
          setLeaderboard(res.data.map((r, index) => ({
            username: r.username || `Player ${index + 1}`,
            tap_count: r.tap_count || 0,
            id: r.id,
          })));
        } else {
          setLeaderboard([]);
        }
        setLoadingLeaderboard(false);
      }
    ).catch((err) => {
      console.error("Leaderboard fetch error:", err);
      setErrorLeaderboard("Failed to load leaderboard.");
      setLoadingLeaderboard(false);
    });
  }, [user?.id]);

  const hasClaimedReward = (level) => claimedRewardLevels.includes(level);

  const handleTap = async () => {
    if (isTapping) return;
    setIsTapping(true);
    setError("");
    try {
      const newCount = tapCount + 1;
      setTapCount(newCount);
      if (user?.id) {
        await supabase.from("profiles").update({ tap_count: newCount }).eq("id", user.id);
      }
    } catch (err) {
      setError("Tap failed");
      setTapCount(tapCount > 0 ? tapCount : 0);
    } finally {
      setIsTapping(false);
    }
  };

  const handleBuyTapPack = async (pack) => {
    const { taps, price } = pack;
    if (!user?.id || !walletAddress) {
      setError("Connect wallet first");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const bal = await fetchNimiqBalance(walletAddress);
      if ((bal || 0) < price) {
        setError("Insufficient NIM balance");
        setLoading(false);
        return;
      }
      const provider = await initNimiq({ timeout: 10000 });
      const txHash = await sendNIMTransaction(provider, {
        recipient: walletAddress,
        valueInNim: price,
      });
      // Update tap count in database first (server-side verification)
      if (user?.id) {
        const { error: dbError } = await supabase
          .from("profiles")
          .update({ tap_count: tapCount + taps })
          .eq("id", user.id);

        if (dbError) {
          throw new Error("Failed to record tap purchase. Please try again.");
        }
      }
      // Update local state after successful database write
      setTapCount(tapCount + taps);
      setError(`Purchased ${taps} taps for ${price} NIM`);
    } catch (err) {
      setError(err?.message || "Purchase failed");
      setTapCount(tapCount);
    } finally {
      setLoading(false);
    }
  };

  const milestoneLevels = [
    { level: 1, tapsRequired: 0, reward: "Bronze NFT" },
    { level: 2, tapsRequired: 50, reward: "Silver NFT" },
    { level: 3, tapsRequired: 200, reward: "Gold NFT" },
  ];

  const claimReward = async (level) => {
    if (!user?.id) return;
    const milestone = milestoneLevels.find((m) => m.level === level);
    if (!milestone) return;
    if (tapCount < milestone.tapsRequired) {
      setError(`Need ${milestone.tapsRequired} taps`);
      return;
    }
    if (hasClaimedReward(level)) {
      setError("Already claimed");
      return;
    }
    try {
      await supabase.from("reward_claims").insert({ user_id: user.id, reward_level: level });
      setClaimedRewardLevels([...claimedRewardLevels, level]);
      setTapCount(0);
    } catch (err) {
      setError("Failed to claim reward");
    }
  };

  const shortWallet = walletAddress ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-6)}` : "Connect wallet";

  return (
    <div className="min-h-screen bg-[#08080f] text-white p-6">
      <h1 className="text-3xl font-bold mb-6">Game Center</h1>
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold">Tap the Nimiq Coin</h2>
            <p className="text-sm text-gray-400">Increase your tap balance</p>
          </div>
          <div className="text-right">
            <p className="text-lg font-medium">#{tapCount}</p>
          </div>
        </div>
        <div
          className={`
            rounded-3xl border border-white/10 bg-white/[0.03]
            p-8 text-center cursor-pointer
            transition-all duration-150
            ${isTapping ? "scale-95" : ""}
          `}
          onClick={handleTap}
          onTouchStart={handleTap}
          aria-label="Tap the Nimiq coin"
        >
          <div className="inline-block aspect-square">
            <Sun size={80} className="text-purple-500/50" />
            <Zap size={80} className="text-yellow-400/50 opacity-0 transition-opacity duration-150" />
          </div>
          <p className="mt-4 text-xl font-bold">Tap</p>
        </div>
        {isTapping && <p className="mt-2 text-sm text-purple-400">Tap registered!</p>}
      </div>

      <div className="mb-8 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
        <div className="flex items-center justify-between">
          <span>Tap Balance</span>
          <p className="text-2xl font-bold">{tapCount} taps</p>
        </div>
        <div className="mt-4">
          {milestoneLevels.map((milestone) => {
            const alreadyClaimed = hasClaimedReward(milestone.level);
            return (
              <div
                key={milestone.level}
                className={`mt-2 flex items-center gap-3 ${tapCount >= milestone.tapsRequired && !alreadyClaimed ? "text-purple-400" : "text-gray-500"}`}
              >
                <span className="w-8 h-8 rounded-full bg-purple-600/10 text-purple-400 flex items-center justify-center text-sm font-medium">
                  {milestone.level}
                </span>
                <span className="flex-1">
                  <p className="font-medium">Level {milestone.level}</p>
                  <p className="text-xs text-gray-400">#{milestone.tapsRequired} taps</p>
                </span>
                {tapCount >= milestone.tapsRequired && !alreadyClaimed ? (
                  <button onClick={() => claimReward(milestone.level)} className="rounded-xl bg-purple-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-purple-700 transition">
                    Claim
                  </button>
                ) : alreadyClaimed && <span className="text-xs text-gray-400">Claimed</span>}
              </div>
            );
          })}
        </div>
      </div>

      {isConnected && (
        <div className="mb-8 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <h2 className="text-xl font-bold mb-4">Buy Taps</h2>
          {loading ? (
            <div className="flex min-h-[200px] items-center justify-center">
              <Loader2 size={20} className="animate-spin text-purple-500" />
              <p className="mt-2">Processing purchase...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {buyTapPacks.map((pack, index) => {
                const { taps, price, popular } = pack;
                const isAffordable = (balance || 0) >= price;
                return (
                  <div
                    key={index}
                    className={`border border-white/10 bg-white/[0.03] rounded-xl p-5 ${popular ? "border-purple-500/30 shadow-lg" : ""}${!isAffordable ? " opacity-50" : ""}`}
                  >
                    <div className="mb-3">
                      <p className="text-sm text-gray-400">+{taps} taps</p>
                      <p className="text-xl font-bold">{price} NIM</p>
                    </div>
                    <button
                      onClick={() => handleBuyTapPack(pack)}
                      disabled={!isAffordable || isTapping || loading}
                      className={`w-full rounded-xl py-3 font-medium transition ${popular ? "bg-purple-600 text-white" : "border border-purple-500/30 text-purple-400 hover:bg-purple-600/50 disabled:opacity-50 disabled:cursor-not-allowed"}`}
                    >
                      {isAffordable ? "Purchase" : <span className="text-xs text-gray-500">Insufficient NIM</span>}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
          {isConnected || <p className="text-sm text-gray-500 mt-8">Connect your Nimiq wallet to buy taps.</p>}
        </div>
      )}

<div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
        <h2 className="text-xl font-bold mb-4">Statistics</h2>
        <div className="grid grid-cols-2 gap-4">
          <div><p className="text-sm text-gray-400">Total taps</p><p className="text-2xl font-bold">{tapCount}</p></div>
          <div><p className="text-sm text-gray-400">Games played</p><p className="text-2xl font-bold">—</p></div>
          <div><p className="text-sm text-gray-400">Avg taps/game</p><p className="text-2xl font-bold">—</p></div>
          <div><p className="text-sm text-gray-400">Best streak</p><p className="text-2xl font-bold">—</p></div>
        </div>
      </div>

      {/* =====================================================
          LEADERBOARD
      ===================================================== */}
      {user?.id && (
        <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <h2 className="text-xl font-bold mb-4">Leaderboard</h2>
          {loadingLeaderboard ? (
            <div className="flex min-h-[200px] items-center justify-center">
              <Loader2 size={20} className="animate-spin text-purple-500" />
              <p className="mt-2">Loading leaderboard...</p>
            </div>
          ) : errorLeaderboard ? (
            <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-6 text-center">
              <p className="text-red-400">{errorLeaderboard}</p>
              <p className="mt-2 text-sm text-gray-500">Try again later.</p>
            </div>
          ) : leaderboard.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-400">No leaderboard data available</p>
              <p className="mt-2 text-sm text-gray-500">Be the first to play!</p>
            </div>
          ) : (
            <MotionDiv
              variants={staggerContainer}
              className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
            >
              {leaderboard.map((entry, index) => (
                <MotionDiv
                  key={entry.id}
                  variants={fadeUp}
                  className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-4"
                >
                  <span className="w-8 h-8 rounded-full bg-purple-600/10 text-purple-400 flex items-center justify-center text-sm font-bold">
                    {index + 1}
                  </span>
                  <span className="flex-1 truncate text-white">
                    <p className="font-medium">{entry.username}</p>
                    <p className="text-xs text-gray-400">#{entry.tap_count} taps</p>
                  </span>
                </MotionDiv>
              ))}
            </MotionDiv>
          )}
        </div>
      )}

    </div>
  );
}

export default Game;