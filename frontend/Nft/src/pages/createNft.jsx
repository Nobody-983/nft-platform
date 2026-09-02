import React, { useEffect, useState } from "react";
import {
  ImagePlus,
  Upload,
  X,
  Loader2,
  Plus,
  Trash2,
  ArrowUpRight,
  Tag,
  ShoppingBag,
} from "lucide-react";

import {
  MotionDiv,
  MotionButton,
  fadeUp,
  fadeIn,
  staggerContainer,
} from "../components/motion";

import { supabase } from "../lib/supabase";

import {
  uploadNFTImage,
  createNFT,
  deleteNFT,
} from "../services/nftService";

import {
  createListing,
  cancelListing,
  getUserListings,
} from "../services/marketService";

function CreateNFT({ user }) {
  const [form, setForm] = useState({
    name: "",
    description: "",
    category: "Art",
    price: "",
    currency: "NIM",
  });

  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState("");

  const [nfts, setNfts] = useState([]);
  const [listings, setListings] = useState([]);

  const [loading, setLoading] = useState(false);
  const [loadingNFTs, setLoadingNFTs] = useState(true);

  const [deleting, setDeleting] = useState(null);
  const [listing, setListing] = useState(null);
  const [cancelling, setCancelling] = useState(null);

  const [listingNFT, setListingNFT] = useState(null);

  const [listingForm, setListingForm] = useState({
    price: "",
    currency: "NIM",
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const categories = [
    "Art",
    "Music",
    "Collectible",
    "Gaming",
  ];

  // ================= FETCH USER NFTS =================

  const fetchNFTs = async () => {
    if (!user?.id) return;

    setLoadingNFTs(true);

    const { data, error } = await supabase
      .from("nfts")
      .select("*")
      .eq("creator_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching NFTs:", error);
      setError("Unable to load your NFTs.");
    } else {
      setNfts(data || []);
    }

    setLoadingNFTs(false);
  };

  // ================= FETCH USER LISTINGS =================

  const fetchListings = async () => {
    if (!user?.id) return;

    try {
      const data = await getUserListings(user.id);
      setListings(data || []);
    } catch (err) {
      console.error("Error fetching listings:", err);
    }
  };

  useEffect(() => {
    fetchNFTs();
    fetchListings();
  }, [user]);

  // ================= FIND LISTING =================

  const getNFTListing = (nftId) => {
    return listings.find(
      (listing) =>
        listing.nft_id === nftId &&
        listing.status === "active"
    );
  };

  // ================= INPUT =================

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  // ================= IMAGE =================

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    setError("");
    setSuccess("");

    const allowedTypes = [
      "image/png",
      "image/jpeg",
      "image/webp",
    ];

    if (!allowedTypes.includes(file.type)) {
      setError("Please upload a PNG, JPG or WEBP image.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be less than 5MB.");
      return;
    }

    setImage(file);
    setPreview(URL.createObjectURL(file));
  };

  const removeImage = () => {
    setImage(null);
    setPreview("");
  };

  // ================= CREATE NFT =================

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (!user?.id) {
      setError("You must be logged in to create an NFT.");
      return;
    }

    if (!form.name.trim()) {
      setError("NFT name is required.");
      return;
    }

    if (!image) {
      setError("Please select an image.");
      return;
    }

    if (!form.price || Number(form.price) <= 0) {
      setError("Please enter a valid price.");
      return;
    }

    try {
      setLoading(true);

      const imageUrl = await uploadNFTImage(
        image,
        user.id
      );

      const newNFT = await createNFT({
        creator_id: user.id,
        name: form.name.trim(),
        description: form.description.trim(),
        image_url: imageUrl,
        category: form.category,
        price: Number(form.price),
        currency: form.currency,
      });

      setNfts((currentNFTs) => [
        newNFT,
        ...currentNFTs,
      ]);

      setForm({
        name: "",
        description: "",
        category: "Art",
        price: "",
        currency: "NIM",
      });

      removeImage();

      setSuccess("NFT created successfully.");
    } catch (err) {
      console.error("NFT creation error:", err);

      setError(
        err?.message ||
          "Something went wrong while creating your NFT."
      );
    } finally {
      setLoading(false);
    }
  };

  // ================= OPEN LISTING FORM =================

  const openListingForm = (nft) => {
    setError("");
    setSuccess("");

    setListingNFT(nft);

    setListingForm({
      price: nft.price || "",
      currency: nft.currency || "NIM",
    });
  };

  // ================= CLOSE LISTING FORM =================

  const closeListingForm = () => {
    setListingNFT(null);

    setListingForm({
      price: "",
      currency: "NIM",
    });
  };

  // ================= LIST NFT =================

  const handleListNFT = async (e) => {
    e.preventDefault();

    if (!listingNFT) return;

    setError("");
    setSuccess("");

    if (
      !listingForm.price ||
      Number(listingForm.price) <= 0
    ) {
      setError("Please enter a valid listing price.");
      return;
    }

    try {
      setListing(listingNFT.id);

      const newListing = await createListing({
        nft_id: listingNFT.id,
        seller_id: user.id,
        price: Number(listingForm.price),
        currency: listingForm.currency,
      });

      setListings((currentListings) => [
        newListing,
        ...currentListings,
      ]);

      closeListingForm();

      setSuccess(
        `"${listingNFT.name}" is now listed for sale.`
      );
    } catch (err) {
      console.error("NFT listing error:", err);

      setError(
        err?.message ||
          "Unable to list this NFT."
      );
    } finally {
      setListing(null);
    }
  };

  // ================= CANCEL LISTING =================

  const handleCancelListing = async (nft) => {
    const currentListing = getNFTListing(nft.id);

    if (!currentListing) return;

    const confirmed = window.confirm(
      `Remove "${nft.name}" from the marketplace?`
    );

    if (!confirmed) return;

    try {
      setCancelling(nft.id);
      setError("");
      setSuccess("");

      await cancelListing(currentListing.id);

      setListings((currentListings) =>
        currentListings.map((item) =>
          item.id === currentListing.id
            ? {
                ...item,
                status: "cancelled",
              }
            : item
        )
      );

      setSuccess(
        `"${nft.name}" has been removed from the marketplace.`
      );
    } catch (err) {
      console.error(
        "Cancel listing error:",
        err
      );

      setError(
        err?.message ||
          "Unable to cancel this listing."
      );
    } finally {
      setCancelling(null);
    }
  };

  // ================= DELETE NFT =================

  const handleDelete = async (nft) => {
    const currentListing = getNFTListing(nft.id);

    if (currentListing) {
      setError(
        "Cancel the marketplace listing before deleting this NFT."
      );
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to delete "${nft.name}"?`
    );

    if (!confirmed) return;

    try {
      setDeleting(nft.id);
      setError("");
      setSuccess("");

      await deleteNFT(nft);

      setNfts((currentNFTs) =>
        currentNFTs.filter(
          (item) => item.id !== nft.id
        )
      );

      setSuccess("NFT deleted successfully.");
    } catch (err) {
      console.error("NFT delete error:", err);

      setError(
        err?.message ||
          "Unable to delete this NFT."
      );
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0b12] px-4 py-6 text-white sm:px-6">

      {/* ================= HEADER ================= */}

      <MotionDiv
        variants={fadeUp}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold tracking-tight">
          My NFTs
        </h1>

        <p className="mt-3 text-sm text-gray-400">
          Create, manage and showcase your digital assets.
        </p>
      </MotionDiv>

      {/* ================= MESSAGES ================= */}

      {error && (
        <MotionDiv
          variants={fadeIn}
          className="mb-6 flex items-center justify-between rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400"
        >
          <span>{error}</span>

          <button
            onClick={() => setError("")}
            className="ml-4"
          >
            <X size={17} />
          </button>
        </MotionDiv>
      )}

      {success && (
        <MotionDiv
          variants={fadeIn}
          className="mb-6 rounded-xl border border-green-500/20 bg-green-500/10 px-4 py-3 text-sm text-green-400"
        >
          {success}
        </MotionDiv>
      )}

      {/* ================= CREATE NFT ================= */}

      <MotionDiv
        variants={fadeUp}
        className="mb-12 rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-6 lg:p-8"
      >
        <div className="mb-6">
          <h2 className="text-xl font-semibold">
            Create New NFT
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Upload your digital asset and add it to your collection.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="grid gap-8 lg:grid-cols-[320px_1fr]"
        >

          {/* IMAGE */}

          <div>
            <label className="mb-3 block text-sm font-medium">
              NFT Image
            </label>

            {preview ? (
              <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-black/20">

                <img
                  src={preview}
                  alt="NFT preview"
                  className="aspect-square w-full object-cover"
                />

                <MotionButton
                  type="button"
                  onClick={removeImage}
                  className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-black/70 text-white backdrop-blur-md transition hover:bg-red-500"
                >
                  <X size={17} />
                </MotionButton>

              </div>
            ) : (
              <label className="group flex aspect-square cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-white/15 bg-white/[0.02] transition hover:border-purple-500/50 hover:bg-purple-500/[0.03]">

                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-600/10 text-purple-400 transition group-hover:bg-purple-600 group-hover:text-white">
                  <ImagePlus size={26} />
                </div>

                <p className="text-sm font-medium">
                  Upload image
                </p>

                <p className="mt-2 px-6 text-center text-xs text-gray-500">
                  PNG, JPG or WEBP
                  <br />
                  Maximum 5MB
                </p>

                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handleImageChange}
                  className="hidden"
                />

              </label>
            )}
          </div>

          {/* FORM */}

          <div className="space-y-5">

            <div>
              <label className="mb-2 block text-sm font-medium">
                NFT Name
              </label>

              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Enter NFT name"
                className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition placeholder:text-gray-600 focus:border-purple-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">
                Description
              </label>

              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                rows={5}
                placeholder="Describe your NFT..."
                className="w-full resize-none rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition placeholder:text-gray-600 focus:border-purple-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">
                Category
              </label>

              <select
                name="category"
                value={form.category}
                onChange={handleChange}
                className="w-full rounded-xl border border-white/10 bg-[#11111a] px-4 py-3 text-sm text-white outline-none transition focus:border-purple-500"
              >
                {categories.map((category) => (
                  <option
                    key={category}
                    value={category}
                  >
                    {category}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_140px]">

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Price
                </label>

                <input
                  type="number"
                  name="price"
                  value={form.price}
                  onChange={handleChange}
                  min="0"
                  step="0.00000001"
                  placeholder="0.00"
                  className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition placeholder:text-gray-600 focus:border-purple-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Currency
                </label>

                <select
                  name="currency"
                  value={form.currency}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-white/10 bg-[#11111a] px-4 py-3 text-sm text-white outline-none transition focus:border-purple-500"
                >
                  <option value="NIM">
                    NIM
                  </option>

                  <option value="USD">
                    USD
                  </option>

                  <option value="NGN">
                    NGN
                  </option>
                </select>
              </div>

            </div>

            <div className="pt-2">
              <MotionButton
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-purple-600 px-5 py-3 text-sm font-semibold transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-fit"
              >
                {loading ? (
                  <>
                    <Loader2
                      size={18}
                      className="animate-spin"
                    />
                    Creating...
                  </>
                ) : (
                  <>
                    <Upload size={18} />
                    Create NFT
                  </>
                )}
              </MotionButton>
            </div>

          </div>
        </form>
      </MotionDiv>

      {/* ================= YOUR NFTS ================= */}

      <MotionDiv variants={fadeUp}>

        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">
              Your NFTs
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              {nfts.length}{" "}
              {nfts.length === 1 ? "NFT" : "NFTs"} created
            </p>
          </div>

          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-600/10 text-purple-400">
            <Plus size={20} />
          </div>
        </div>

        {loadingNFTs ? (

          <div className="flex min-h-[220px] items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03]">
            <Loader2
              size={28}
              className="animate-spin text-purple-500"
            />
          </div>

        ) : nfts.length > 0 ? (

          <MotionDiv
            variants={staggerContainer}
            className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3"
          >

            {nfts.map((nft) => {
              const currentListing = getNFTListing(
                nft.id
              );

              return (
                <MotionDiv
                  key={nft.id}
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

                    <div className="absolute left-3 top-3 rounded-lg bg-black/60 px-3 py-1.5 text-xs font-medium backdrop-blur-md">
                      {nft.category}
                    </div>

                    {currentListing && (
                      <div className="absolute bottom-3 left-3 flex items-center gap-1.5 rounded-lg bg-green-500/90 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-md">
                        <ShoppingBag size={13} />
                        Listed
                      </div>
                    )}

                    {/* DELETE */}

                    <MotionButton
                      type="button"
                      onClick={() =>
                        handleDelete(nft)
                      }
                      disabled={
                        deleting === nft.id ||
                        !!currentListing
                      }
                      className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-md transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {deleting === nft.id ? (
                        <Loader2
                          size={16}
                          className="animate-spin"
                        />
                      ) : (
                        <Trash2 size={16} />
                      )}
                    </MotionButton>

                  </div>

                  {/* DETAILS */}

                  <div className="p-5">

                    <div className="mb-4">
                      <h3 className="text-lg font-semibold">
                        {nft.name}
                      </h3>

                      <p className="mt-1 line-clamp-2 text-sm text-gray-500">
                        {nft.description ||
                          "No description provided."}
                      </p>
                    </div>

                    {/* PRICE */}

                    <div className="mb-4">
                      <p className="text-xs text-gray-500">
                        {currentListing
                          ? "Listing price"
                          : "Price"}
                      </p>

                      <p className="mt-1 text-base font-semibold">
                        {currentListing
                          ? `${currentListing.price} ${currentListing.currency}`
                          : `${nft.price} ${nft.currency}`}
                      </p>
                    </div>

                    {/* ACTIONS */}

                    <div className="flex gap-2">

                      {currentListing ? (
                        <MotionButton
                          type="button"
                          onClick={() =>
                            handleCancelListing(nft)
                          }
                          disabled={
                            cancelling === nft.id
                          }
                          className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-red-500/40 px-3 py-2 text-sm font-medium text-red-400 transition hover:bg-red-500 hover:text-white disabled:opacity-50"
                        >
                          {cancelling === nft.id ? (
                            <>
                              <Loader2
                                size={15}
                                className="animate-spin"
                              />
                              Removing...
                            </>
                          ) : (
                            <>
                              <X size={15} />
                              Cancel Listing
                            </>
                          )}
                        </MotionButton>
                      ) : (
                        <MotionButton
                          type="button"
                          onClick={() =>
                            openListingForm(nft)
                          }
                          className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-purple-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-purple-700"
                        >
                          <Tag size={15} />
                          List for Sale
                        </MotionButton>
                      )}

                      <MotionButton
                        type="button"
                        className="flex items-center gap-1.5 rounded-xl border border-purple-500/40 px-3 py-2 text-sm font-medium text-purple-400 transition hover:bg-purple-600 hover:text-white"
                      >
                        View
                        <ArrowUpRight size={15} />
                      </MotionButton>

                    </div>

                  </div>

                </MotionDiv>
              );
            })}

          </MotionDiv>

        ) : (

          <MotionDiv
            variants={fadeIn}
            className="rounded-2xl border border-white/10 bg-white/[0.03] py-16 text-center"
          >

            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-600/10 text-purple-400">
              <ImagePlus size={25} />
            </div>

            <p className="text-lg font-semibold">
              No NFTs yet
            </p>

            <p className="mt-2 text-sm text-gray-500">
              Create your first NFT using the form above.
            </p>

          </MotionDiv>
        )}

      </MotionDiv>

      {/* ================= LISTING MODAL ================= */}

      {listingNFT && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">

          <MotionDiv
            variants={fadeUp}
            className="w-full max-w-md rounded-2xl border border-white/10 bg-[#11111a] p-6 shadow-2xl"
          >

            <div className="mb-6 flex items-start justify-between">

              <div>
                <h2 className="text-xl font-semibold">
                  List NFT for Sale
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  {listingNFT.name}
                </p>
              </div>

              <button
                type="button"
                onClick={closeListingForm}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/5 text-gray-400 transition hover:bg-white/10 hover:text-white"
              >
                <X size={18} />
              </button>

            </div>

            <form
              onSubmit={handleListNFT}
              className="space-y-5"
            >

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Sale Price
                </label>

                <input
                  type="number"
                  value={listingForm.price}
                  onChange={(e) =>
                    setListingForm({
                      ...listingForm,
                      price: e.target.value,
                    })
                  }
                  min="0"
                  step="0.00000001"
                  placeholder="Enter price"
                  className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition placeholder:text-gray-600 focus:border-purple-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Currency
                </label>

                <select
                  value={listingForm.currency}
                  onChange={(e) =>
                    setListingForm({
                      ...listingForm,
                      currency: e.target.value,
                    })
                  }
                  className="w-full rounded-xl border border-white/10 bg-[#0b0b12] px-4 py-3 text-sm text-white outline-none transition focus:border-purple-500"
                >
                  <option value="NIM">
                    NIM
                  </option>

                  <option value="USD">
                    USD
                  </option>

                  <option value="NGN">
                    NGN
                  </option>
                </select>
              </div>

              <div className="flex gap-3 pt-2">

                <MotionButton
                  type="button"
                  onClick={closeListingForm}
                  className="flex-1 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-medium text-gray-300 transition hover:bg-white/[0.08] hover:text-white"
                >
                  Cancel
                </MotionButton>

                <MotionButton
                  type="submit"
                  disabled={listing === listingNFT.id}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-purple-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {listing === listingNFT.id ? (
                    <>
                      <Loader2
                        size={17}
                        className="animate-spin"
                      />
                      Listing...
                    </>
                  ) : (
                    <>
                      <Tag size={17} />
                      List NFT
                    </>
                  )}
                </MotionButton>

              </div>

            </form>

          </MotionDiv>

        </div>
      )}

    </div>
  );
}

export default CreateNFT;