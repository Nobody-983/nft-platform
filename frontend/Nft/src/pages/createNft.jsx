import { useEffect, useRef, useState } from "react";
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
  deleteNFTImage,
} from "../services/nftService";

import {
  createListing,
  cancelListing,
  getUserListings,
} from "../services/marketService";

// =========================================================
// CONSTANTS
// =========================================================

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

const ALLOWED_IMAGE_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
];

const ALLOWED_IMAGE_EXTENSIONS = [
  "png",
  "jpg",
  "jpeg",
  "webp",
];

const CATEGORIES = [
  "Art",
  "Music",
  "Collectible",
  "Gaming",
];

// =========================================================
// COMPONENT
// =========================================================

function CreateNFT({ user }) {
  const fileInputRef = useRef(null);

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
  const [uploading, setUploading] = useState(false);
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

  // =========================================================
  // FETCH USER NFTS
  // =========================================================

  const fetchNFTs = async () => {
    if (!user?.id) {
      setNfts([]);
      setLoadingNFTs(false);
      return;
    }

    setLoadingNFTs(true);

    try {
      const { data, error: fetchError } = await supabase
        .from("nfts")
        .select("*")
        .eq("creator_id", user.id)
        .order("created_at", {
          ascending: false,
        });

      if (fetchError) {
        throw fetchError;
      }

      setNfts(data || []);
    } catch (err) {
      console.error("Error fetching NFTs:", err);
      setError("Unable to load your NFTs.");
    } finally {
      setLoadingNFTs(false);
    }
  };

  // =========================================================
  // FETCH USER LISTINGS
  // =========================================================

  const fetchListings = async () => {
    if (!user?.id) {
      setListings([]);
      return;
    }

    try {
      const data = await getUserListings(user.id);
      setListings(data || []);
    } catch (err) {
      console.error("Error fetching listings:", err);
    }
  };

  // =========================================================
  // INITIAL LOAD
  // =========================================================

  useEffect(() => {
    fetchNFTs();
    fetchListings();
  }, [user?.id]);

  // =========================================================
  // FIND ACTIVE LISTING
  // =========================================================

  const getNFTListing = (nftId) => {
    return listings.find(
      (item) =>
        item.nft_id === nftId &&
        item.status === "active"
    );
  };

  // =========================================================
  // INPUT HANDLING
  // =========================================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  // =========================================================
  // VALIDATE IMAGE
  // =========================================================

  const validateImage = (file) => {
    if (!file) {
      return "Please select an image.";
    }

    if (!file.type) {
      return "Unable to determine the image type.";
    }

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      return "Only PNG, JPG, JPEG or WEBP images are allowed.";
    }

    if (file.size > MAX_IMAGE_SIZE) {
      return "Image must be less than 5MB.";
    }

    const extension = file.name
      ?.split(".")
      .pop()
      ?.toLowerCase();

    if (
      !extension ||
      !ALLOWED_IMAGE_EXTENSIONS.includes(extension)
    ) {
      return "Invalid image file extension.";
    }

    return null;
  };

  // =========================================================
  // IMAGE SELECTION
  // =========================================================

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];

    if (!file) {
      return;
    }

    setError("");
    setSuccess("");

    const validationError = validateImage(file);

    if (validationError) {
      setImage(null);
      setPreview("");

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      setError(validationError);
      return;
    }

    // Revoke the previous preview URL.
    if (preview) {
      URL.revokeObjectURL(preview);
    }

    const newPreview = URL.createObjectURL(file);

    setImage(file);
    setPreview(newPreview);
  };

  // =========================================================
  // REMOVE IMAGE
  // =========================================================

  const removeImage = () => {
    if (preview) {
      URL.revokeObjectURL(preview);
    }

    setPreview("");
    setImage(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // =========================================================
  // CREATE NFT
  // =========================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (loading) {
      return;
    }

    setError("");
    setSuccess("");

    // -------------------------------------------------------
    // AUTH CHECK
    // -------------------------------------------------------

    if (!user?.id) {
      setError(
        "You must be logged in to create an NFT."
      );
      return;
    }

    // -------------------------------------------------------
    // NAME
    // -------------------------------------------------------

    const trimmedName = form.name.trim();

    if (!trimmedName) {
      setError("NFT name is required.");
      return;
    }

    if (trimmedName.length > 100) {
      setError(
        "NFT name must be 100 characters or less."
      );
      return;
    }

    // -------------------------------------------------------
    // DESCRIPTION
    // -------------------------------------------------------

    const trimmedDescription =
      form.description.trim();

    if (trimmedDescription.length > 1000) {
      setError(
        "Description must be 1000 characters or less."
      );
      return;
    }

    // -------------------------------------------------------
    // IMAGE
    // -------------------------------------------------------

    if (!image) {
      setError("Please select an image.");
      return;
    }

    const imageValidationError =
      validateImage(image);

    if (imageValidationError) {
      setError(imageValidationError);
      return;
    }

    // -------------------------------------------------------
    // PRICE
    // -------------------------------------------------------

    const numericPrice = Number(form.price);

    if (
      !form.price ||
      !Number.isFinite(numericPrice) ||
      numericPrice <= 0
    ) {
      setError("Please enter a valid price.");
      return;
    }

    // -------------------------------------------------------
    // UPLOAD + CREATE
    // -------------------------------------------------------

    let uploadedImage = null;

    try {
      setLoading(true);
      setUploading(true);

      // -----------------------------------------------------
      // Upload image
      // -----------------------------------------------------

      uploadedImage = await uploadNFTImage(
        image,
        user.id
      );

      if (!uploadedImage?.publicUrl) {
        throw new Error(
          "Image upload completed but no image URL was returned."
        );
      }

      setUploading(false);

      // -----------------------------------------------------
      // Create NFT database record
      // -----------------------------------------------------

      const newNFT = await createNFT({
        creator_id: user.id,
        name: trimmedName,
        description: trimmedDescription,
        image_url: uploadedImage.publicUrl,
        category: form.category,
        price: numericPrice,
        currency: form.currency,
      });

      if (!newNFT) {
        throw new Error(
          "NFT could not be created."
        );
      }

      // -----------------------------------------------------
      // Update UI immediately
      // -----------------------------------------------------

      setNfts((currentNFTs) => [
        newNFT,
        ...currentNFTs,
      ]);

      // -----------------------------------------------------
      // Reset form
      // -----------------------------------------------------

      setForm({
        name: "",
        description: "",
        category: "Art",
        price: "",
        currency: "NIM",
      });

      removeImage();

      setSuccess(
        "NFT created successfully."
      );
    } catch (err) {
      console.error(
        "NFT creation error:",
        err
      );

      // -----------------------------------------------------
      // IMPORTANT:
      // If the image was uploaded but NFT creation failed,
      // remove the unused image from Supabase Storage.
      // -----------------------------------------------------

      if (uploadedImage?.filePath) {
        try {
          await deleteNFTImage(
            uploadedImage.filePath
          );
        } catch (cleanupError) {
          console.error(
            "Failed to clean up uploaded image:",
            cleanupError
          );
        }
      }

      setError(
        err?.message ||
          "Something went wrong while creating your NFT."
      );
    } finally {
      setUploading(false);
      setLoading(false);
    }
  };

  // =========================================================
  // OPEN LISTING FORM
  // =========================================================

  const openListingForm = (nft) => {
    setError("");
    setSuccess("");

    setListingNFT(nft);

    setListingForm({
      price: nft.price || "",
      currency: nft.currency || "NIM",
    });
  };

  // =========================================================
  // CLOSE LISTING FORM
  // =========================================================

  const closeListingForm = () => {
    if (listing) {
      return;
    }

    setListingNFT(null);

    setListingForm({
      price: "",
      currency: "NIM",
    });
  };

  // =========================================================
  // LIST NFT
  // =========================================================

  const handleListNFT = async (e) => {
    e.preventDefault();

    if (!listingNFT || listing) {
      return;
    }

    setError("");
    setSuccess("");

    if (!user?.id) {
      setError(
        "You must be logged in to list an NFT."
      );
      return;
    }

    const numericPrice =
      Number(listingForm.price);

    if (
      !listingForm.price ||
      !Number.isFinite(numericPrice) ||
      numericPrice <= 0
    ) {
      setError(
        "Please enter a valid listing price."
      );
      return;
    }

    try {
      setListing(listingNFT.id);

      const newListing = await createListing({
        nft_id: listingNFT.id,
        price: numericPrice,
        currency: listingForm.currency,
      });

      if (!newListing) {
        throw new Error(
          "Unable to create marketplace listing."
        );
      }

      setListings((currentListings) => [
        newListing,
        ...currentListings,
      ]);

      const nftName = listingNFT.name;

      setListingNFT(null);

      setListingForm({
        price: "",
        currency: "NIM",
      });

      setSuccess(
        `"${nftName}" is now listed for sale.`
      );
    } catch (err) {
      console.error(
        "NFT listing error:",
        err
      );

      setError(
        err?.message ||
          "Unable to list this NFT."
      );
    } finally {
      setListing(null);
    }
  };

  // =========================================================
  // CANCEL LISTING
  // =========================================================

  const handleCancelListing = async (nft) => {
    const currentListing =
      getNFTListing(nft.id);

    if (!currentListing || cancelling) {
      return;
    }

    const confirmed = window.confirm(
      `Remove "${nft.name}" from the marketplace?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setCancelling(nft.id);
      setError("");
      setSuccess("");

      const {
        data: { user: authUser },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) {
        throw authError;
      }

      if (!authUser) {
        throw new Error(
          "Your session has expired. Please log in again."
        );
      }

      if (
        authUser.id !==
        currentListing.seller_id
      ) {
        throw new Error(
          "You are not the owner of this listing."
        );
      }

      await cancelListing(
        currentListing.id
      );

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
          "Unable to remove this listing."
      );
    } finally {
      setCancelling(null);
    }
  };

  // =========================================================
  // DELETE NFT
  // =========================================================

  const handleDelete = async (nft) => {
    const currentListing =
      getNFTListing(nft.id);

    if (currentListing) {
      setError(
        "Cancel the marketplace listing before deleting this NFT."
      );
      return;
    }

    if (deleting) {
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to delete "${nft.name}"?`
    );

    if (!confirmed) {
      return;
    }

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

      setSuccess(
        "NFT deleted successfully."
      );
    } catch (err) {
      console.error(
        "NFT delete error:",
        err
      );

      setError(
        err?.message ||
          "Unable to delete this NFT."
      );
    } finally {
      setDeleting(null);
    }
  };

  // =========================================================
  // VIEW NFT
  // =========================================================

  const handleViewNFT = (nft) => {
    window.location.href = `/nft/${nft.id}`;
  };

  // =========================================================
  // CLEAN PREVIEW ON UNMOUNT
  // =========================================================

  useEffect(() => {
    return () => {
      if (preview) {
        URL.revokeObjectURL(preview);
      }
    };
  }, [preview]);

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <div className="min-h-screen bg-[#0b0b12] px-4 py-6 text-white sm:px-6">

      {/* =====================================================
          HEADER
      ====================================================== */}

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

      {/* =====================================================
          ERROR
      ====================================================== */}

      {error && (
        <MotionDiv
          variants={fadeIn}
          className="mb-6 flex items-center justify-between rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400"
        >
          <span>{error}</span>

          <button
            type="button"
            onClick={() => setError("")}
            className="ml-4"
          >
            <X size={17} />
          </button>
        </MotionDiv>
      )}

      {/* =====================================================
          SUCCESS
      ====================================================== */}

      {success && (
        <MotionDiv
          variants={fadeIn}
          className="mb-6 flex items-center justify-between rounded-xl border border-green-500/20 bg-green-500/10 px-4 py-3 text-sm text-green-400"
        >
          <span>{success}</span>

          <button
            type="button"
            onClick={() => setSuccess("")}
            className="ml-4"
          >
            <X size={17} />
          </button>
        </MotionDiv>
      )}

      {/* =====================================================
          CREATE NFT
      ====================================================== */}

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

          {/* IMAGE UPLOAD */}

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
                  disabled={loading}
                  className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-black/70 text-white backdrop-blur-md transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50"
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
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handleImageChange}
                  disabled={loading}
                  className="hidden"
                />

              </label>
            )}
          </div>

          {/* FORM */}

          <div className="space-y-5">

            {/* NAME */}

            <div>
              <label className="mb-2 block text-sm font-medium">
                NFT Name
              </label>

              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                disabled={loading}
                maxLength={100}
                placeholder="Enter NFT name"
                className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition placeholder:text-gray-600 focus:border-purple-500 disabled:cursor-not-allowed disabled:opacity-60"
              />
            </div>

            {/* DESCRIPTION */}

            <div>
              <label className="mb-2 block text-sm font-medium">
                Description
              </label>

              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                disabled={loading}
                maxLength={1000}
                rows={5}
                placeholder="Describe your NFT..."
                className="w-full resize-none rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition placeholder:text-gray-600 focus:border-purple-500 disabled:cursor-not-allowed disabled:opacity-60"
              />
            </div>

            {/* CATEGORY */}

            <div>
              <label className="mb-2 block text-sm font-medium">
                Category
              </label>

              <select
                name="category"
                value={form.category}
                onChange={handleChange}
                disabled={loading}
                className="w-full rounded-xl border border-white/10 bg-[#11111a] px-4 py-3 text-sm text-white outline-none transition focus:border-purple-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {CATEGORIES.map((category) => (
                  <option
                    key={category}
                    value={category}
                  >
                    {category}
                  </option>
                ))}
              </select>
            </div>

            {/* PRICE */}

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
                  disabled={loading}
                  min="0"
                  step="0.00000001"
                  placeholder="0.00"
                  className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition placeholder:text-gray-600 focus:border-purple-500 disabled:cursor-not-allowed disabled:opacity-60"
                />
              </div>

              {/* CURRENCY */}

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Currency
                </label>

                <select
                  name="currency"
                  value={form.currency}
                  onChange={handleChange}
                  disabled={loading}
                  className="w-full rounded-xl border border-white/10 bg-[#11111a] px-4 py-3 text-sm text-white outline-none transition focus:border-purple-500 disabled:cursor-not-allowed disabled:opacity-60"
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

            {/* SUBMIT */}

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

                    {uploading
                      ? "Uploading image..."
                      : "Creating..."}
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

      {/* =====================================================
          YOUR NFTS
      ====================================================== */}

      <MotionDiv variants={fadeUp}>

        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">
              Your NFTs
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              {nfts.length}{" "}
              {nfts.length === 1
                ? "NFT"
                : "NFTs"}{" "}
              created
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
              const currentListing =
                getNFTListing(nft.id);

              return (
                <MotionDiv
                  key={nft.id}
                  variants={fadeUp}
                  className="group overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] transition-colors duration-300 hover:-translate-y-1 hover:border-purple-500/40"
                >

                  {/* NFT IMAGE */}

                  <div className="relative aspect-[4/3] overflow-hidden">

                    <img
                      src={nft.image_url}
                      alt={nft.name}
                      loading="lazy"
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
                            handleCancelListing(
                              nft
                            )
                          }
                          disabled={
                            cancelling === nft.id
                          }
                          className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-red-500/40 px-3 py-2 text-sm font-medium text-red-400 transition hover:bg-red-500 hover:text-white disabled:opacity-50"
                        >
                          {cancelling ===
                          nft.id ? (
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
                        onClick={() =>
                          handleViewNFT(nft)
                        }
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

      {/* =====================================================
          LISTING MODAL
      ====================================================== */}

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
                disabled={
                  listing === listingNFT.id
                }
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/5 text-gray-400 transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                <X size={18} />
              </button>

            </div>

            <form
              onSubmit={handleListNFT}
              className="space-y-5"
            >

              {/* SALE PRICE */}

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Sale Price
                </label>

                <input
                  type="number"
                  value={listingForm.price}
                  onChange={(e) =>
                    setListingForm(
                      (current) => ({
                        ...current,
                        price: e.target.value,
                      })
                    )
                  }
                  disabled={
                    listing === listingNFT.id
                  }
                  min="0"
                  step="0.00000001"
                  placeholder="Enter price"
                  className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition placeholder:text-gray-600 focus:border-purple-500 disabled:opacity-60"
                />
              </div>

              {/* CURRENCY */}

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Currency
                </label>

                <select
                  value={listingForm.currency}
                  onChange={(e) =>
                    setListingForm(
                      (current) => ({
                        ...current,
                        currency: e.target.value,
                      })
                    )
                  }
                  disabled={
                    listing === listingNFT.id
                  }
                  className="w-full rounded-xl border border-white/10 bg-[#0b0b12] px-4 py-3 text-sm text-white outline-none transition focus:border-purple-500 disabled:opacity-60"
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

              {/* BUTTONS */}

              <div className="flex gap-3 pt-2">

                <MotionButton
                  type="button"
                  onClick={closeListingForm}
                  disabled={
                    listing === listingNFT.id
                  }
                  className="flex-1 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-medium text-gray-300 transition hover:bg-white/[0.08] hover:text-white disabled:opacity-50"
                >
                  Cancel
                </MotionButton>

                <MotionButton
                  type="submit"
                  disabled={
                    listing === listingNFT.id
                  }
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