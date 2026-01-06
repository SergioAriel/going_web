"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/context/CartContext";
import {
  ChevronLeftIcon,
  // CreditCardIcon,
  WalletIcon,
  ShieldCheckIcon
} from "@heroicons/react/24/outline";
import {
  Connection, Transaction, SystemProgram,
  LAMPORTS_PER_SOL,
  PublicKey, clusterApiUrl
} from "@solana/web3.js";
import { useSolanaWallets } from "@privy-io/react-auth/solana";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { useAlert } from "@/context/AlertContext";
import { createPendingOrder, getOrder } from "@/lib/ServerActions/orders";
import { Address, CartItem, NewOrderPayload } from "@/interfaces";
import { getOneProduct, getProducts } from "@/lib/ServerActions/products";
import { CheckoutComplete } from "@/lib/ServerActions/checkout";
import { useCurrencies } from "@/context/CurrenciesContext";
import { useUser } from "@/context/UserContext";
import AddressAutocomplete from "@/components/ui/AddressAutocomplete";
import { LoadingOverlay } from "@/components/ui/LoadingOverlay";
import { Shipment } from "@/interfaces";
import { getShipments } from "@/lib/ServerActions/shipments";
import { QRCodeSVG } from "qrcode.react";

const Checkout = () => {
  const router = useRouter();
  const { user } = usePrivy();
  const { userData } = useUser();
  const { items: cartItems, clearCart } = useCart();
  const { wallets } = useSolanaWallets();
  const { } = useWallets();
  // const { sendTransaction } = useSendTransaction();
  const [step, setStep] = useState(1);
  const [selectedPayment, setSelectedPayment] = useState("");
  const [address, setAddress] = useState<Address>({
    fullName: "",
    street: "",
    city: "",
    state: "",
    zipCode: "",
    country: "",
    phone: "",
  });
  const [email, setEmail] = useState("");
  const { userCurrency, listCryptoCurrencies } = useCurrencies()
  const [totalPrice, setTotalPrice] = useState(0);
  const [loading, setLoading] = useState(true);
  const { handleAlert } = useAlert()

  const [orderCompleted, setOrderCompleted] = useState(false);
  const [orderNumber, setOrderNumber] = useState("");
  const [checkoutItems, setCheckoutItems] = useState<CartItem[]>([]);
  const [newShipments, setNewShipments] = useState<Shipment[]>([]);

  useEffect(() => {
    if (!checkoutItems || !userCurrency || !listCryptoCurrencies) return;

    const total = checkoutItems.reduce((acc, item) => {
      // Check for availability property (added in loadItems)
      const isAvailable = (item as any).isAvailable !== false;
      if (!isAvailable) return acc;

      const priceToUse = item.isOffer && item.offerPercentage
        ? item.price * (1 - item.offerPercentage / 100)
        : item.price;

      const productCurrencyRate = listCryptoCurrencies.find(c => c.symbol === item.currency);
      const userCurrencyRate = userCurrency.price || 1;

      if (!productCurrencyRate) return acc; // Skip if currency not found

      const priceInUserCurrency = (priceToUse * productCurrencyRate.price) / userCurrencyRate;
      return acc + (priceInUserCurrency * item.quantity);
    }, 0);

    setTotalPrice(total);
  }, [checkoutItems, userCurrency, listCryptoCurrencies]);



  // State to track progress within each payment method
  const [paymentStage, setPaymentStage] = useState("initial"); // initial, processing, confirmed
  const [paymentError, setPaymentError] = useState(false);
  // const [transactionId, setTransactionId] = useState("");
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');
  const productId = searchParams.get('productId');
  const quantity = searchParams.get('quantity');

  // Check if the cart is empty
  useEffect(() => {
    const loadItems = async () => {
      setLoading(true);
      if (orderId) {
        const order = await getOrder(orderId);
        if (order) {
          const productIds = order.items.map((item) => item._id);
          console.log("DEBUG: Order Items IDs:", productIds); // Debug Log
          // Simplify query to find ANY product by ID, then filter in memory
          const products = await getProducts({ _id: { $in: productIds } });
          console.log("DEBUG: Fetched IDs:", products.map(p => p._id));

          const updatedItems = order.items.map((item) => {
            console.log(`DEBUG: Matching item ${item._id} with products...`);
            const product = products.find((p) => p._id === item._id);

            // STRICT AVAILABILITY CHECK
            // Use property 'isAvailable' to track status.
            // MODIFICATION: Strict check. Only 'published' is allowed. Legacy (undefined) is invalid.
            const isPublished = product && (product as any).status === "published";

            if (isPublished) {
              return { ...product, quantity: item.quantity, isAvailable: true };
            }

            // UNAVAILABLE: Product missing or unpublished.
            console.warn(`Product ${item._id} is unavailable (Status: ${(product as any)?.status ?? 'Missing'}).`);
            return {
              ...item,
              // Keep original price for display (so user knows what it was)
              price: item.price,
              quantity: item.quantity,
              isAvailable: false // Mark as unavailable
            };
          });
          setCheckoutItems(updatedItems);
        }
      } else if (productId && quantity) {
        const product = await getOneProduct(productId);
        if (product) {
          setCheckoutItems([{ ...product, quantity: Number(quantity) }]);
        }
      } else {
        setCheckoutItems(cartItems);
      }
      setLoading(false);
    };
    loadItems();
  }, [orderId, productId, quantity, cartItems]);

  useEffect(() => {
    if (!loading && checkoutItems.length === 0 && !orderCompleted) {
      router.replace("/cart");
    }
  }, [checkoutItems, orderCompleted, router, loading]);

  // Function to get the current price of Solana using the CoinGecko API

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === "email") {
      setEmail(value);
    } else {
      setAddress(prev => ({ ...prev, [name]: value }));
    }
  };

  const handlePaymentSelect = (methodId: string) => {
    setSelectedPayment(methodId);
  };

  const isAddressComplete = () => {
    return Object.values(address).every(value => value !== undefined && value.toString().trim() !== "") && email.trim() !== "";
  };

  const handleSubmitAddress = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (isAddressComplete()) {
      setStep(2);
    }
  };


  // Function to complete the checkout process
  const completeCheckout = async (signature: string, orderId: string) => {
    if (!user) {
      handleAlert({
        message: "You need to be logged in to complete the purchase",
        isError: true
      })
      return
    }
    setLoading(true);
    setPaymentStage("confirmed")
    setPaymentStage("confirmed")
    try {
      const createdShipmentIds = await CheckoutComplete({ orderId, signature, items: checkoutItems, buyer: { walletAddress: selectedPayment, _id: user.id, address, email, phone: address.phone || "" } });

      if (createdShipmentIds && createdShipmentIds.length > 0) {
        // Fetch the newly created shipments to get their details (and IDs for QR)
        // Convert ObjectIds to strings if necessary, though getShipments handles the query
        const shipmentsData = await getShipments({ _id: { $in: createdShipmentIds } });
        setNewShipments(shipmentsData);
      }

      setOrderNumber(orderId);
      clearCart();
      setOrderCompleted(true);
      setStep(3);
      setOrderCompleted(true);
      setStep(3);
    } catch (error: any) {
      console.error("Error completing purchase:", error);
      handleAlert({
        message: error.message || "Failed to complete checkout. Please try again.",
        isError: true
      });
      setPaymentStage("error");
    } finally {
      setLoading(false);
    }
  };

  // Function to handle payment form submission
  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      handleAlert({ message: "You need to be logged in to complete the purchase", isError: true });
      return;
    }
    if (!selectedPayment) {
      handleAlert({ message: "Wallet not selected", isError: true });
      return;
    }

    const wallet = wallets.find((wallet) => wallet.address === selectedPayment);
    if (!wallet) {
      handleAlert({ message: "Wallet not found", isError: true });
      return;
    }

    setLoading(true);
    setPaymentStage("processing");

    // Safety check: Total Amount must be positive
    if (totalPrice <= 0) {
      handleAlert({ message: "Invalid total amount to pay. Please refresh.", isError: true });
      setLoading(false);
      setPaymentStage("initial");
      return;
    }

    try {
      let activeOrderId = orderId;

      if (!activeOrderId) {
        // 1. Construir el payload que se enviará a la Server Action
        const orderPayload: NewOrderPayload = {
          buyer: {
            walletAddress: wallet.address,
            _id: userData?._id as string,
            address,
            email,
            phone: address.phone || ""
          },
          status: "payment_pending",
          date: new Date(),
          sellers: [...new Set(checkoutItems.map((item: CartItem) => item.seller))],
          items: checkoutItems
        };

        // 2. Llamar a la Server Action directamente para crear la orden en la DB
        const createdId = await createPendingOrder(orderPayload);
        if (!createdId) throw new Error("Order creation failed");
        activeOrderId = createdId;
      }

      // 3. Proceder con la transacción en Solana
      const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');
      const { blockhash: recentBlockhash } = await connection.getLatestBlockhash();

      const solCurrency = listCryptoCurrencies.find(c => c.symbol === "SOL");
      if (!solCurrency || !solCurrency.price) {
        handleAlert({ message: "Unable to find SOL exchange rate.", isError: true });
        return;
      }

      const objectPayments = checkoutItems.reduce((acc: { [_: string]: { totalAmount: number } }, item) => {
        const { addressWallet, price, quantity, currency } = item;

        // Skip unavailable items if any slipped through filter
        if ((item as any).isAvailable === false) return acc;

        // 1. Calculate price in Reference Currency (usually USD)
        // If item currency is missing, assume USD? Or fail? Let's try to find it.
        const itemCurrencyRate = listCryptoCurrencies.find(c => c.symbol === currency)?.price || 1; // Default to 1 if not found (risky but fallback)

        const priceInReference = (price * itemCurrencyRate);

        // 2. Convert Reference Currency to SOL
        // AmountInSOL = AmountInRef / SOLPriceInRef
        const priceInSOL = priceInReference / solCurrency.price;

        acc[addressWallet] = {
          totalAmount: (acc[addressWallet]?.totalAmount || 0) + (priceInSOL * quantity)
        };
        return acc;
      }, {});

      const transaction = new Transaction();
      const transferInstructions = Object.entries(objectPayments).map(([address, { totalAmount: _totalAmount }]) => {
        return SystemProgram.transfer({
          fromPubkey: new PublicKey(wallet.address),
          toPubkey: new PublicKey(address),
          lamports: Math.floor(_totalAmount * LAMPORTS_PER_SOL), // Real SOL Amount
        });
      });

      transferInstructions.forEach(instruction => transaction.add(instruction));
      transaction.recentBlockhash = recentBlockhash;
      transaction.feePayer = new PublicKey(wallet.address);

      // Esta es una llamada a la wallet del cliente, no es una Server Action
      const transactionReceipt = await wallet.sendTransaction(transaction, connection);

      if (transactionReceipt) {
        // 4. Si la transacción de Solana es exitosa, se finaliza el checkout
        await completeCheckout(transactionReceipt, activeOrderId);
      } else {
        throw new Error("Solana transaction failed to send.");
      }

    } catch (error) {
      console.error("Error processing payment:", error);
      setPaymentError(true);
      handleAlert({ message: "Error processing payment", isError: true });
      setLoading(false);
      setPaymentStage("initial");
      setTimeout(() => setPaymentError(false), 1000);
    }
  };

  useEffect(() => {
    if (paymentError) {
      setLoading(false)
      setPaymentStage("initial")
      setTimeout(() => {
        setPaymentError(false)
      }, 1000)
    }
  }, [loading, paymentError, paymentStage])

  if (loading) {
    return <LoadingOverlay />;
  }


  if (orderCompleted) {
    return (
      <div className="bg-gray-50 dark:bg-gray-900 min-h-screen py-10">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 text-center">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-green-600 dark:text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>

            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Order Completed!</h1>

            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Thank you for your purchase. Your order {orderNumber} has been successfully processed.
            </p>

            {/* NEW: Display QR Codes for the Shipments */}
            {newShipments.length > 0 && (
              <div className="mb-8">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Your Delivery Codes</h2>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 text-left">
                  <p className="text-sm text-yellow-800 font-medium text-center">Please Save this QR Code!</p>
                  <p className="text-sm text-yellow-700 mt-1">
                    You must show this code to the driver to receive your delivery.
                    You can also find it later in <strong>Profile &gt; Purchases</strong>.
                  </p>
                </div>

                <div className="grid gap-6 justify-items-center">
                  {newShipments.map(shipment => (
                    <div key={shipment._id} className="flex flex-col items-center bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                      <QRCodeSVG value={shipment._id} size={160} />
                      <p className="mt-2 text-sm font-medium text-gray-500">Tracking: {shipment.shortCode || "..."}</p>
                      <span className="text-xs text-gray-400 mt-1">Show for Delivery</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Shipping Details</h3>
              <p className="text-gray-600 dark:text-gray-400">
                We will send a confirmation to <span className="font-medium">{address.fullName}</span> at{" "}
                <span className="font-medium">{address.street}, {address.city}</span>
              </p>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Status: <span className="text-primary font-medium">Processing</span>
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/marketplace" className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                Back to Home
              </Link>
              <Link href="/marketplace/profile" className="inline-flex items-center justify-center px-6 py-3 bg-primary hover:bg-primary-dark text-white font-medium rounded-lg transition-colors">
                View My Orders
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="bg-gray-50 dark:bg-gray-900 min-h-screen py-10">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          {/* Progress indicator */}
          <div className="mb-8">
            <div className="flex items-center justify-center">
              {/* Step 1 */}
              <div className="flex items-center">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full ${step >= 1 ? "bg-primary text-white" : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                  }`}>
                  1
                </div>
                <div className={`hidden sm:block ml-2 text-sm font-medium ${step >= 1 ? "text-gray-900 dark:text-white" : "text-gray-500 dark:text-gray-400"
                  }`}>
                  Address
                </div>
              </div>

              {/* Connector 1-2 */}
              <div className={`w-16 sm:w-24 h-1 mx-2 ${step >= 2 ? "bg-primary" : "bg-gray-200 dark:bg-gray-700"
                }`}></div>

              {/* Step 2 */}
              <div className="flex items-center">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full ${step >= 2 ? "bg-primary text-white" : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                  }`}>
                  2
                </div>
                <div className={`hidden sm:block ml-2 text-sm font-medium ${step >= 2 ? "text-gray-900 dark:text-white" : "text-gray-500 dark:text-gray-400"
                  }`}>
                  Payment
                </div>
              </div>

              {/* Connector 2-3 */}
              <div className={`w-16 sm:w-24 h-1 mx-2 ${step >= 3 ? "bg-primary" : "bg-gray-200 dark:bg-gray-700"
                }`}></div>

              {/* Step 3 */}
              <div className="flex items-center">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full ${step >= 3 ? "bg-primary text-white" : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                  }`}>
                  3
                </div>
                <div className={`hidden sm:block ml-2 text-sm font-medium ${step >= 3 ? "text-gray-900 dark:text-white" : "text-gray-500 dark:text-gray-400"
                  }`}>
                  Confirmation
                </div>
              </div>
            </div>
          </div>


          <div className="flex flex-col lg:flex-row gap-8">
            {/* Main content */}
            <div className="lg:w-2/3">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
                {/* Step 1 - Shipping address */}
                {step === 1 && (
                  <div>
                    <div className="border-b border-gray-200 dark:border-gray-700 p-6">
                      <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                        Shipping Address
                      </h2>
                    </div>

                    <form onSubmit={handleSubmitAddress} className="p-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2">
                          <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Full Name
                          </label>
                          <input
                            id="Name"
                            name="fullName"
                            type="text"
                            required
                            value={address.fullName}
                            onChange={handleAddressChange}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-primary focus:border-primary dark:bg-gray-700 dark:text-white"
                          />
                        </div>

                        <div className="md:col-span-2">
                          <label htmlFor="street" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Address
                          </label>
                          <AddressAutocomplete
                            defaultValue={address.street}
                            onSelect={(data) => {
                              setAddress(prev => ({
                                ...prev,
                                street: data.extracted?.street || data.address,
                                city: data.extracted?.city || prev.city,
                                state: data.extracted?.state || prev.state,
                                zipCode: data.extracted?.zipCode || prev.zipCode,
                                country: data.extracted?.country || prev.country,
                                lat: data.lat,
                                lon: data.lon
                              }));
                            }}
                            placeholder="Search your address on Google Maps..."
                            className="w-full"
                          />
                        </div>

                        <div>
                          <label htmlFor="city" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            City
                          </label>
                          <input
                            id="city"
                            name="city"
                            type="text"
                            required
                            value={address.city}
                            onChange={handleAddressChange}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-primary focus:border-primary dark:bg-gray-700 dark:text-white"
                          />
                        </div>

                        <div>
                          <label htmlFor="state" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            State/Province
                          </label>
                          <input
                            id="state"
                            name="state"
                            type="text"
                            required
                            value={address.state}
                            onChange={handleAddressChange}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-primary focus:border-primary dark:bg-gray-700 dark:text-white"
                          />
                        </div>

                        <div>
                          <label htmlFor="zip" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Zip Code
                          </label>
                          <input
                            id="zipCode"
                            name="zipCode"
                            type="text"
                            required
                            value={address.zipCode}
                            onChange={handleAddressChange}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-primary focus:border-primary dark:bg-gray-700 dark:text-white"
                          />
                        </div>

                        <div>
                          <label htmlFor="country" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Country
                          </label>
                          <input
                            id="country"
                            name="country"
                            type="text"
                            required
                            value={address.country}
                            onChange={handleAddressChange}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-primary focus:border-primary dark:bg-gray-700 dark:text-white"
                          />
                        </div>

                        <div className="md:col-span-2">
                          <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Contact Phone
                          </label>
                          <input
                            id="phone"
                            name="phone"
                            type="tel"
                            required
                            value={address.phone}
                            onChange={handleAddressChange}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-primary focus:border-primary dark:bg-gray-700 dark:text-white"
                          />
                        </div>
                        <div className="md:col-span-2">
                          <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Contact Email
                          </label>
                          <input
                            id="email"
                            name="email"
                            type="email"
                            required
                            value={email}
                            onChange={handleAddressChange}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-primary focus:border-primary dark:bg-gray-700 dark:text-white"
                          />
                        </div>
                      </div>

                      <div className="mt-8 flex justify-between">
                        <Link href="/marketplace/cart" className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                          <ChevronLeftIcon className="h-5 w-5 mr-1" />
                          Back to Cart
                        </Link>

                        <button
                          type="submit"
                          disabled={totalPrice <= 0 || loading}
                          className={`inline-flex items-center px-6 py-3 font-medium rounded-lg transition-colors ${totalPrice > 0 && !loading
                            ? 'bg-primary hover:bg-primary-dark text-white'
                            : 'bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed'
                            }`}
                        >
                          Continue to Payment
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {/* Step 2 - Payment */}
                {step === 2 && (
                  <div>
                    <div className="border-b border-gray-200 dark:border-gray-700 p-6">
                      <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                        Payment Method
                      </h2>
                    </div>

                    <div className="space-y-6">
                      <div>
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
                          Wallets available for this order
                        </p>

                        {
                          wallets
                            // user?.linkedAccounts?
                            .map((wallet) => {

                              // if (wallet.type === "wallet") {
                              return (

                                <div key={wallet.address} className="flex items-center mb-4">
                                  <input
                                    type="radio"
                                    name="paymentMethod"
                                    id={wallet.address}

                                    value={wallet.address}
                                    checked={selectedPayment === wallet.address}
                                    onChange={() => handlePaymentSelect(wallet.address)}
                                    className="h-4 w-4 text-primary focus:ring-primary border-gray-300"
                                  />
                                  <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-md flex items-center justify-center mr-3">

                                    <WalletIcon
                                      width={40}
                                      height={40}
                                      className="object-contain"
                                    />
                                  </div>
                                  <label htmlFor={wallet.address} className="font-medium text-gray-900 dark:text-white">
                                    {wallet.address}
                                  </label>
                                </div>
                              )
                              // }
                            })
                        }
                      </div>
                      <div className="flex items-start mt-6">
                        <ShieldCheckIcon className="flex-shrink-0 h-5 w-5 text-green-500 mr-3" />
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          <p>
                            All your data is protected. Payment information is encrypted.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-8 flex justify-between">
                      <button
                        type="button"
                        onClick={() => setStep(1)}
                        className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        disabled={paymentStage === "processing"}
                      >
                        <ChevronLeftIcon className="h-5 w-5 mr-1" />
                        Back to Address
                      </button>

                      <button
                        onClick={handleSubmitPayment}
                        disabled={loading || paymentError || paymentStage !== "initial"}
                        className={`inline-flex items-center px-6 py-3 bg-primary hover:bg-primary-dark text-white font-medium rounded-lg transition-colors   ${(loading || paymentStage !== "initial") ? "opacity-50 cursor-not-allowed" : ""} ${paymentError && "error-animation cursor-not-allowed"}`}
                      >
                        {
                          paymentError ?
                            "Payment error"
                            :
                            loading ? (
                              <>
                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Processing...
                              </>
                            ) : paymentStage === "confirmed" ? (
                              "Complete Purchase"
                            ) : (
                              "Proceed to Payment"
                            )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Order summary */}
            <div className="lg:w-1/3">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Order Summary
                  </h2>
                </div>

                <div className="p-6">
                  <div className="mb-6">
                    {/* Warning for unavailable items */}
                    {checkoutItems.some((item: any) => item.isAvailable === false) && (
                      <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg flex items-start">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-600 dark:text-yellow-500 mt-0.5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        <p className="text-sm text-yellow-700 dark:text-yellow-400">
                          Some items are no longer available and have been removed from the total.
                        </p>
                      </div>
                    )}

                    <div className="max-h-64 overflow-y-auto">
                      {checkoutItems.map((item: any) => {
                        const isAvailable = item.isAvailable !== false;
                        return (
                          <div key={item._id.toString()} className={`flex items-center py-3 border-b border-gray-200 dark:border-gray-700 last:border-0 ${!isAvailable ? 'opacity-50 grayscale' : ''}`}>
                            <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-md border border-gray-200 dark:border-gray-700">
                              <Image
                                src={item.mainImage}
                                alt={item.name}
                                fill
                                className="object-cover"
                              />
                            </div>
                            <div className="ml-4 flex-1">
                              <h3 className={`text-sm font-medium ${!isAvailable ? 'text-gray-500 dark:text-gray-500 line-through' : 'text-gray-900 dark:text-white'}`}>
                                {item.name} {!isAvailable && <span className="no-underline ml-1 text-red-500 font-bold">(Unavailable)</span>}
                              </h3>
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                {item.quantity} x ${item.price.toFixed(2)}
                              </p>
                            </div>
                            <p className={`text-sm font-medium ${!isAvailable ? 'text-gray-400 dark:text-gray-600 line-through' : 'text-gray-900 dark:text-white'}`}>
                              ${(item.price * item.quantity).toFixed(2)}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Taxes</span>
                      <span className="text-gray-900 dark:text-white">${0}</span>
                    </div>
                    <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                      <div className="flex justify-between">
                        <span className="text-lg font-semibold text-gray-900 dark:text-white">Total</span>
                        <span className="text-lg font-semibold text-primary">
                          {totalPrice.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Shipping address (only in step 2) */}
              {step === 2 && (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden mt-6">
                  <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex justify-between items-center">
                      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Shipping Address
                      </h2>
                      <button
                        type="button"
                        onClick={() => setStep(1)}
                        className="text-sm text-primary hover:text-primary-dark"
                      >
                        Edit
                      </button>
                    </div>
                  </div>

                  <div className="p-6">
                    <p className="text-gray-900 dark:text-white font-medium">{address.fullName}</p>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">{address.street}</p>
                    <p className="text-gray-600 dark:text-gray-400">
                      {address.city}, {address.state} {address.zipCode}
                    </p>
                    <p className="text-gray-600 dark:text-gray-400">{address.country}</p>
                    <p className="text-gray-600 dark:text-gray-400 mt-2">{address.phone}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div >
      </div >
    </div >
  );
};

export default function CheckoutWrapper() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Checkout />
    </Suspense>
  )
}