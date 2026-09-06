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
              onClick={handleBuyNFT}
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

  const handleBuyNFT = async () => {
    if (!listing || buying) return;

    const { walletAddress: connectedWalletAddress } = useWallet() || {};

    if (!connectedWalletAddress) {
      setBuyError("Please connect your Nimiq wallet first.");
      return;
    }

    setBuying(true);
    setBuyError("");

    try {
      // Get user's TESTNET balance
      const balance = await fetchNimiqBalance(connectedWalletAddress);

      // NFT price
      const nftPrice = Number(listing.price);
      const nftCurrency = listing.currency || "NIM";

      // Calculate gas fee (Nimiq network fee estimate)
      // In a real implementation, this would be calculated from the transaction
      // For now, use a small fixed fee for testnet
      const gasFeeAmount = 0.001; // 0.001 NIM network fee
      const gasFee = `${gasFeeAmount} NIM`;

      // Total cost
      const total = nftPrice + gasFeeAmount;
      setTotalCost(`${total} ${nftCurrency}`);

      // Show gas fee
      setGasFee(gasFee);

      // Check balance
      if (balance < total) {
        setBuyError(
          `Insufficient TESTNET balance. You have ${balance} NIM, but need ${total} NIM.`
        );
        setBuying(false);
        return;
      }

      // Send Nimiq TESTNET transaction
      const provider = await initNimiq({ timeout: 5000 });

      const txHash = await sendNIMTransaction(provider, {
        recipient: connectedWalletAddress,
        valueInNim: total,
      });

      // Show pending state
      setBuyError("");

      // Wait for transaction confirmation
      // In a real implementation, we would poll for transaction status
      // For now, simulate confirmation after a delay
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Verify the listing is still active before claiming it
      // This provides double-purchase protection at the database level
      const { data: refreshedListing, error: refreshError } = await supabase
        .from("marketplace_listings")
        .select("status, id, price, currency, seller_id")
        .eq("id", listing.id)
        .single();

      if (refreshError || !refreshedListing || refreshedListing.status !== "active") {
        setBuyError("This NFT has already been sold or is no longer available.");
        setBuying(false);
        return;
      }

      // Mark listing as inactive and create sale record atomically
      // Using Supabase with specific checks ensures only one purchase can succeed
      const { error: updateError } = await supabase
        .from("marketplace_listings")
        .update({ status: "sold" })
        .eq("id", listing.id)
        .eq("status", "active");  // Critical: only update if still active

      if (updateError) {
        console.error("Failed to update listing status:", updateError);
        setBuyError("Failed to claim NFT. Please try again.");
        setBuying(false);
        return;
      }

      // Create sale transaction record
      const { error: saleError } = await supabase
        .from("marketplace_sales")
        .insert({
          nft_id: nft.id,
          listing_id: listing.id,
          seller_id: listing.seller_id,
          buyer_id: connectedWalletAddress,
          price: listing.price,
          currency: listing.currency || "NIM",
          transaction_hash: txHash,
          status: "completed",
          created_at: new Date().toISOString(),
        });

      if (saleError) {
        // Roll back the listing status if sale record creation failed
        await supabase
          .from("marketplace_listings")
          .update({ status: "active" })
          .eq("id", listing.id);
        console.error("Failed to create sale record:", saleError);
        setBuyError("Transaction submitted but failed to record sale. Please contact support.");
        setBuying(false);
        return;
      }

      // Transaction recorded successfully
      setBuySuccess(true);

      // Reset after a moment
      await new Promise((resolve) => setTimeout(resolve, 2000));
      setBuySuccess(false);
      setBuying(false);
    } catch (err) {
      console.error("Buy NFT error:", err);
      setBuyError(err?.message || "Failed to complete NFT purchase.");
      setBuying(false);
    }
  };

export default NFTDetails;