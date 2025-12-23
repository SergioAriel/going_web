'use client';

import React, { useState, useEffect } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { getUser, updateUser } from '@/lib/ServerActions/users';
import { Address } from '@/interfaces';
import toast from 'react-hot-toast';

export default function BusinessProfilePage() {
    const { user, authenticated } = usePrivy();
    const [addresses, setAddresses] = useState<Address[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // New Address Form State
    const [newAddress, setNewAddress] = useState({
        street: '',
        number: '',
        city: '',
        state: '',
        zipCode: '',
        country: '',
        fullName: ''
    });

    useEffect(() => {
        const fetchUserData = async () => {
            if (user?.id) {
                const dbUser = await getUser(user.id);
                if (dbUser && dbUser.addresses) {
                    setAddresses(dbUser.addresses);
                }
            }
            setIsLoading(false);
        };
        if (authenticated) {
            fetchUserData();
        }
    }, [user?.id, authenticated]);

    const handleAddAddress = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user?.id) return;

        setIsSaving(true);
        try {
            // Construct the new address object
            // Note: We don't have lat/lon/h3 yet, the backend will handle that via ensureGeocodedAndIndexed
            const addressToAdd: Address = {
                ...newAddress,
                street: `${newAddress.street} ${newAddress.number}`, // Combine street and number
                lat: 0, // Placeholder
                lon: 0, // Placeholder
            };

            // Prepare the updated user object
            // We append the new address to the existing list
            const updatedAddresses = [...addresses, addressToAdd];

            console.log("Saving address...", addressToAdd);
            const result = await updateUser(user.id, { addresses: updatedAddresses });
            console.log("Update result:", result);

            if (result.status && result.user) {
                toast.success("Address added successfully!");
                // Update local state with the returned user data (which includes geocoded address)
                // We need to fetch the user again or use the result if it returns the full user
                // The updateUser action returns { status: true, user: result } where result is the mongo result
                // Ideally we should re-fetch or the action should return the updated document.
                // Let's re-fetch for safety to get the geocoded data.
                const dbUser = await getUser(user.id);
                if (dbUser && dbUser.addresses) {
                    setAddresses(dbUser.addresses);
                }

                // Reset form
                setNewAddress({
                    street: '',
                    number: '',
                    city: '',
                    state: '',
                    zipCode: '',
                    country: '',
                    fullName: ''
                });
            } else {
                toast.error(result.message || "Failed to add address.");
            }

        } catch (error) {
            console.error("Error adding address:", error);
            toast.error("An error occurred.");
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return <div className="p-8 text-center">Loading profile...</div>;
    }

    return (
        <div className="max-w-4xl mx-auto p-6">
            <h1 className="text-3xl font-bold mb-8 text-gray-900">Business Profile</h1>

            {/* Address Management Section */}
            <div className="bg-white shadow rounded-lg p-6 mb-8">
                <h2 className="text-xl font-semibold mb-4 text-gray-800">Pickup Addresses (Warehouses)</h2>

                {/* List of Addresses */}
                {addresses.length > 0 ? (
                    <div className="grid gap-4 mb-8">
                        {addresses.map((addr, idx) => (
                            <div key={idx} className="border border-gray-200 rounded-md p-4 flex justify-between items-center">
                                <div>
                                    <p className="font-bold text-gray-900">{addr.fullName}</p>
                                    <p className="text-gray-600">{addr.street}, {addr.city}, {addr.state} {addr.zipCode}</p>
                                    <p className="text-xs text-gray-400 mt-1">
                                        Lat: {addr.lat?.toFixed(4)}, Lon: {addr.lon?.toFixed(4)}
                                        {addr.h3Index && <span className="ml-2 bg-green-100 text-green-800 px-2 py-0.5 rounded-full">H3 Indexed</span>}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-gray-500 mb-6">No addresses found. Please add your first pickup location.</p>
                )}

                {/* Add New Address Form */}
                <div className="border-t pt-6">
                    <h3 className="text-lg font-medium mb-4">Add New Location</h3>
                    <form onSubmit={handleAddAddress} className="grid grid-cols-1 md:grid-cols-2 gap-4" autoComplete="off">
                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-gray-700">Location Name (e.g. Main Warehouse)</label>
                            <input
                                type="text"
                                required
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-black focus:ring-black sm:text-sm p-2 border"
                                value={newAddress.fullName}
                                onChange={e => setNewAddress({ ...newAddress, fullName: e.target.value })}
                                placeholder="e.g. Main Warehouse"
                            />
                        </div>

                        <div className="col-span-1">
                            <label className="block text-sm font-medium text-gray-700">Street</label>
                            <input
                                type="text"
                                required
                                autoComplete="off"
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-black focus:ring-black sm:text-sm p-2 border"
                                value={newAddress.street}
                                onChange={e => setNewAddress({ ...newAddress, street: e.target.value })}
                                placeholder="e.g. Av. Cabildo"
                            />
                        </div>
                        <div className="col-span-1">
                            <label className="block text-sm font-medium text-gray-700">Number</label>
                            <input
                                type="text"
                                required
                                autoComplete="off"
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-black focus:ring-black sm:text-sm p-2 border"
                                value={newAddress.number}
                                onChange={e => setNewAddress({ ...newAddress, number: e.target.value })}
                                placeholder="e.g. 1234"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">City</label>
                            <input
                                type="text"
                                required
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-black focus:ring-black sm:text-sm p-2 border"
                                value={newAddress.city}
                                onChange={e => setNewAddress({ ...newAddress, city: e.target.value })}
                                placeholder="e.g. Buenos Aires"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">State</label>
                            <input
                                type="text"
                                required
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-black focus:ring-black sm:text-sm p-2 border"
                                value={newAddress.state}
                                onChange={e => setNewAddress({ ...newAddress, state: e.target.value })}
                                placeholder="e.g. Buenos Aires"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Zip Code</label>
                            <input
                                type="text"
                                required
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-black focus:ring-black sm:text-sm p-2 border"
                                value={newAddress.zipCode}
                                onChange={e => setNewAddress({ ...newAddress, zipCode: e.target.value })}
                                placeholder="e.g. 1426"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Country</label>
                            <input
                                type="text"
                                required
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-black focus:ring-black sm:text-sm p-2 border"
                                value={newAddress.country}
                                onChange={e => setNewAddress({ ...newAddress, country: e.target.value })}
                                placeholder="e.g. Argentina"
                            />
                        </div>

                        <div className="col-span-2 mt-4">
                            <button
                                type="submit"
                                disabled={isSaving}
                                className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${isSaving ? 'bg-gray-400' : 'bg-black hover:bg-gray-800'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black`}
                            >
                                {isSaving ? 'Saving & Geocoding...' : 'Add Address'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
