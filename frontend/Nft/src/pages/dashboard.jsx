import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiHeart,
  FiTrendingUp,
  FiChevronLeft,
  FiChevronRight,
} from "react-icons/fi";

import { useWallet } from "../context/walletContext";
import { supabase } from "../lib/supabase";

// =====================================================
// DASHBOARD
// =====================================================

function Dashboard() {
  const navigate = useNavigate();

  const { user, profile } = useWallet();

  const [currentSlide, setCurrentSlide] = useState(0);
  const [trendingNFTs, setTrendingNFTs] = useState([]);
  const [loadingTrending, setLoadingTrending] = useState(true);
  const [userLikes, setUserLikes] = useState(new Set());
  const [likingNFT, setLikingNFT] = useState(null);
  const [userProfile, setUserProfile] = useState(profile || null);

  // =====================================================
  // USER INFORMATION
  // =====================================================

  const userName =
    userProfile?.username ||
    userProfile?.display_name ||
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    "Nimiq User";

  const userAvatar =
    userProfile?.avatar_url ||
    user?.user_metadata?.avatar_url ||
    user?.user_metadata?.picture ||
    null;

  // =====================================================
  // FETCH TRENDING NFTS
  // =====================================================

  const fetchTrendingNFTs = async () => {
    try {
      setLoadingTrending(true);

      // -------------------------------------------------
      // FETCH NFTS + REAL CREATOR PROFILE
      // -------------------------------------------------

      const {
        data: nfts,
        error: nftError,
      } = await supabase
        .from("nfts")
        .select(`
          id,
          name,
          description,
          image_url,
          category,
          price,
          currency,
          creator_id,
          created_at,
          profiles:creator_id (
            id,
            username,
            display_name,
            avatar_url
          )
        `);

      if (nftError) {
        throw nftError;
      }

      // -------------------------------------------------
      // FETCH LIKES
      // -------------------------------------------------

      const {
        data: likes,
        error: likesError,
      } = await supabase
        .from("nft_likes")
        .select("nft_id, user_id");

      if (likesError) {
        throw likesError;
      }

      // -------------------------------------------------
      // COUNT LIKES
      // -------------------------------------------------

      const likeCounts = {};

      (likes || []).forEach((like) => {
        if (!likeCounts[like.nft_id]) {
          likeCounts[like.nft_id] = 0;
        }

        likeCounts[like.nft_id] += 1;
      });

      // -------------------------------------------------
      // FIND CURRENT USER LIKES
      // -------------------------------------------------

      const currentUserLikes = new Set(
        (likes || [])
          .filter(
            (like) => like.user_id === user?.id
          )
          .map((like) => like.nft_id)
      );

      setUserLikes(currentUserLikes);

      // -------------------------------------------------
      // FORMAT REAL NFT DATA
      // -------------------------------------------------

      const formattedNFTs = (nfts || []).map((nft) => {
        const creator = Array.isArray(nft.profiles)
          ? nft.profiles[0]
          : nft.profiles;

        const creatorName =
          creator?.display_name ||
          creator?.username ||
          "Creator";

        return {
          ...nft,

          image: nft.image_url || "",

          name: nft.name || "Unnamed NFT",

          creator: creatorName,

          price: nft.price ?? 0,

          likes: likeCounts[nft.id] || 0,
        };
      });

      // -------------------------------------------------
      // SORT BY REAL LIKE COUNT
      // -------------------------------------------------

      formattedNFTs.sort((a, b) => {
        if (b.likes !== a.likes) {
          return b.likes - a.likes;
        }

        return (
          new Date(b.created_at || 0) -
          new Date(a.created_at || 0)
        );
      });

      // -------------------------------------------------
      // TOP 6
      // -------------------------------------------------

      const rankedNFTs = formattedNFTs
        .slice(0, 6)
        .map((nft, index) => ({
          ...nft,
          rank: index + 1,
        }));

      setTrendingNFTs(rankedNFTs);
    } catch (error) {
      console.error(
        "Trending NFT error:",
        error
      );

      setTrendingNFTs([]);
      setUserLikes(new Set());
    } finally {
      setLoadingTrending(false);
    }
  };

  // =====================================================
  // INITIAL LOAD
  // =====================================================

  useEffect(() => {
    fetchTrendingNFTs();
  }, [user?.id]);

  // =====================================================
  // FETCH USER PROFILE
  // =====================================================

  useEffect(() => {
    if (!user?.id) {
      setUserProfile(null);
      return;
    }

    const fetchProfile = async () => {
      const {
        data,
        error,
      } = await supabase
        .from("profiles")
        .select(
          "username, display_name, avatar_url, bio"
        )
        .eq("id", user.id)
        .maybeSingle();

      if (error) {
        console.error(
          "Profile fetch error:",
          error
        );
        return;
      }

      setUserProfile(data);
    };

    fetchProfile();
  }, [user?.id]);

  // =====================================================
  // HERO SLIDER
  // =====================================================

  useEffect(() => {
    if (trendingNFTs.length <= 1) {
      return;
    }

    const slider = setInterval(() => {
      setCurrentSlide((previous) =>
        previous === trendingNFTs.length - 1
          ? 0
          : previous + 1
      );
    }, 5000);

    return () => clearInterval(slider);
  }, [trendingNFTs.length]);

  const nextSlide = () => {
    if (trendingNFTs.length === 0) {
      return;
    }

    setCurrentSlide((previous) =>
      previous === trendingNFTs.length - 1
        ? 0
        : previous + 1
    );
  };

  const previousSlide = () => {
    if (trendingNFTs.length === 0) {
      return;
    }

    setCurrentSlide((previous) =>
      previous === 0
        ? trendingNFTs.length - 1
        : previous - 1
    );
  };

  // =====================================================
  // LIKE / UNLIKE
  // =====================================================

  const handleLike = async (nftId) => {
    if (!user?.id) {
      navigate("/login");
      return;
    }

    if (likingNFT === nftId) {
      return;
    }

    const alreadyLiked = userLikes.has(nftId);

    try {
      setLikingNFT(nftId);

      // -------------------------------------------------
      // UNLIKE
      // -------------------------------------------------

      if (alreadyLiked) {
        const { error } = await supabase
          .from("nft_likes")
          .delete()
          .eq("nft_id", nftId)
          .eq("user_id", user.id);

        if (error) {
          throw error;
        }
      }

      // -------------------------------------------------
      // LIKE
      // -------------------------------------------------

      else {
        const { error } = await supabase
          .from("nft_likes")
          .insert({
            nft_id: nftId,
            user_id: user.id,
          });

        if (error && error.code !== "23505") {
          throw error;
        }
      }

      // -------------------------------------------------
      // REFRESH REAL DATA
      // -------------------------------------------------

      await fetchTrendingNFTs();
    } catch (error) {
      console.error(
        "Like error:",
        error
      );
    } finally {
      setLikingNFT(null);
    }
  };

  // =====================================================
  // CURRENT HERO NFT
  // =====================================================

  const heroNFT =
    trendingNFTs[currentSlide] || null;

  return (
    <div className="min-h-screen bg-[#08080f] text-white">
      <main className="p-5 lg:p-7">

        {/* =====================================================
            USER WELCOME
        ===================================================== */}

        <section className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">
              Welcome back 👋
            </p>

            <h2 className="mt-1 text-2xl font-bold sm:text-3xl">
              {userName}
            </h2>
          </div>

          <div className="hidden sm:block">
            {userAvatar ? (
              <img
                src={userAvatar}
                alt={userName}
                className="h-12 w-12 rounded-full border border-white/10 object-cover"
              />
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-pink-500 font-bold">
                {userName
                  .charAt(0)
                  .toUpperCase()}
              </div>
            )}
          </div>
        </section>

        {/* =====================================================
            HERO
        ===================================================== */}

        {heroNFT ? (
          <section className="relative min-h-[420px] overflow-hidden rounded-2xl border border-white/5 bg-gradient-to-br from-[#250047] via-[#17002e] to-[#090914]">

            <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-purple-600/20 blur-3xl" />

            <div className="pointer-events-none absolute -bottom-20 right-40 h-64 w-64 rounded-full bg-pink-600/10 blur-3xl" />

            <div className="relative z-10 flex min-h-[420px] items-center p-7 lg:p-10">

              <div className="max-w-xl">
                <p className="mb-3 text-sm font-medium tracking-wide text-purple-400">
                  {heroNFT.category || "DIGITAL COLLECTIBLE"}
                </p>

                <h1 className="text-3xl font-bold leading-tight sm:text-4xl lg:text-5xl">
                  Discover{" "}
                  <span className="bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
                    {heroNFT.name}
                  </span>
                </h1>

                <p className="mt-5 max-w-lg text-sm leading-6 text-gray-400 sm:text-base">
                  {heroNFT.description ||
                    "Discover unique digital collectibles created by the Nimiq community."}
                </p>

                <div className="mt-7 flex flex-wrap gap-3">

                  <button
                    onClick={() =>
                      navigate(
                        `/nft/${heroNFT.id}`
                      )
                    }
                    className="rounded-lg bg-gradient-to-r from-purple-600 to-fuchsia-500 px-6 py-3 text-sm font-semibold shadow-lg shadow-purple-900/20 transition-all duration-200 hover:-translate-y-0.5 hover:brightness-110"
                  >
                    View NFT
                  </button>

                  <button
                    onClick={() =>
                      navigate(
                        "/marketplace"
                      )
                    }
                    className="rounded-lg border border-white/10 bg-white/5 px-6 py-3 text-sm font-semibold transition-all duration-200 hover:-translate-y-0.5 hover:bg-white/10"
                  >
                    Explore Market
                  </button>

                </div>
              </div>

              <div className="absolute right-8 top-1/2 hidden h-72 w-72 -translate-y-1/2 md:block lg:right-16 lg:h-80 lg:w-80">

                <div className="absolute inset-4 rounded-3xl bg-purple-600/30 blur-3xl" />

                <div className="relative h-full w-full overflow-hidden rounded-3xl border border-purple-400/30 bg-[#111119] shadow-2xl shadow-purple-900/40">

                  <img
                    src={heroNFT.image}
                    alt={heroNFT.name}
                    className="h-full w-full object-cover"
                  />

                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

                  <div className="absolute bottom-4 left-4">
                    <p className="text-xs text-gray-300">
                      {heroNFT.creator}
                    </p>

                    <p className="mt-1 text-sm font-semibold">
                      {heroNFT.name}
                    </p>
                  </div>

                </div>
              </div>
            </div>

            {trendingNFTs.length > 1 && (
              <>
                <button
                  onClick={previousSlide}
                  className="absolute left-4 top-1/2 z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-black/30 text-white backdrop-blur transition-all duration-200 hover:scale-105 hover:bg-black/60"
                  aria-label="Previous NFT"
                >
                  <FiChevronLeft size={18} />
                </button>

                <button
                  onClick={nextSlide}
                  className="absolute right-4 top-1/2 z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-black/30 text-white backdrop-blur transition-all duration-200 hover:scale-105 hover:bg-black/60"
                  aria-label="Next NFT"
                >
                  <FiChevronRight size={18} />
                </button>

                <div className="absolute bottom-5 left-1/2 z-20 flex -translate-x-1/2 gap-2">
                  {trendingNFTs.map((nft, index) => (
                    <button
                      key={nft.id}
                      onClick={() =>
                        setCurrentSlide(index)
                      }
                      className={`h-2 rounded-full transition-all duration-300 ${
                        currentSlide === index
                          ? "w-6 bg-purple-400"
                          : "w-2 bg-white/30 hover:bg-white/50"
                      }`}
                      aria-label={`View ${nft.name}`}
                    />
                  ))}
                </div>
              </>
            )}
          </section>
        ) : (
          <section className="flex min-h-[420px] items-center justify-center rounded-2xl border border-white/5 bg-[#101017]">
            {loadingTrending ? (
              <p className="text-sm text-gray-500">
                Loading your marketplace...
              </p>
            ) : (
              <div className="text-center">
                <p className="text-lg font-semibold">
                  No NFTs yet
                </p>

                <p className="mt-2 text-sm text-gray-500">
                  Create the first NFT on the marketplace.
                </p>

                <button
                  onClick={() =>
                    navigate("/create-nft")
                  }
                  className="mt-5 rounded-lg bg-purple-600 px-5 py-2.5 text-sm font-semibold transition hover:bg-purple-500"
                >
                  Create NFT
                </button>
              </div>
            )}
          </section>
        )}

        {/* =====================================================
            TRENDING
        ===================================================== */}

        <section className="mt-8">

          <div className="mb-4 flex items-center justify-between">

            <div className="flex items-center gap-2">
              <span className="text-xl">
                🔥
              </span>

              <h2 className="text-xl font-semibold">
                Trending Now
              </h2>
            </div>

            <button
              onClick={() =>
                navigate("/marketplace")
              }
              className="text-sm font-medium text-purple-400 transition-colors hover:text-purple-300"
            >
              View all
            </button>

          </div>

          {loadingTrending && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map(
                (item) => (
                  <div
                    key={item}
                    className="aspect-square animate-pulse rounded-xl border border-white/5 bg-[#101017]"
                  />
                )
              )}
            </div>
          )}

          {!loadingTrending &&
            trendingNFTs.length === 0 && (
              <div className="rounded-xl border border-white/5 bg-[#101017] p-10 text-center">
                <p className="text-gray-400">
                  No NFTs available yet.
                </p>

                <p className="mt-2 text-sm text-gray-600">
                  Create an NFT to get the marketplace started.
                </p>
              </div>
            )}

          {!loadingTrending &&
            trendingNFTs.length > 0 && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {trendingNFTs.map((nft) => (
                  <NFTCard
                    key={nft.id}
                    nft={nft}
                    liked={userLikes.has(nft.id)}
                    liking={
                      likingNFT === nft.id
                    }
                    onLike={() =>
                      handleLike(nft.id)
                    }
                    onOpen={() =>
                      navigate(
                        `/nft/${nft.id}`
                      )
                    }
                  />
                ))}
              </div>
            )}

        </section>

        {/* =====================================================
            LOWER DASHBOARD
        ===================================================== */}

        <section className="mt-8">
          <MarketOverview />
        </section>

      </main>
    </div>
  );
}

