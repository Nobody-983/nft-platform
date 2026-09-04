import { useEffect, useState } from "react";
import { ArrowLeft, Loader2, ShoppingBag } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";

import {
  MotionDiv,
  MotionButton,
  fadeUp,
} from "../components/motion";

import { supabase } from "../lib/supabase";

function NFTDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [nft, setNft] = useState(null);
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNFT = async () => {
      try {
        setLoading(true);

        const { data, error } = await supabase
          .from("nfts")
          .select(`
            *,
            profiles:creator_id (
              id,
              username,
              display_name,
              avatar_url
            ),
            marketplace_listings (
              id,
              price,
              currency,
              status,
              seller_id
            )
          `)
          .eq("id", id)
          .single();

        if (error) throw error;

        setNft(data);

        const activeListing = data.marketplace_listings?.find(
          (item) => item.status === "active"
        );

        setListing(activeListing || null);
      } catch (error) {
        console.error("Error loading NFT:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchNFT();
  }, [id]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0b0b12] text-white">
        <Loader2
          size={30}
          className="animate-spin text-purple-500"
        />
      </div>
    );
  }

  if (!nft) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#0b0b12] px-6 text-white">
        <h1 className="text-2xl font-bold">
          NFT not found
        </h1>

        <MotionButton
          onClick={() => navigate("/marketplace")}
          className="mt-5 rounded-xl bg-purple-600 px-5 py-3 text-sm font-semibold hover:bg-purple-700"
        >
          Back to Marketplace
        </MotionButton>
      </div>
    );
  }

  const creator =
    nft.profiles?.display_name ||
    nft.profiles?.username ||
    "Unknown creator";

  return (
    <div className="min-h-screen bg-[#0b0b12] px-4 py-6 text-white sm:px-6">

      {/* BACK BUTTON */}

      <MotionButton
        onClick={() => navigate("/marketplace")}
        className="mb-8 flex items-center gap-2 text-sm text-gray-400 transition hover:text-white"
      >
        <ArrowLeft size={18} />
        Back to Marketplace
      </MotionButton>

      {/* NFT DETAILS */}

      <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-2">

        {/* IMAGE */}

        <MotionDiv
          variants={fadeUp}
          className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]"
        >
          <img
            src={nft.image_url}
            alt={nft.name}
            className="aspect-square h-full w-full object-cover"
          />
        </MotionDiv>

        {/* INFORMATION */}

        <MotionDiv
          variants={fadeUp}
          className="flex flex-col justify-center"
        >
          <div className="mb-4 inline-flex w-fit rounded-lg bg-purple-600/10 px-3 py-1.5 text-xs font-medium text-purple-400">
            {nft.category}
          </div>

          <h1 className="text-4xl font-bold tracking-tight">
            {nft.name}
          </h1>

          <p className="mt-3 text-gray-400">
            Created by{" "}
            <span className="text-white">
              {creator}
            </span>
          </p>

          {/* DESCRIPTION */}

          <div className="mt-8">
            <h2 className="mb-2 text-sm font-semibold text-gray-300">
              Description
            </h2>

            <p className="leading-7 text-gray-500">
              {nft.description ||
                "No description provided."}
            </p>
          </div>

          {/* PRICE */}

          <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <p className="text-sm text-gray-500">
              Current price
            </p>

            <p className="mt-2 text-2xl font-bold">
              {listing
                ? `${listing.price} ${listing.currency}`
                : `${nft.price} ${nft.currency}`}
            </p>
          </div>

          {/* BUY */}

          {listing ? (
            <MotionButton
              onClick={() =>
                alert("Buying will be connected next.")
              }
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-purple-600 px-5 py-4 font-semibold transition hover:bg-purple-700"
            >
              <ShoppingBag size={19} />
              Buy NFT
            </MotionButton>
          ) : (
            <div className="mt-6 rounded-xl border border-white/10 bg-white/[0.03] px-5 py-4 text-center text-sm text-gray-500">
              This NFT is not currently listed for sale.
            </div>
          )}
        </MotionDiv>
      </div>
    </div>
  );
}

export default NFTDetails;