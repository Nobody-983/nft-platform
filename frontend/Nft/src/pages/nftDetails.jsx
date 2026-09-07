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

  const [buying, setBuying] = useState(false);
  const [buyError, setBuyError] = useState("");
  const [buySuccess, setBuySuccess] = useState(false);

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
        <Loader2 size={30} className="animate-spin text-purple-500" />
      </div>
    );
  }

  if (!nft) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#0b0b12] px-6 text-white">
        <h1 className="text-2xl font-bold">NFT not found</h1>

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
              {nft.description || "No description provided."}
            </p>
          </div>

          {/* PRICE */}

          <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <p className="text-sm text-gray-500">Current price</p>

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

  // ==========================================
  // BUY NFT
  // ==========================================

  const handleBuyNFT = async () => {
    if (!listing || buying) return;

    const {
      walletAddress: connectedWalletAddress,
      user: walletUser,
    } = useWallet() || {};

    if (!connectedWalletAddress) {
      setBuyError("Please connect your Nimiq wallet first.");
      return;
    }

    setBuying(true);
    setBuyError("");

    try {
      // Get user's Nimiq balance
      const balance = await fetchNimiqBalance(connectedWalletAddress);

      // NFT price
      const nftPrice = Number(listing.price);
      const nftCurrency = listing.currency || "NIM";

      // Total cost
      const total = nftPrice;

      // Check balance
      if (balance < total) {
        setBuyError(
          `Insufficient NIM balance. You have ${balance.toFixed(2)} NIM, but need ${total.toFixed(2)} NIM.`
        );
        setBuying(false);
        return;
      }

      // Initialize Nimiq provider
      const provider = await initNimiq({ timeout: 10000 });

      // Send NIM transaction to seller
      const txHash = await sendNIMTransaction(provider, {
        recipient: connectedWalletAddress,
        valueInNim: total,
      });

      // Wait for transaction confirmation
      // In a real implementation, we would poll the Nimiq network for confirmation
      // For now, we'll wait and then verify at the database level
      await new Promise((resolve) => setTimeout(resolve, 3000));

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

      // Check if this transaction has already been processed (double spend protection)
      const { data: existingSale } = await supabase
        .from("marketplace_sales")
        .select("transaction_hash")
        .eq("transaction_hash", txHash)
        .maybeSingle();

      if (existingSale) {
        setBuyError("This transaction has already been processed. The NFT may have already been purchased.");
        setBuying(false);
        return;
      }

      // Mark listing as sold using Supabase with active status check (atomic)
      const { error: updateError } = await supabase
        .from("marketplace_listings")
        .update({ status: "sold" })
        .eq("id", listing.id)
        .eq("status", "active"); // Critical: only update if still active

      if (updateError) {
        console.error("Failed to update listing status:", updateError);
        setBuyError("Failed to claim NFT. Please try again.");
        setBuying(false);
        return;
      }

      // Create sale transaction record in Supabase
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

      // Update NFT ownership - transfer to buyer
      // This assumes the nfts table has an owner_id or similar field
      // For now, we'll just record the sale and update the UI
      // In a full implementation, you would update the NFT's owner field

      // Show success state
      setBuySuccess(true);

      // Reset after a moment
      await new Promise((resolve) => setTimeout(resolve, 2000));
      setBuySuccess(false);
      setBuying(false);

      // Refresh the NFT data to reflect the new state
      await fetchNFT();
    } catch (err) {
      console.error("Buy NFT error:", err);
      const message = err?.message || "Failed to complete NFT purchase."

      if (
        message.includes("reject") ||
        message.includes("cancel") ||
        message.includes("denied")
      ) {
        setBuyError("Transaction was rejected by the user.");
      } else if (message.includes("insufficient")) {
        setBuyError(`Insufficient NIM balance. ${message}`);
      } else if (message.includes("already")) {
        setBuyError(message);
      } else {
        setBuyError(message);
      }

      setBuying(false);
    }
  };
}

export default NFTDetails;