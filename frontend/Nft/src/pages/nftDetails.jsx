
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Heart, Loader2 } from "lucide-react";

import { supabase } from "../lib/supabase";
import {
  initNimiq,
  fetchNimiqBalance,
  sendNIMTransaction,
} from "../lib/nimiq";

import { useWallet } from "../context/walletContext";

export default function NFTDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const {
    walletAddress,
    isConnected,
    refreshBalance,
  } = useWallet();

  const [nft, setNft] = useState(null);
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [buying, setBuying] = useState(false);
  const [liked, setLiked] = useState(false);
  const [buySuccess, setBuySuccess] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchNFT();
  }, [id]);

  async function fetchNFT() {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from("nfts")
        .select(`
          *,
          profiles:creator_id (
            id,
            username,
            display_name,
            avatar_url,
            wallet_address
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

      if (fetchError) {
        throw fetchError;
      }

      setNft(data);

      const activeListing =
        data.marketplace_listings?.find(
          (item) => item.status === "active"
        ) || null;

      setListing(activeListing);
    } catch (err) {
      console.error("Failed to fetch NFT:", err);
      setError(
        err?.message || "Failed to load NFT."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleBuy() {
    if (buying) return;

    try {
      setBuying(true);
      setError(null);
      setBuySuccess(false);

      if (!isConnected || !walletAddress) {
        throw new Error(
          "Please connect your Nimiq wallet first."
        );
      }

      if (!listing) {
        throw new Error(
          "This NFT is not currently listed for sale."
        );
      }

      if (listing.status !== "active") {
        throw new Error(
          "This NFT is no longer available."
        );
      }

      const nftPrice = Number(listing.price);

      if (!Number.isFinite(nftPrice) || nftPrice <= 0) {
        throw new Error(
          "This NFT has an invalid price."
        );
      }

      if (listing.currency !== "NIM") {
        throw new Error(
          "Only NIM payments are currently supported."
        );
      }

      /*
       * Get the seller's wallet address.
       */
      const {
        data: sellerProfile,
        error: sellerError,
      } = await supabase
        .from("profiles")
        .select("wallet_address")
        .eq("id", listing.seller_id)
        .single();

      if (sellerError) {
        throw sellerError;
      }

      const sellerWallet =
        sellerProfile?.wallet_address;

      if (!sellerWallet) {
        throw new Error(
          "The seller does not have a Nimiq wallet address."
        );
      }

      /*
       * Prevent buying your own NFT.
       */
      if (
        sellerWallet.replace(/\s+/g, "").toUpperCase() ===
        walletAddress.replace(/\s+/g, "").toUpperCase()
      ) {
        throw new Error(
          "You cannot buy your own NFT."
        );
      }

      /*
       * Check buyer balance before opening Nimiq Pay.
       */
      const balance =
        await fetchNimiqBalance(walletAddress);

      if (Number(balance) < nftPrice) {
        throw new Error(
          `Insufficient NIM balance. You need ${nftPrice} NIM.`
        );
      }

      /*
       * Initialize Nimiq Pay.
       */
      const provider = await initNimiq({
        timeout: 10000,
      });

      if (!provider) {
        throw new Error(
          "Nimiq wallet provider is unavailable."
        );
      }

      /*
       * Send the NFT price to the seller.
       *
       * IMPORTANT:
       * sendNIMTransaction() returns the transaction
       * hash directly as a string.
       */
      const txHash = await sendNIMTransaction(
        provider,
        {
          recipient: sellerWallet,
          valueInNim: nftPrice,
        }
      );

      if (!txHash || typeof txHash !== "string") {
        throw new Error(
          "Nimiq transaction was sent, but no transaction hash was returned."
        );
      }

      console.log(
        "Nimiq transaction hash:",
        txHash
      );

      /*
       * Complete the marketplace purchase inside
       * Supabase.
       *
       * The RPC handles:
       * - marking the listing as sold
       * - transferring NFT ownership
       * - creating marketplace_sales
       */
      const {
        data: purchaseResult,
        error: purchaseError,
      } = await supabase.rpc(
        "complete_nft_purchase",
        {
          p_listing_id: listing.id,
          p_transaction_hash: txHash,
        }
      );

      if (purchaseError) {
        throw new Error(
          purchaseError.message ||
            "Failed to complete NFT purchase."
        );
      }

      if (!purchaseResult?.success) {
        throw new Error(
          "NFT purchase could not be completed."
        );
      }

      setBuySuccess(true);
      setListing(null);

      /*
       * Refresh the buyer's wallet balance.
       */
      await refreshBalance(walletAddress);

      /*
       * Reload NFT information so the UI reflects
       * the new ownership/listing state.
       */
      await fetchNFT();
    } catch (err) {
      console.error(
        "NFT purchase error:",
        err
      );

      setError(
        err?.message ||
          "Failed to purchase NFT."
      );
    } finally {
      setBuying(false);
    }
  }

  async function handleLike() {
    if (!walletAddress) return;

    try {
      const { data: existingLike } =
        await supabase
          .from("nft_likes")
          .select("id")
          .eq("nft_id", id)
          .eq("user_id", walletAddress)
          .maybeSingle();

      if (existingLike) {
        await supabase
          .from("nft_likes")
          .delete()
          .eq("id", existingLike.id);

        setLiked(false);
      } else {
        await supabase
          .from("nft_likes")
          .insert({
            nft_id: id,
            user_id: walletAddress,
          });

        setLiked(true);
      }
    } catch (err) {
      console.error(
        "Like error:",
        err
      );
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!nft) {
    return (
      <div className="p-6">
        <p className="text-red-500">
          {error || "NFT not found."}
        </p>
      </div>
    );
  }

  const creatorName =
    nft.profiles?.display_name ||
    nft.profiles?.username ||
    "Unknown creator";

  return (
    <div className="mx-auto max-w-6xl p-6">
      <button
        onClick={() => navigate(-1)}
        className="mb-6 flex items-center gap-2"
      >
        <ArrowLeft size={18} />
        Back
      </button>

      <div className="grid gap-8 md:grid-cols-2">
        <div className="overflow-hidden rounded-2xl">
          <img
            src={nft.image_url}
            alt={nft.name}
            className="h-full max-h-[600px] w-full object-cover"
          />
        </div>

        <div>
          <div className="mb-4 flex items-start justify-between gap-4">
            <div>
              <p className="mb-2 text-sm opacity-60">
                {nft.category || "NFT"}
              </p>

              <h1 className="text-3xl font-bold">
                {nft.name}
              </h1>
            </div>

            <button
              onClick={handleLike}
              className="rounded-full border p-3"
            >
              <Heart
                size={20}
                fill={liked ? "currentColor" : "none"}
              />
            </button>
          </div>

          <p className="mb-6 opacity-70">
            {nft.description ||
              "No description available."}
          </p>

          <div className="mb-6">
            <p className="text-sm opacity-60">
              Creator
            </p>

            <p className="font-medium">
              {creatorName}
            </p>
          </div>

          {listing ? (
            <div className="rounded-2xl border p-6">
              <p className="text-sm opacity-60">
                Current price
              </p>

              <p className="mb-6 text-3xl font-bold">
                {Number(listing.price)}{" "}
                {listing.currency}
              </p>

              <button
                onClick={handleBuy}
                disabled={buying}
                className="flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3 font-semibold disabled:cursor-not-allowed disabled:opacity-50"
              >
                {buying ? (
                  <>
                    <Loader2
                      size={18}
                      className="animate-spin"
                    />
                    Processing...
                  </>
                ) : (
                  `Buy for ${Number(
                    listing.price
                  )} NIM`
                )}
              </button>
            </div>
          ) : (
            <div className="rounded-2xl border p-6">
              <p className="opacity-60">
                This NFT is not currently listed
                for sale.
              </p>
            </div>
          )}

          {buySuccess && (
            <div className="mt-4 rounded-xl border p-4">
              NFT purchased successfully.
            </div>
          )}

          {error && (
            <div className="mt-4 rounded-xl border p-4 text-red-500">
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