// =====================================================
// NFT CARD
// =====================================================

function NFTCard({
  nft,
  liked,
  liking,
  onLike,
  onOpen,
}) {
  return (
    <article className="group overflow-hidden rounded-xl border border-white/5 bg-[#101017] transition-all duration-200 hover:-translate-y-1.5 hover:shadow-lg hover:shadow-purple-900/10">

      <div
        onClick={onOpen}
        className="relative aspect-square cursor-pointer overflow-hidden"
      >

        <img
          src={nft.image}
          alt={nft.name}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />

        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

        <div className="absolute left-2 top-2 flex h-7 w-7 items-center justify-center rounded-md bg-black/60 text-xs font-bold backdrop-blur">
          #{nft.rank}
        </div>

        <button
          onClick={(event) => {
            event.stopPropagation();
            onLike();
          }}
          disabled={liking}
          className={`absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full backdrop-blur transition-all duration-200 hover:scale-110 ${
            liked
              ? "bg-purple-600 text-white"
              : "bg-black/50 text-white hover:bg-black/80"
          } ${
            liking
              ? "cursor-wait opacity-70"
              : ""
          }`}
          aria-label={
            liked
              ? "Unlike NFT"
              : "Like NFT"
          }
        >
          <FiHeart
            size={15}
            className={
              liked
                ? "fill-current"
                : ""
            }
          />
        </button>

        <div className="absolute bottom-2 right-2 flex items-center gap-1 rounded-full bg-black/60 px-2 py-1 text-xs backdrop-blur">
          <FiHeart
            size={12}
            className={
              liked
                ? "fill-current text-purple-400"
                : ""
            }
          />

          <span>
            {nft.likes}
          </span>
        </div>

      </div>

      <div className="p-3">

        <h3
          onClick={onOpen}
          className="cursor-pointer truncate text-sm font-semibold transition-colors hover:text-purple-400"
        >
          {nft.name}
        </h3>

        <p className="mt-1 truncate text-xs text-gray-500">
          by {nft.creator}
        </p>

        <div className="mt-4 flex items-end justify-between">

          <div>
            <p className="text-xs text-gray-500">
              Price
            </p>

            <p className="mt-1 font-semibold">
              {nft.price} {nft.currency || "NIM"}
            </p>
          </div>

          <span className="flex items-center gap-1 text-xs font-medium text-purple-400">
            <FiTrendingUp size={13} />
            #{nft.rank}
          </span>

        </div>

      </div>

    </article>
  );
}

