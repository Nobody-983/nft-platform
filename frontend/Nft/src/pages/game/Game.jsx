import { useState } from "react";
import { Sun, Zap, Loader2 } from "lucide-react";

const MILESTONE_LEVELS = [
  {
    level: 1,
    tapsRequired: 500,
    reward: "Bronze NFT",
  },
  {
    level: 2,
    tapsRequired: 2000,
    reward: "Silver NFT",
  },
  {
    level: 3,
    tapsRequired: 5000,
    reward: "Gold NFT",
  },
];

function Game() {
  const [tapCount, setTapCount] = useState(1200);
  const [claimedRewards, setClaimedRewards] = useState([1]);
  const [isTapping, setIsTapping] = useState(false);
  const [claimingLevel, setClaimingLevel] = useState(null);

  const leaderboard = [
    {
      id: 1,
      username: "Nimiq Player",
      tap_count: 8500,
    },
    {
      id: 2,
      username: "Crypto Tapper",
      tap_count: 6200,
    },
    {
      id: 3,
      username: "Nimiq Hero",
      tap_count: 4100,
    },
  ];

  const handleTap = () => {
    if (isTapping) {
      return;
    }

    setIsTapping(true);

    setTimeout(() => {
      setTapCount((previous) => previous + 1);
      setIsTapping(false);
    }, 100);
  };

  const hasClaimedReward = (level) => {
    return claimedRewards.includes(level);
  };

  const claimReward = (milestone) => {
    if (tapCount < milestone.tapsRequired) {
      return;
    }

    if (hasClaimedReward(milestone.level)) {
      return;
    }

    setClaimingLevel(milestone.level);

    setTimeout(() => {
      setClaimedRewards((previous) => [
        ...previous,
        milestone.level,
      ]);

      setClaimingLevel(null);
    }, 500);
  };

  const getProgress = (milestone) => {
    if (tapCount >= milestone.tapsRequired) {
      return 100;
    }

    return Math.min(
      (tapCount / milestone.tapsRequired) * 100,
      100
    );
  };

  const getRemainingTaps = (milestone) => {
    return Math.max(
      milestone.tapsRequired - tapCount,
      0
    );
  };

  return (
    <div className="space-y-8 pb-10">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-yellow-400/10">
            <Sun className="h-6 w-6 text-yellow-400" />
          </div>

          <div>
            <h1 className="text-2xl font-bold">
              Nimiq Tap Game
            </h1>

            <p className="text-sm text-gray-500">
              Tap the coin, reach milestones, and earn NFTs.
            </p>
          </div>
        </div>
      </div>

      {/* Tap Game */}
      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="text-center">
          <p className="text-sm text-gray-500">
            Your taps
          </p>

          <h2 className="mt-2 text-4xl font-bold">
            {tapCount.toLocaleString()}
          </h2>

          <p className="mt-2 text-sm text-gray-500">
            Keep tapping to unlock NFT rewards.
          </p>

          <button
            type="button"
            onClick={handleTap}
            disabled={isTapping}
            className="mx-auto mt-8 flex h-36 w-36 items-center justify-center rounded-full border-8 border-yellow-400/30 bg-yellow-400/10 shadow-lg transition-transform duration-100 active:scale-90 disabled:opacity-70"
          >
            {isTapping ? (
              <Loader2 className="h-12 w-12 animate-spin text-yellow-400" />
            ) : (
              <Sun className="h-16 w-16 text-yellow-400" />
            )}
          </button>

          <p className="mt-5 text-sm text-gray-500">
            Tap the Nimiq coin
          </p>
        </div>
      </section>

      {/* NFT Milestones */}
      <section>
        <div className="mb-4">
          <h2 className="text-xl font-semibold">
            NFT Milestones
          </h2>

          <p className="text-sm text-gray-500">
            Reach the required number of taps to unlock each NFT.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {MILESTONE_LEVELS.map((milestone) => {
            const claimed = hasClaimedReward(
              milestone.level
            );

            const unlocked =
              tapCount >= milestone.tapsRequired;

            const progress = getProgress(milestone);

            const remaining =
              getRemainingTaps(milestone);

            return (
              <div
                key={milestone.level}
                className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">
                    Level {milestone.level}
                  </span>

                  {claimed && (
                    <span className="rounded-full bg-green-500/10 px-3 py-1 text-xs font-medium text-green-500">
                      Claimed
                    </span>
                  )}

                  {!claimed && unlocked && (
                    <span className="rounded-full bg-yellow-400/10 px-3 py-1 text-xs font-medium text-yellow-500">
                      Unlocked
                    </span>
                  )}
                </div>

                <h3 className="mt-4 text-lg font-semibold">
                  {milestone.reward}
                </h3>

                <p className="mt-1 text-sm text-gray-500">
                  {milestone.tapsRequired.toLocaleString()} taps
                </p>

                {/* Progress */}
                <div className="mt-5">
                  <div className="mb-2 flex justify-between text-xs text-gray-500">
                    <span>
                      {tapCount.toLocaleString()} taps
                    </span>

                    <span>
                      {milestone.tapsRequired.toLocaleString()}
                    </span>
                  </div>

                  <div className="h-2 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-800">
                    <div
                      className="h-full rounded-full bg-yellow-400 transition-all duration-300"
                      style={{
                        width: `${progress}%`,
                      }}
                    />
                  </div>
                </div>

                {/* Claim */}
                {!claimed && unlocked && (
                  <button
                    type="button"
                    onClick={() =>
                      claimReward(milestone)
                    }
                    disabled={
                      claimingLevel === milestone.level
                    }
                    className="mt-5 w-full rounded-xl bg-yellow-400 px-4 py-3 text-sm font-semibold text-black transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {claimingLevel === milestone.level ? (
                      <span className="flex items-center justify-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Claiming...
                      </span>
                    ) : (
                      "Claim NFT"
                    )}
                  </button>
                )}

                {/* Locked */}
                {!claimed && !unlocked && (
                  <p className="mt-5 text-center text-xs text-gray-500">
                    {remaining.toLocaleString()} more taps
                    to unlock
                  </p>
                )}

                {/* Claimed */}
                {claimed && (
                  <p className="mt-5 text-center text-xs text-green-500">
                    Reward already claimed.
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Leaderboard */}
      <section>
        <div className="mb-4">
          <h2 className="text-xl font-semibold">
            Leaderboard
          </h2>

          <p className="text-sm text-gray-500">
            Top players by total taps.
          </p>
        </div>

        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
          <div className="divide-y divide-gray-200 dark:divide-gray-800">
            {leaderboard.map((player, index) => (
              <div
                key={player.id}
                className="flex items-center justify-between px-5 py-4"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-sm font-semibold dark:bg-gray-800">
                    {index + 1}
                  </div>

                  <p className="font-medium">
                    {player.username}
                  </p>
                </div>

                <div className="flex items-center gap-2 text-sm font-semibold">
                  <Zap className="h-4 w-4 text-yellow-400" />

                  {player.tap_count.toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

export default Game;
