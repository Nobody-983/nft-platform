function Game() {
  return (
    <div className="min-h-screen bg-[#08080f] text-white p-8">
      <h1 className="text-3xl font-bold mb-6">Game Center</h1>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {/* NFT Games */}
        <div className="bg-[#101017] rounded-xl border border-white/5 p-6">
          <h2 className="text-xl font-bold mb-4">NFT Games</h2>
          <p className="text-gray-400">
            Collect and play NFT-based games on the Nimiq network.
          </p>
        </div>

        {/* Rewards */}
        <div className="bg-[#101017] rounded-xl border border-white/5 p-6">
          <h2 className="text-xl font-bold mb-4">Rewards</h2>
          <p className="text-gray-400">
            Earn points and rewards through marketplace activity.
          </p>
        </div>

        {/* Leaderboard */}
        <div className="bg-[#101017] rounded-xl border border-white/5 p-6">
          <h2 className="text-xl font-bold mb-4">Leaderboard</h2>
          <p className="text-gray-400">
            View top collectors and traders.
          </p>
        </div>
      </div>
    </div>
  );
}

export default Game;