import { useEffect, useState } from "react";
import { Heart, Search, Plus, ArrowUpRight, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

import {
  MotionDiv,
  MotionButton,
  fadeUp,
  fadeIn,
  staggerContainer,
} from "../components/motion";

import { getMarketplaceListings } from "../services/marketService";
import { supabase } from "../lib/supabase";

const categories = [
  "All",
  "Art",
  "Music",
  "Collectible",
  "Gaming",
];

function Marketplace() {
  const navigate = useNavigate();

  const [items, setItems] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  const [likedNFTs, setLikedNFTs] = useState(new Set());
  const [likeCounts, setLikeCounts] = useState({});
  const [likingNFT, setLikingNFT] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // =====================================================
  // LOAD LIKES
  // =====================================================

  const loadLikes = async () => {
    try {
      const { data: likes, error: likesError } = await supabase
        .from("nft_likes")
        .select("nft_id, user_id");

      if (likesError) {
        console.error("LOAD LIKES ERROR:", likesError);
        return;
      }

      const counts = {};
      const userLiked = new Set();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      likes?.forEach((like) => {
        const id = String(like.nft_id);

        counts[id] = (counts[id] || 0) + 1;

        if (user && like.user_id === user.id) {
          userLiked.add(id);
        }
      });

      setLikeCounts(counts);
      setLikedNFTs(userLiked);
    } catch (err) {
      console.error("LOAD LIKES ERROR:", err);
    }
  };

  // =====================================================
  // LOAD MARKETPLACE
  // =====================================================

  useEffect(() => {
    const fetchMarketplace = async () => {
      try {
        setLoading(true);
        setError("");

        const data = await getMarketplaceListings();

        setItems(data || []);

        await loadLikes();
      } catch (err) {
        console.error("MARKETPLACE ERROR:", err);
        setError("Unable to load marketplace.");
      } finally {
        setLoading(false);
      }
    };

    fetchMarketplace();
  }, []);

  // =====================================================
  // LIKE / UNLIKE
  // =====================================================

  const toggleLike = async (nftId) => {
    const id = String(nftId);

    if (likingNFT === id) return;

    try {
      setLikingNFT(id);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError("Please connect your Nimiq wallet to like NFTs.");
        return;
      }

      const currentlyLiked = likedNFTs.has(id);

      // =================================================
      // OPTIMISTIC UI
      // Change the heart immediately
      // =================================================

      if (currentlyLiked) {
        setLikedNFTs((previous) => {
          const updated = new Set(previous);
          updated.delete(id);
          return updated;
        });

        setLikeCounts((previous) => ({
          ...previous,
          [id]: Math.max(0, (previous[id] || 0) - 1),
        }));

        const { error: deleteError } = await supabase
          .from("nft_likes")
          .delete()
          .eq("nft_id", nftId)
          .eq("user_id", user.id);

        if (deleteError) {
          console.error("UNLIKE ERROR:", deleteError);

          // Roll UI back if database failed
          setLikedNFTs((previous) => {
            const updated = new Set(previous);
            updated.add(id);
            return updated;
          });

          setLikeCounts((previous) => ({
            ...previous,
            [id]: (previous[id] || 0) + 1,
          }));

          return;
        }

        return;
      }

      // =================================================
      // LIKE
      // =================================================

      setLikedNFTs((previous) => {
        const updated = new Set(previous);
        updated.add(id);
        return updated;
      });

      setLikeCounts((previous) => ({
        ...previous,
        [id]: (previous[id] || 0) + 1,
      }));

      const { error: insertError } = await supabase
        .from("nft_likes")
        .insert({
          nft_id: nftId,
          user_id: user.id,
        });

      if (insertError) {
        console.error("LIKE INSERT ERROR:", insertError);

        // Roll UI back
        setLikedNFTs((previous) => {
          const updated = new Set(previous);
          updated.delete(id);
          return updated;
        });

        setLikeCounts((previous) => ({
          ...previous,
          [id]: Math.max(0, (previous[id] || 0) - 1),
        }));

        return;
      }
    } catch (err) {
      console.error("TOGGLE LIKE ERROR:", err);
    } finally {
      setLikingNFT(null);
    }
  };

  // =====================================================
  // FILTER
  // =====================================================

  const filteredItems = items.filter((item) => {
    const nft = item.nfts;
    const seller = item.profiles;

    if (!nft) return false;

    const searchValue = search.toLowerCase();

    const title = nft.name?.toLowerCase() || "";

    const creator =
      seller?.display_name?.toLowerCase() ||
      seller?.username?.toLowerCase() ||
      "";

    const matchesSearch =
      title.includes(searchValue) ||
      creator.includes(searchValue);

    const matchesCategory =
      selectedCategory === "All" ||
      nft.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-[#0b0b12] px-4 py-6 text-white sm:px-6">

      {/* HEADER */}

      <MotionDiv
        variants={fadeUp}
        className="mb-8 flex flex-col gap-5 md:flex-row md:items-center md:justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Marketplace
          </h1>

          <p className="mt-3 text-sm text-gray-400">
            Discover, collect and trade unique digital assets.
          </p>
        </div>

        <MotionButton
          onClick={() => navigate("/create-nft")}
          className="flex w-fit items-center gap-2 rounded-xl bg-purple-600 px-5 py-3 text-sm font-semibold transition hover:bg-purple-700"
        >
          <Plus size={18} />
          Create NFT
        </MotionButton>
      </MotionDiv>

      {/* SEARCH + CATEGORIES */}

      <MotionDiv
        variants={fadeUp}
        className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"
      >
        <div className="relative w-full lg:max-w-md">
          <Search
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"
          />

          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search NFTs, creators..."
            className="w-full rounded-xl border border-white/10 bg-white/[0.04] py-3 pl-11 pr-5 text-sm text-white outline-none transition placeholder:text-gray-500 focus:border-purple-500"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1">
          {categories.map((category) => (
            <MotionButton
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`whitespace-nowrap rounded-xl px-5 py-2.5 text-sm font-medium transition ${
                selectedCategory === category
                  ? "bg-purple-600 text-white"
                  : "bg-white/[0.04] text-gray-400 hover:bg-white/[0.08] hover:text-white"
              }`}
            >
              {category}
            </MotionButton>
          ))}
        </div>
      </MotionDiv>

      {/* LOADING */}

      {loading && (
        <div className="flex min-h-[300px] items-center justify-center">
          <Loader2
            size={30}
            className="animate-spin text-purple-500"
          />
        </div>
      )}

      {/* ERROR */}

      {!loading && error && (
        <MotionDiv
          variants={fadeIn}
          className="rounded-2xl border border-red-500/20 bg-red-500/10 py-12 text-center"
        >
          <p className="text-lg font-semibold text-red-400">
            {error}
          </p>

          <p className="mt-2 text-sm text-gray-500">
            Please try again later.
          </p>
        </MotionDiv>
      )}

      {/* NFT GRID */}

      {!loading &&
        !error &&
        filteredItems.length > 0 && (
          <MotionDiv
            variants={staggerContainer}
            className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3"
          >
            {filteredItems.map((item) => {
              const nft = item.nfts;
              const seller = item.profiles;

              const creator =
                seller?.display_name ||
                seller?.username ||
                "Unknown creator";

              const nftId = nft.id;
              const id = String(nftId);

              const isLiked = likedNFTs.has(id);
              const totalLikes = likeCounts[id] || 0;

              return (
                <MotionDiv
                  key={item.id}
                  variants={fadeUp}
                  className="group overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] transition-colors duration-300 hover:-translate-y-1 hover:border-purple-500/40"
                >

                  {/* IMAGE */}

                  <div className="relative aspect-[4/3] overflow-hidden">

                    <img
                      src={nft.image_url}
                      alt={nft.name}
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    />

                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

                    {/* CATEGORY */}

                    <div className="absolute left-3 top-3 rounded-lg bg-black/60 px-3 py-1.5 text-xs font-medium backdrop-blur-md">
                      {nft.category}
                    </div>

                    {/* LIKE BUTTON */}

                    <button
                      type="button"
                      onClick={() => toggleLike(nftId)}
                      disabled={likingNFT === id}
                      aria-label={
                        isLiked
                          ? "Unlike NFT"
                          : "Like NFT"
                      }
                      className={`absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full backdrop-blur-md transition-all duration-200 ${
                        isLiked
                          ? "bg-purple-600 text-white scale-105"
                          : "bg-black/60 text-white hover:bg-purple-600 hover:scale-105"
                      }`}
                    >
                      {likingNFT === id ? (
                        <Loader2
                          size={18}
                          className="animate-spin"
                        />
                      ) : (
                        <Heart
                          size={18}
                          strokeWidth={2}
                          fill={
                            isLiked
                              ? "currentColor"
                              : "none"
                          }
                        />
                      )}
                    </button>

                    {/* LIKE COUNT */}

                    <div className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-full bg-black/60 px-2.5 py-1.5 text-xs backdrop-blur-md">
                      <Heart
                        size={13}
                        fill={
                          isLiked
                            ? "currentColor"
                            : "none"
                        }
                        className={
                          isLiked
                            ? "text-purple-400"
                            : "text-white"
                        }
                      />

                      <span>{totalLikes}</span>
                    </div>
                  </div>

                  {/* DETAILS */}

                  <div className="p-5">

                    <div className="mb-4">
                      <h2 className="text-lg font-semibold">
                        {nft.name}
                      </h2>

                      <p className="mt-1 text-sm text-gray-500">
                        by {creator}
                      </p>
                    </div>

                    <div className="flex items-end justify-between">

                      <div>
                        <p className="text-xs text-gray-500">
                          Current price
                        </p>

                        <p className="mt-1 text-base font-semibold">
                          {item.price} {item.currency}
                        </p>
                      </div>

                      <MotionButton
                        onClick={() =>
                          navigate(`/nft/${nft.id}`)
                        }
                        className="flex items-center gap-1.5 rounded-xl border border-purple-500/40 px-4 py-2 text-sm font-medium text-purple-400 transition hover:bg-purple-600 hover:text-white"
                      >
                        View NFT
                        <ArrowUpRight size={15} />
                      </MotionButton>

                    </div>
                  </div>
                </MotionDiv>
              );
            })}
          </MotionDiv>
        )}

      {/* EMPTY */}

      {!loading &&
        !error &&
        filteredItems.length === 0 && (
          <MotionDiv
            variants={fadeIn}
            className="py-16 text-center"
          >
            <p className="text-lg font-semibold">
              No NFTs found
            </p>

            <p className="mt-2 text-sm text-gray-500">
              {items.length === 0
                ? "No NFTs have been listed for sale yet."
                : "Try another search or category."}
            </p>
          </MotionDiv>
        )}
    </div>
  );
}

export default Marketplace;