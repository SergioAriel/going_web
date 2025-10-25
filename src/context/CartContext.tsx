"use client";

import { CartItem, Product } from "@/interfaces";
import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { useAlert } from "./AlertContext";

interface CartContextType {
  items: CartItem[];
  addToCart: (product: Product, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  getTotalItems: () => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const { handleAlert } = useAlert();
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    const storedItems = localStorage.getItem("cart");
    if (storedItems) {
      setItems(JSON.parse(storedItems));
    }
  }, []);

  // Helper function to update state and localStorage simultaneously
  const updateCart = (newItems: CartItem[]) => {
    setItems(newItems);
    localStorage.setItem("cart", JSON.stringify(newItems));
  };

  const addToCart = (product: Product, quantity: number) => {
    const existingItem = items.find(item => item._id === product._id);

    if (existingItem) {
      const newItems = items.map(item =>
        item._id === product._id
          ? { ...item, quantity: item.quantity + quantity }
          : item
      );
      updateCart(newItems);
    } else {
      const newItems = [...items, {
        _id: product._id.toString(),
        seller: product.seller,
        name: product.name,
        price: product.price,
        mainImage: product.mainImage,
        quantity,
        addressWallet: product.addressWallet,
        currency: product.currency,
        shippingType: product.shippingType,
        pickupAddress: product.pickupAddress, // UNIFIED
        isOffer: product.isOffer || false,
        offerPercentage: product.offerPercentage || 0,
      }];
      updateCart(newItems);
    }
    handleAlert({ message: `Added to cart: ${product.name}`, isError: false });
  };

  const removeFromCart = (productId: string) => {
    const newItems = items.filter(item => item._id !== productId);
    updateCart(newItems); // CORRECTED
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    const newItems = items.map(item =>
      item._id === productId ? { ...item, quantity } : item
    );
    updateCart(newItems);
  };

  const clearCart = () => {
    setItems([]);
    localStorage.removeItem("cart");
  };

  const getTotalItems = () => {
    return items.reduce((total, item) => total + item.quantity, 0);
  };

  return (
    <CartContext.Provider value={{
      items,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      getTotalItems,
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};