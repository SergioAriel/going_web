'use client';

import { useState } from 'react';
import { Address } from '@/interfaces';
import AddressAutocomplete from '@/components/ui/AddressAutocomplete';
import { resetShipment } from '@/lib/ServerActions/shipments';
import toast from 'react-hot-toast';

interface AddressCorrectionModalProps {
    shipmentId: string;
    currentAddress: Address;
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

const AddressCorrectionModal = ({ shipmentId, currentAddress, isOpen, onClose, onSuccess }: AddressCorrectionModalProps) => {
    const [isSaving, setIsSaving] = useState(false);
    const [newAddress, setNewAddress] = useState<Partial<Address>>({
        street: currentAddress.street || '',
        city: currentAddress.city || '',
        state: currentAddress.state || '',
        country: currentAddress.country || '',
        zipCode: currentAddress.zipCode || ''
    });

    if (!isOpen) return null;

    const handleSave = async () => {
        if (!newAddress.street || !newAddress.lat || !newAddress.lon) {
            toast.error("Please select a valid address from the list.");
            return;
        }

        setIsSaving(true);
        try {
            // Merge with existing address to keep name/phone if not changed
            const finalAddress: Address = {
                ...currentAddress,
                ...newAddress,
                lat: newAddress.lat,
                lon: newAddress.lon,
            } as Address;

            const result = await resetShipment(shipmentId, finalAddress);

            if (result.status) {
                toast.success("Address corrected! Shipment reset to Pending.");
                onSuccess();
                onClose();
            } else {
                toast.error(result.message || "Failed to update shipment.");
            }
        } catch (error) {
            console.error(error);
            toast.error("An unexpected error occurred.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-lg p-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Fix Delivery Address</h2>
                <p className="text-gray-500 text-sm mb-6">
                    Our system couldn't verify the address for this shipment. Please search and select the correct location ensuring it appears on the map.
                </p>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Search Address (Google Maps)
                        </label>
                        <AddressAutocomplete
                            onSelect={(data) => {
                                setNewAddress({
                                    street: data.extracted?.street || data.address,
                                    city: data.extracted?.city || '',
                                    state: data.extracted?.state || '',
                                    zipCode: data.extracted?.zipCode || '',
                                    country: data.extracted?.country || '',
                                    lat: data.lat,
                                    lon: data.lon
                                });
                            }}
                            defaultValue={`${currentAddress.street}, ${currentAddress.city}`}
                            placeholder="Start typing to search..."
                            className="w-full"
                        />
                    </div>

                    {/* Preview of Selected Data */}
                    {newAddress.lat && (
                        <div className="bg-green-50 p-3 rounded-md border border-green-200">
                            <p className="text-xs text-green-800 font-bold">✅ Valid Coordinates Found</p>
                            <p className="text-xs text-gray-600 mt-1">
                                Lat: {newAddress.lat.toFixed(6)}, Lon: {newAddress.lon?.toFixed(6)}
                            </p>
                            <p className="text-xs text-gray-600">
                                {newAddress.street}, {newAddress.city}
                            </p>
                        </div>
                    )}

                    <div className="flex justify-end space-x-3 mt-6">
                        <button
                            onClick={onClose}
                            disabled={isSaving}
                            className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={isSaving || !newAddress.lat}
                            className={`px-4 py-2 text-white rounded-md ${isSaving || !newAddress.lat ? 'bg-gray-400 cursor-not-allowed' : 'bg-primary hover:bg-primary-dark'
                                }`}
                        >
                            {isSaving ? 'Fixing...' : 'Save & Retry'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AddressCorrectionModal;
