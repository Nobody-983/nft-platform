
import { useCallback, useEffect, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  Loader2,
  ShoppingBag,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";

import { useWallet } from "../context/walletContext";

import {
  initNimiq,
  fetchNimiqBalance,
  sendNIMTransaction,
} from "../lib/nimiq";

import { supabase } from "../lib/supabase";

function NFTDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { walletAddress } = useWallet();

  const [nft, setNft] = useState(null);
  const [listing, setListing] = useState(null);

  const [loading, setLoading] = useState(true);
  const [buying, setBuying] = useState(false);

  const [buyError, setBuyError] = useState("");
  const [buySuccess, setBuySuccess] = useState(false);

  // ================= FETCH NFT =================

  const fetchNFT = useCallback(async () => {
    if (!id) return;

    try {
      setLoading(true);
      setBuyError("");

      const { data, error } = await supabase
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

      if (error) {
        throw error;
      }

      setNft(data);

      const activeListing =
        data.marketplace_listings?.find(
          (item) => item.status === "active"
        );

      setListing(activeListing || null);
    } catch (error) {
      console.error("Error loading NFT:", error);

      setNft(null);
      setListing(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchNFT();
  }, [fetchNFT]);

  // ================= BUY NFT =================

  const handleBuyNFT = async () => {
    if (!listing || buying) return;

    if (!walletAddress) {
      setBuyError(
        "Please connect your Nimiq wallet first."
      );
      return;
    }

    if (!nft) {
      setBuyError(
        "NFT information is unavailable."
      );
      return;
    }

    setBuying(true);
    setBuyError("");
    setBuySuccess(false);

    try {
      // ================= PRICE =================

      const nftPrice = Number(listing.price);

      if (!Number.isFinite(nftPrice) || nftPrice <= 0) {
        throw new Error(
          "This NFT has an invalid price."
        );
      }

      const currency =
        listing.currency || "NIM";

      if (currency.toUpperCase() !== "NIM") {
        throw new Error(
          "This NFT can only be purchased with NIM."
        );
      }

      // ================= SELLER =================

      const {
        data: sellerProfile,
        error: sellerError,
      } = await supabase
        .from("profiles")
        .select("id, wallet_address")
        .eq("id", listing.seller_id)
        .single();

      if (sellerError || !sellerProfile) {
        throw new Error(
          "Unable to find the seller."
        );
      }

      const sellerWallet =
        sellerProfile.wallet_address;

      if (!sellerWallet) {
        throw new Error(
          "The seller does not have a Nimiq wallet connected."
        );
      }

      // Prevent buying your own NFT.

      if (
        sellerWallet.replace(/\s+/g, "").toUpperCase() ===
        walletAddress.replace(/\s+/g, "").toUpperCase()
      ) {
        throw new Error(
          "You cannot purchase your own NFT."
        );
      }

      // ================= BALANCE =================

      const balance =
        await fetchNimiqBalance(walletAddress);

      if (balance < nftPrice) {
        throw new Error(
          `Insufficient NIM balance. You have ${balance.toFixed(
            2
          )} NIM, but need ${nftPrice.toFixed(2)} NIM.`
        );
      }

      // ================= PROVIDER =================

      const provider =
        await initNimiq({
          timeout: 10000,
        });

      if (!provider) {
        throw new Error(
          "Nimiq wallet provider is unavailable."
        );
      }

      // ================= TRANSACTION =================

      const txHash =
        await sendNIMTransaction(provider, {
          recipient: sellerWallet,
          valueInNim: nftPrice,
        });

      if (!txHash) {
        throw new Error(
          "Transaction was not submitted."
        );
      }

      // ================= CHECK LISTING =================

      await new Promise((resolve) =>
        setTimeout(resolve, 3000)
      );

      const {
        data: refreshedListing,
        error: refreshError,
      } = await supabase
        .from("marketplace_listings")
        .select(
          "id, price, currency, status, seller_id"
        )
        .eq("id", listing.id)
        .single();

      if (
        refreshError ||
        !refreshedListing
      ) {
        throw new Error(
          "Transaction was submitted, but the listing could not be verified."
        );
      }

      if (
        refreshedListing.status !== "active"
      ) {
        throw new Error(
          "This NFT has already been sold."
        );
      }

      // ================= DUPLICATE TRANSACTION =================

      const {
        data: existingSale,
        error: saleLookupError,
      } = await supabase
        .from("marketplace_sales")
        .select("transaction_hash")
        .eq(
          "transaction_hash",
          txHash
        )
        .maybeSingle();

      if (saleLookupError) {
        console.warn(
          "Sale lookup error:",
          saleLookupError
        );
      }

      if (existingSale) {
        throw new Error(
          "This transaction has already been processed."
        );
      }

      // ================= MARK LISTING SOLD =================

      const {
        data: updatedListing,
        error: updateError,
      } = await supabase
        .from("marketplace_listings")
        .update({
          status: "sold",
        })
        .eq("id", listing.id)
        .eq("status", "active")
        .select()
        .maybeSingle();

      if (updateError) {
        console.error(
          "Failed to update listing:",
          updateError
        );

        throw new Error(
          "The NIM transaction was submitted, but the NFT could not be claimed."
        );
      }

      if (!updatedListing) {
        throw new Error(
          "This NFT has already been purchased."
        );
      }

      // ================= RECORD SALE =================

      const {
        error: saleError,
      } = await supabase
        .from("marketplace_sales")
        .insert({
          nft_id: nft.id,
          listing_id: listing.id,
          seller_id: listing.seller_id,
          buyer_id: walletAddress,
          price: listing.price,
          currency: currency,
          transaction_hash: txHash,
          status: "completed",
          created_at: new Date().toISOString(),
        });

      if (saleError) {
        console.error(
          "Failed to record sale:",
          saleError
        );

        throw new Error(
          "Payment was submitted, but the marketplace could not record the sale."
        );
      }

      // ================= SUCCESS =================

      setBuySuccess(true);
      setListing(null);

      await fetchNFT();
    } catch (error) {
      console.error(
        "Buy NFT error:",
        error
      );

      const message =
        error?.message ||
        "Failed to complete NFT purchase.";

      const lowerMessage =
        message.toLowerCase();

      if (
        lowerMessage.includes("reject") ||
        lowerMessage.includes("cancel") ||
        lowerMessage.includes("denied")
      ) {
        setBuyError(
          "Transaction was rejected by the user."
        );
      } else {
        setBuyError(message);
      }
    } finally {
      setBuying(false);
    }
  };

  // ================= LOADING =================

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

  // ================= NOT FOUND =================

  if (!nft) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#0b0b12] px-6 text-white">
        <h1 className="text-2xl font-bold">
          NFT not found
        </h1>

        <button
          type="button"
          onClick={() =>
            navigate("/marketplace")
          }
          className="mt-5 rounded-xl bg-purple-600 px-5 py-3 text-sm font-semibold transition hover:bg-purple-700"
        >
          Back to Marketplace
        </button>
      </div>
    );
  }

  // ================= CREATOR =================

  const creator =
    nft.profiles?.display_name ||
    nft.profiles?.username ||
    "Unknown creator";

  // ================= RENDER =================

  return (
    <div className="min-h-screen bg-[#0b0b12] px-4 py-6 text-white sm:px-6">

      {/* BACK */}

      <button
        type="button"
        onClick={() =>
          navigate("/marketplace")
        }
        className="mb-8 flex items-center gap-2 text-sm text-gray-400 transition hover:text-white"
      >
        <ArrowLeft size={18} />
        Back to Marketplace
      </button>

      {/* DETAILS */}

      <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-2">

        {/* IMAGE */}

        <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
          {nft.image_url ? (
            <img
              src={nft.image_url}
              alt={nft.name}
              className="aspect-square h-full w-full object-cover"
            />
          ) : (
            <div className="flex aspect-square items-center justify-center text-gray-500">
              No image available
            </div>
          )}
        </div>

        {/* INFORMATION */}

        <div className="flex flex-col justify-center">

          {/* CATEGORY */}

          <div className="mb-4 inline-flex w-fit rounded-lg bg-purple-600/10 px-3 py-1.5 text-xs font-medium text-purple-400">
            {nft.category ||
              "Digital Collectible"}
          </div>

          {/* NAME */}

          <h1 className="text-4xl font-bold tracking-tight">
            {nft.name}
          </h1>

          {/* CREATOR */}

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
                ? `${listing.price} ${
                    listing.currency || "NIM"
                  }`
                : `${nft.price} ${
                    nft.currency || "NIM"
                  }`}
            </p>
          </div>

          {/* SUCCESS */}

          {buySuccess && (
            <div className="mt-6 flex items-center gap-3 rounded-xl border border-green-500/20 bg-green-500/10 px-4 py-4 text-sm text-green-400">
              <CheckCircle2 size={20} />

              <div>
                <p className="font-semibold">
                  NFT purchased successfully
                </p>

                <p className="mt-1 text-green-400/70">
                  Your NIM transaction was submitted and the sale was recorded.
                </p>
              </div>
            </div>
          )}

          {/* ERROR */}

          {buyError && (
            <div className="mt-6 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-4 text-sm text-red-400">
              {buyError}
            </div>
          )}

          {/* BUY */}

          {listing ? (
            <button
              type="button"
              onClick={handleBuyNFT}
              disabled={buying}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-purple-600 px-5 py-4 font-semibold transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {buying ? (
                <>
                  <Loader2
                    size={19}
                    className="animate-spin"
                  />
                  Processing...
                </>
              ) : (
                <>
                  <ShoppingBag size={19} />
                  Buy NFT
                </>
              )}
            </button>
          ) : (
            <div className="mt-6 rounded-xl border border-white/10 bg-white/[0.03] px-5 py-4 text-center text-sm text-gray-500">
              This NFT is not currently listed for sale.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default NFTDetails;
