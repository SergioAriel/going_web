'use client';

import React, { useState, useEffect } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { getUser, updateUser, deleteAddress } from '@/lib/ServerActions/users';
import { Address } from '@/interfaces';
import toast from 'react-hot-toast';
import AddressAutocomplete from '@/components/ui/AddressAutocomplete';

export default function AddressesPage() {
    const { user, authenticated } = usePrivy();
    const [addresses, setAddresses] = useState<Address[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    const [editingIndex, setEditingIndex] = useState<number | null>(null);

    // New Address Form State
    const [newAddress, setNewAddress] = useState({
        street: '',
        number: '',
        city: '',
        state: '',
        zipCode: '',
        country: '',
        fullName: '',
        lat: 0,
        lon: 0,
        placeId: ''
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

    const handleDeleteAddress = async (index: number) => {
        if (!user?.id) return;
        if (!confirm("Are you sure you want to delete this address?")) return;

        try {
            const result = await deleteAddress(user.id, index);
            if (result.success) {
                toast.success("Address deleted.");
                const newAddresses = addresses.filter((_, i) => i !== index);
                setAddresses(newAddresses);
            } else {
                toast.error(result.message || "Failed to delete.");
            }
        } catch (error) {
            console.error(error);
            toast.error("Error deleting address.");
        }
    };

    const handleEditAddress = (index: number) => {
        const addr = addresses[index];
        setNewAddress({
            street: addr.street,
            number: addr.number || '', // Handle potential undefined
            city: addr.city,
            state: addr.state || '',
            zipCode: addr.zipCode || '',
            country: addr.country,
            fullName: addr.fullName,
            lat: addr.lat || 0,
            lon: addr.lon || 0,
            placeId: '' // We don't have placeId stored typically, but that's okay for re-editing
        });
        setEditingIndex(index);
        // Scroll to form
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    };

    const handleCancelEdit = () => {
        setEditingIndex(null);
        setNewAddress({
            street: '',
            number: '',
            city: '',
            state: '',
            zipCode: '',
            country: '',
            fullName: '',
            lat: 0,
            lon: 0,
            placeId: ''
        });
    };

    const handleSubmitAddress = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user?.id) return;

        if (!newAddress.street || !newAddress.city) {
            toast.error("Please search and select a valid address.");
            return;
        }

        setIsSaving(true);
        try {
            const addressToAdd: Address = {
                ...newAddress,
                street: newAddress.street,
            };

            let updatedAddresses = [...addresses];

            if (editingIndex !== null) {
                // Edit existing
                updatedAddresses[editingIndex] = addressToAdd;
            } else {
                // Add new
                updatedAddresses.push(addressToAdd);
            }

            console.log("Saving addresses...", updatedAddresses);
            const result = await updateUser(user.id, { addresses: updatedAddresses });
            console.log("Update result:", result);

            if (result.status && result.user) {
                toast.success(editingIndex !== null ? "Address updated successfully!" : "Address added successfully!");
                // Update local state
                const dbUser = await getUser(user.id);
                if (dbUser && dbUser.addresses) {
                    setAddresses(dbUser.addresses);
                }

                handleCancelEdit(); // Reset form and state
            } else {
                toast.error(result.message || "Failed to save address.");
            }

        } catch (error) {
            console.error("Error saving address:", error);
            toast.error("An error occurred.");
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return <div className="p-8 text-center">Loading addresses...</div>;
    }

    return (
        <div className="max-w-4xl mx-auto p-6">
            <h1 className="text-3xl font-bold mb-8 text-gray-900">Manage Addresses</h1>

            {/* Address Management Section */}
            <div className="bg-white shadow rounded-lg p-6 mb-8">
                <h2 className="text-xl font-semibold mb-4 text-gray-800">Pickup Addresses (Warehouses)</h2>

                {/* List of Addresses */}
                {addresses.length > 0 ? (
                    <div className="grid gap-4 mb-8">
                        {addresses.map((addr, idx) => (
                            <div key={idx} className={`border rounded-md p-4 flex justify-between items-center ${editingIndex === idx ? 'border-primary ring-2 ring-primary bg-blue-50' : 'border-gray-200'}`}>
                                <div>
                                    <p className="font-bold text-gray-900">{addr.fullName}  {editingIndex === idx && <span className="text-xs text-primary font-normal ml-2">(Editing)</span>}</p>
                                    <p className="text-gray-600">{addr.street} {addr.number}, {addr.city}, {addr.state} {addr.zipCode}</p>
                                    <p className="text-xs text-gray-400 mt-1">
                                        Lat: {addr.lat?.toFixed(4)}, Lon: {addr.lon?.toFixed(4)}
                                        {addr.h3Index && <span className="ml-2 bg-green-100 text-green-800 px-2 py-0.5 rounded-full">H3 Indexed</span>}
                                    </p>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleEditAddress(idx)}
                                        className="text-gray-500 hover:text-black p-2 rounded hover:bg-gray-100"
                                        title="Edit Address"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                                        </svg>

                                    </button>
                                    <button
                                        onClick={() => handleDeleteAddress(idx)}
                                        className="text-red-500 hover:text-red-700 p-2 rounded hover:bg-red-50"
                                        title="Delete Address"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                                        </svg>

                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-gray-500 mb-6">No addresses found. Please add your first pickup location.</p>
                )}

                {/* Add/Edit Form */}
                <div className="border-t pt-6" id="address-form">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-medium">{editingIndex !== null ? 'Edit Location' : 'Add New Location'}</h3>
                        {editingIndex !== null && (
                            <button onClick={handleCancelEdit} className="text-sm text-gray-500 hover:text-gray-700 underline">
                                Cancel Edit
                            </button>
                        )}
                    </div>
                    <form onSubmit={handleSubmitAddress} className="grid grid-cols-1 md:grid-cols-2 gap-4" autoComplete="off">
                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-gray-700">Location Name (e.g. Main Warehouse)</label>
                            <input
                                type="text"
                                required
                                autoComplete="off"
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-black focus:ring-black sm:text-sm p-2 border"
                                value={newAddress.fullName}
                                onChange={e => setNewAddress({ ...newAddress, fullName: e.target.value })}
                                placeholder="e.g. Main Warehouse"
                            />
                        </div>

                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Search Address (Google)</label>
                            <AddressAutocomplete
                                onSelect={(data) => {
                                    setNewAddress(prev => ({
                                        ...prev,
                                        street: data.extracted?.street || data.address || '',
                                        number: data.extracted?.number || prev.number || '', // Use extracted number, or keep previous if missing
                                        city: data.extracted?.city || prev.city,
                                        state: data.extracted?.state || prev.state,
                                        zipCode: data.extracted?.zipCode || prev.zipCode,
                                        country: data.extracted?.country || prev.country,
                                        lat: data.lat,
                                        lon: data.lon,
                                        placeId: data.placeId
                                    }));
                                }}
                                placeholder="Start typing address..."
                                className="w-full"
                            />
                        </div>

                        <div className="col-span-1">
                            <label className="block text-sm font-medium text-gray-700">Street</label>
                            <input
                                type="text"
                                required
                                autoComplete="off"
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-black focus:ring-black sm:text-sm p-2 border bg-gray-50"
                                value={newAddress.street}
                                onChange={e => setNewAddress({ ...newAddress, street: e.target.value })}
                                placeholder="e.g. Av. Cabildo"
                                readOnly={!!newAddress.placeId}
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
                                autoComplete="off"
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
                                autoComplete="off"
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
                                autoComplete="off"
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
                                autoComplete="off"
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
                                {isSaving ? (editingIndex !== null ? 'Updating & Geocoding...' : 'Saving & Geocoding...') : (editingIndex !== null ? 'Update Address' : 'Add Address')}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