// =====================================================
// MARKET OVERVIEW
// =====================================================

function MarketOverview() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        setLoading(true);

        const {
          count: activeListings,
          error: listingsError,
        } = await supabase
          .from("marketplace_listings")
          .select("*", {
            count: "exact",
            head: true,
          })
          .eq("status", "active");

        if (listingsError) {
          throw listingsError;
        }

        const {
          count: totalNFTs,
          error: nftsError,
        } = await supabase
          .from("nfts")
          .select("*", {
            count: "exact",
            head: true,
          });

        if (nftsError) {
          throw nftsError;
        }

        setStats({
          activeListings:
            activeListings || 0,

          totalNFTs:
            totalNFTs || 0,
        });
      } catch (error) {
        console.error(
          "Market stats error:",
          error
        );

        setStats(null);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="rounded-xl border border-white/5 bg-[#101017] p-5">
        <div className="grid grid-cols-2 gap-4">

          {[1, 2].map((item) => (
            <div
              key={item}
              className="animate-pulse rounded-xl border border-white/5 bg-white/5 p-4"
            >
              <div className="h-3 w-24 rounded bg-white/10" />
              <div className="mt-3 h-5 w-12 rounded bg-white/10" />
            </div>
          ))}

        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="rounded-xl border border-white/5 bg-[#101017] p-5">
        <p className="text-sm text-gray-500">
          Market statistics are currently unavailable.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-white/5 bg-[#101017] p-5 transition-transform duration-200 hover:-translate-y-1">

      <div className="flex items-center gap-2">
        <FiTrendingUp className="text-purple-400" />

        <h2 className="font-semibold">
          Market Overview
        </h2>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-4">

        <Stat
          label="NFTs Created"
          value={stats.totalNFTs.toLocaleString()}
        />

        <Stat
          label="Active Listings"
          value={stats.activeListings.toLocaleString()}
        />

      </div>

    </div>
  );
}

// =====================================================
// STAT
// =====================================================

function Stat({ label, value }) {
  return (
    <div>
      <p className="text-xs text-gray-500">
        {label}
      </p>

      <p className="mt-1 text-sm font-semibold">
        {value}
      </p>
    </div>
  );
}

export default Dashboard;