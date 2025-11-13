import { useAlert } from "@/context/AlertContext";
import { useUser } from "@/context/UserContext";
import { Product } from "@/interfaces";
import { getProducts } from "@/lib/ServerActions/products";
import { updateUser } from "@/lib/ServerActions/users";
import Link from "next/link";
import { useEffect, useState } from "react";

export const SellingTab = () => {
    const { userData, setUserData } = useUser();
    // Initialize the toggle state from userData but allow local changes
    const [isSellerToggle, setIsSellerToggle] = useState(userData.isSeller);
    const [userProducts, setUserProducts] = useState<Product[] | null>(null);
    const { handleAlert } = useAlert();

    useEffect(() => {
        // Fetch products only if the user is a confirmed seller
        if (userData.isSeller) {
            getProducts({ seller: userData._id as string })
                .then(products => {
                    if (products) {
                        setUserProducts(products);
                    } else {
                        // Handle case where products might be an empty array or null
                        setUserProducts([]);
                    }
                })
                .catch(error => {
                    console.error("Error fetching user products:", error);
                    handleAlert({
                        message: "Error fetching your products.",
                        isError: true
                    });
                });
        }
    }, [userData.isSeller, userData._id, handleAlert]);

    const handleBecomeSeller = async () => {
        // We only want to set isSeller to true
        if (!isSellerToggle) {
            handleAlert({ message: "You must agree to become a seller.", isError: true });
            return;
        }

        const resp = await updateUser({ ...userData, isSeller: true });

        if (resp.status) {
            setUserData({ ...userData, isSeller: true });
            handleAlert({ message: "Congratulations! You are now a seller.", isError: false });
        } else {
            handleAlert({ message: resp.message || "An error occurred.", isError: true });
        }
    };

    // --- Render Logic ---

    // 1. User is already a seller -> Show product list
    if (userData.isSeller) {
        return (
            <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">My Products</h2>
                <div className="flex justify-end mb-4">
                    <Link
                        href="/marketplace/uploadProduct"
                        className="px-6 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg font-medium transition-colors"
                    >
                        + Add New Product
                    </Link>
                </div>
                <div className="space-y-4">
                    {userProducts === null ? (
                        <p>Loading products...</p>
                    ) : userProducts.length > 0 ? (
                        userProducts.map((product) => (
                            <div key={product._id as string} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 flex justify-between items-center">
                                <div>
                                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">{product.name}</h3>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">{product.currency} {Number(product.price)}</p>
                                </div>
                                <span
                                    className={`px-3 py-1 rounded-full text-xs font-medium ${product.publishStatus === "published"
                                        ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                                        : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                                        }`}
                                >
                                    {product.publishStatus}
                                </span>
                            </div>
                        ))
                    ) : (
                        <p>You have not created any products yet.</p>
                    )}
                </div>
            </div>
        );
    }

    // 2. User is NOT a seller and has NO address -> Prompt to add address
    if (!userData.addresses || userData.addresses.length === 0) {
        return (
            <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Become a Seller</h2>
                <p className="text-gray-700 dark:text-gray-300 mb-4">To become a seller, you must first add a primary address to your profile for pickups and verification.</p>
                <Link
                    href="/marketplace/profile?tab=addresses"
                    className="inline-block px-6 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg font-medium transition-colors"
                >
                    Add Address
                </Link>
            </div>
        );
    }

    // 3. User is NOT a seller but HAS an address -> Show the 'Become a Seller' form
    return (
        <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Become a Seller</h2>
            <div className="flex flex-col w-full gap-6 bg-gray-50 dark:bg-gray-800 p-6 rounded-lg">
                <p className="text-gray-700 dark:text-gray-300">To start selling your products on our platform, please review our terms and conditions and confirm your intention to become a seller.</p>
                
                {/* This section can be expanded with KYC information or other requirements in the future */}
                <p className="font-bold text-center text-gray-600 dark:text-gray-400">KYC Process Coming Soon</p>

                <div className="flex flex-col w-full gap-4 items-center">
                    <p className="font-medium text-gray-800 dark:text-gray-200">I want to become a seller and agree to the terms of service.</p>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input checked={isSellerToggle} onChange={() => setIsSellerToggle(!isSellerToggle)} type="checkbox" className="sr-only peer" />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
                    </label>
                </div>
            </div>
            <div className="flex justify-end mt-6">
                <button
                    type="button"
                    onClick={handleBecomeSeller}
                    disabled={!isSellerToggle} // Disable button if toggle is not checked
                    className="px-6 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg font-medium transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                    Complete Seller Registration
                </button>
            </div>
        </div>
    );
};
