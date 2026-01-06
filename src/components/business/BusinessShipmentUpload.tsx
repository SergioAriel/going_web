import React, { useState, useEffect } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { toast } from 'react-hot-toast';
import Papa from 'papaparse';
import { getGeocodedAddress, calculateRealCosts, createShipments } from '@/lib/ServerActions/shipments';
import { getSavedAddresses, saveAddress } from '@/lib/ServerActions/users';
import BusinessWallet from './BusinessWallet';
import AddressAutocomplete from '@/components/ui/AddressAutocomplete';

interface ShipmentRow {
    pickupAddress: string; // Display string
    deliveryAddress: string;
    weight: number; // kg
    volume: number; // m3
    distanceKm?: number; // Calculated later (mocked for now)
    estimatedCost?: number;
    // We store the full pickup address object for the backend
    pickupAddressObj?: any; // Address
    recipientName?: string;
    recipientEmail?: string;
    deliveryLat?: number;
    deliveryLon?: number;
    deliveryAddressObj?: any; // GeocodedAddress
    description?: string; // Content description (Legacy/Simple)
    items?: { name: string; quantity: number; weight: number; dimensions: { length: number; width: number; height: number } }[]; // Detailed items
}

export default function BusinessShipmentUpload() {
    const { user } = usePrivy();
    const [shipments, setShipments] = useState<ShipmentRow[]>([]);
    const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [totalCost, setTotalCost] = useState(0);

    // Saved Addresses
    const [savedAddresses, setSavedAddresses] = useState<any[]>([]);
    const [selectedPickupAddress, setSelectedPickupAddress] = useState<string>('');

    // Manual Entry State
    const [manualEntry, setManualEntry] = useState({
        street: '',
        number: '',
        city: '',
        state: '',
        zipCode: '',
        country: '',
        weight: 0,
        recipientName: '',
        recipientEmail: '',
        volume: 0,
        description: '',
        lat: 0,
        lon: 0,
        placeId: '',
        items: [] as { name: string; quantity: number; weight: number; dimensions: { length: number; width: number; height: number } }[]
    });

    const [newItem, setNewItem] = useState({ name: '', quantity: 1, weight: 1, length: 10, width: 10, height: 10 });
    const [isAddingManual, setIsAddingManual] = useState(false);
    const [isCalculating, setIsCalculating] = useState(false);
    const [isRealCost, setIsRealCost] = useState(false);

    // Editing State
    const [editingRowIndex, setEditingRowIndex] = useState<number | null>(null);
    const [editFormData, setEditFormData] = useState<Partial<ShipmentRow>>({});

    useEffect(() => {
        if (user?.id) {
            loadSavedAddresses();
        }
    }, [user?.id]);

    async function loadSavedAddresses() {
        if (!user?.id) return;
        try {
            const addrs = await getSavedAddresses(user.id);
            setSavedAddresses(addrs);
            if (addrs.length > 0) {
                // Default to first address index
                setSelectedPickupAddress("0");
            }
        } catch (error) {
            console.error("Failed to load addresses", error);
        }
    }

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        Papa.parse(file, {
            header: true,
            complete: async (results) => {
                const parsedShipments: ShipmentRow[] = [];

                // We need the pickup address object
                const index = parseInt(selectedPickupAddress);
                const pickupAddrObj = savedAddresses[index];

                if (!pickupAddrObj) {
                    toast.error("Please select a pickup address first.");
                    return;
                }

                const pickupStr = `${pickupAddrObj.street} ${pickupAddrObj.number}, ${pickupAddrObj.city}`;

                for (const row of results.data as any[]) {
                    if (!row['Address'] || !row['City']) continue;

                    const deliveryStr = `${row['Address']} ${row['Number'] || ''}, ${row['City']}, ${row['State'] || ''}, ${row['Country'] || ''}`;
                    const weight = parseFloat(row['Weight']) || 1;
                    const volume = parseFloat(row['Volume']) || 0.001;
                    const description = row['Description'] || row['Content'] || row['Desc'] || '';
                    const recipientName = row['Recipient Name'] || row['Recipient'] || row['Nombre'] || row['Destinatario'] || 'Valued Customer';
                    const recipientEmail = row['Recipient Email'] || row['Email'] || row['Correo'] || '';

                    parsedShipments.push({
                        pickupAddress: pickupStr,
                        pickupAddressObj: pickupAddrObj,
                        deliveryAddress: deliveryStr,
                        weight,
                        volume,
                        recipientName,
                        recipientEmail,
                        description
                    });
                }
                setShipments([...shipments, ...parsedShipments]);
                toast.success(`Loaded ${parsedShipments.length} shipments from CSV`);
            },
            error: (err) => {
                toast.error("Failed to parse CSV");
                // console.error(err);
            }
        });
    };

    const handleAddManualShipment = async () => {
        const index = parseInt(selectedPickupAddress);
        const pickupAddrObj = savedAddresses[index];

        if (!pickupAddrObj) {
            toast.error("Please select a pickup address first.");
            return;
        }

        if (!manualEntry.street || !manualEntry.city) {
            toast.error("Please fill in at least Street and City.");
            return;
        }

        const fullAddressString = `${manualEntry.street} ${manualEntry.number}, ${manualEntry.city}, ${manualEntry.state}, ${manualEntry.country}`;

        // Validation: If weight > 5kg, warn if volume is low (but don't block)
        if (manualEntry.weight > 5 && manualEntry.volume <= 0.001) {
            toast('Warning: Shipment is heavy (>5kg) but has very low volume. Please verify dimensions.', {
                icon: '⚠️',
            });
        }

        setIsAddingManual(true);
        try {
            // Geocode delivery address - Use existing if available from Autocomplete
            let geoResult: any = null;

            if (manualEntry.lat && manualEntry.lon) {
                geoResult = {
                    lat: manualEntry.lat,
                    lon: manualEntry.lon,
                    street: manualEntry.street,
                    number: manualEntry.number,
                    city: manualEntry.city,
                    state: manualEntry.state,
                    country: manualEntry.country,
                    zipCode: manualEntry.zipCode,
                    formattedAddress: fullAddressString
                };
            } else {
                geoResult = await getGeocodedAddress(fullAddressString, manualEntry.recipientName);
            }

            if (!geoResult) {
                toast.error("Could not geocode delivery address. Please check details.");
                setIsAddingManual(false);
                return;
            }

            const pickupStr = `${pickupAddrObj.street} ${pickupAddrObj.number}, ${pickupAddrObj.city}`;

            const newShipment: ShipmentRow = {
                pickupAddress: pickupStr,
                pickupAddressObj: pickupAddrObj,
                deliveryAddress: fullAddressString,
                weight: manualEntry.weight,
                volume: manualEntry.volume,
                recipientName: manualEntry.recipientName || 'Valued Customer',
                recipientEmail: manualEntry.recipientEmail,
                deliveryLat: geoResult.lat,
                deliveryLon: geoResult.lon,
                deliveryAddressObj: geoResult,
                description: manualEntry.description,
                items: manualEntry.items
            };

            setShipments([...shipments, newShipment]);
            toast.success("Manual shipment added.");

            // Reset manual entry (keep city/country if desired, but clearing for now)
            setManualEntry({
                street: '',
                number: '',
                city: '',
                state: '',
                zipCode: '',
                country: '',
                weight: 0,
                recipientName: '',
                recipientEmail: '',
                volume: 0,
                description: '',
                lat: 0,
                lon: 0,
                placeId: '',
                items: []
            });
        } catch (error) {
            console.error(error);
            toast.error("Error adding manual shipment.");
        } finally {
            setIsAddingManual(false);
        }
    };

    const handleCalculateCosts = async () => {
        if (shipments.length === 0) return;
        setIsCalculating(true);
        try {
            const updatedShipments = [...shipments];

            // 1. Ensure all shipments have geocoded addresses
            for (let i = 0; i < updatedShipments.length; i++) {
                const s = updatedShipments[i];
                if (!s.deliveryLat || !s.deliveryLon) {
                    const geo = await getGeocodedAddress(s.deliveryAddress);
                    if (geo) {
                        s.deliveryLat = geo.lat;
                        s.deliveryLon = geo.lon;
                        s.deliveryAddressObj = geo;
                    }
                    // Respect Nominatim rate limit (1 req/sec)
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
            }

            // 2. Filter valid shipments for calculation
            const validShipments = updatedShipments.filter(s => s.deliveryLat && s.deliveryLon && s.pickupAddressObj);

            if (validShipments.length > 0) {
                // 3. Call Server Action with the batch
                const result = await calculateRealCosts(validShipments);

                if (result.success && result.shipments) {
                    // 4. Merge results back into updatedShipments
                    // We assume order is preserved or we match by some ID (but we don't have IDs yet).
                    // Since we passed validShipments, we can iterate and match.
                    // Actually, calculateRealCosts returns the updated objects.
                    // Let's map them back.

                    // A safer way is to update the original array based on index if possible, 
                    // but since we filtered, indices might shift.
                    // Let's just replace the valid ones in the main array.

                    // For simplicity in this demo, since we process all valid ones:
                    // We can just use the result.shipments if we sent ALL of them.
                    // But if some failed geocoding, they won't be in validShipments.

                    // Let's iterate through updatedShipments and find the matching result if it was valid.
                    // We can match by reference since we modified the objects in step 1? 
                    // No, server action returns new objects.

                    // We can match by description + address? Risky.
                    // Let's just assign the results back to the corresponding indices if we can track them.

                    // Better approach:
                    // The server action returns the array of processed shipments.
                    // We can just iterate our `updatedShipments` and if it was valid, we take the next result from the response.

                    let resultIndex = 0;
                    for (let i = 0; i < updatedShipments.length; i++) {
                        const s = updatedShipments[i];
                        if (s.deliveryLat && s.deliveryLon && s.pickupAddressObj) {
                            if (resultIndex < result.shipments.length) {
                                const calculated = result.shipments[resultIndex];
                                updatedShipments[i] = {
                                    ...s,
                                    distanceKm: calculated.distanceKm,
                                    estimatedCost: calculated.estimatedCost,
                                    // isRealCost: true // handled by state
                                };
                                resultIndex++;
                            }
                        } else {
                            // Fallback for invalid ones
                            updatedShipments[i].estimatedCost = 10;
                        }
                    }

                    setTotalCost(result.totalCost || 0);
                    setIsRealCost(true);
                    toast.success("Costs calculated successfully.");
                } else {
                    toast.error("Failed to calculate costs from server.");
                }
            } else {
                toast.error("No valid shipments to calculate.");
            }

            setShipments(updatedShipments);

        } catch (error) {
            console.error(error);
            toast.error("Failed to calculate costs.");
        } finally {
            setIsCalculating(false);
        }
    };

    const handleSelectRow = (index: number) => {
        if (selectedIndices.includes(index)) {
            setSelectedIndices(selectedIndices.filter(i => i !== index));
        } else {
            setSelectedIndices([...selectedIndices, index]);
        }
    };

    const handleDeleteSelected = () => {
        const newShipments = shipments.filter((_, idx) => !selectedIndices.includes(idx));
        setShipments(newShipments);
        setSelectedIndices([]);
        // Recalculate total if needed, or just reset
        setTotalCost(0);
        setIsRealCost(false);
    };

    // Editing Functions
    const startEditing = (index: number) => {
        setEditingRowIndex(index);
        setEditFormData({ ...shipments[index] });
    };

    const cancelEditing = () => {
        setEditingRowIndex(null);
        setEditFormData({});
    };

    const saveEditing = async () => {
        if (editingRowIndex === null) return;

        const updatedShipments = [...shipments];
        const oldShipment = updatedShipments[editingRowIndex];
        const newShipment = { ...oldShipment, ...editFormData };

        // If address changed, we might need to re-geocode. 
        // For simplicity, if address string changed, we try to geocode.
        if (newShipment.deliveryAddress !== oldShipment.deliveryAddress) {
            const geo = await getGeocodedAddress(newShipment.deliveryAddress!);
            if (geo) {
                newShipment.deliveryLat = geo.lat;
                newShipment.deliveryLon = geo.lon;
                newShipment.deliveryAddressObj = geo;
            }
        }

        updatedShipments[editingRowIndex] = newShipment as ShipmentRow;
        setShipments(updatedShipments);
        setEditingRowIndex(null);
        setEditFormData({});

        // Invalidate costs
        setIsRealCost(false);
    };

    // Success State
    const [createdShipmentsDetails, setCreatedShipmentsDetails] = useState<any[] | null>(null);

    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">Bulk Shipment Upload</h2>

            {createdShipmentsDetails ? (
                <div className="text-center py-8">
                    <div className="mb-6 bg-green-100 text-green-800 p-4 rounded-xl inline-block">
                        <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <h3 className="text-xl font-bold">¡Envíos Creados con Éxito!</h3>
                        <p>Hemos enviado un correo a los destinatarios con su Código QR.</p>
                    </div>

                    <div className="max-w-xl mx-auto space-y-4 text-left">
                        <h4 className="font-semibold text-gray-700 mb-4">Compartir Seguimiento por WhatsApp:</h4>
                        {createdShipmentsDetails.map((shipment, idx) => {
                            const text = `Hola ${shipment.recipientName}, te envío el link de seguimiento de tu pedido. Aquí podrás ver tu Código QR para recibirlo: ${shipment.trackingUrl}`;
                            const waLink = `https://wa.me/?text=${encodeURIComponent(text)}`;

                            return (
                                <div key={idx} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition">
                                    <div>
                                        <p className="font-bold text-gray-800">{shipment.recipientName}</p>
                                        <p className="text-sm text-gray-500">{shipment.recipientEmail}</p>
                                    </div>
                                    <a
                                        href={waLink}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-bold transition"
                                    >
                                        <span>Compartir WP</span>
                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" /></svg>
                                    </a>
                                </div>
                            );
                        })}
                    </div>

                    <button
                        onClick={() => {
                            setCreatedShipmentsDetails(null);
                            // Reset lists
                            setShipments([]);
                            setSavedAddresses([]);
                        }}
                        className="mt-8 text-gray-500 hover:text-black underline"
                    >
                        Crear nuevos envíos
                    </button>
                </div>
            ) : (
                <>
                    {/* Pickup Address Selection */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Select Pickup Address</label>
                        {savedAddresses.length > 0 ? (
                            <select
                                value={selectedPickupAddress}
                                onChange={(e) => setSelectedPickupAddress(e.target.value)}
                                className="w-full border border-gray-300 rounded-md p-2"
                            >
                                {savedAddresses.map((addr, idx) => (
                                    <option key={idx} value={idx}>
                                        {addr.fullName} ({addr.street}, {addr.city})
                                    </option>
                                ))}
                            </select>
                        ) : (
                            <div className="text-sm text-red-500">
                                No saved addresses. Go to your profile to add one.
                            </div>
                        )}
                    </div>

                    {/* Manual Entry Section */}
                    <div className="mb-8 p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex justify-between items-center mb-3">
                            <h3 className="text-sm font-bold text-gray-700">Add Manual Shipment</h3>
                            <button
                                onClick={handleAddManualShipment}
                                disabled={isAddingManual}
                                className="bg-black text-white px-4 py-2 rounded-md text-sm font-bold hover:bg-gray-800 disabled:opacity-50"
                            >
                                {isAddingManual ? 'Adding...' : '+ Add'}
                            </button>
                        </div>
                        {/* ... existing manual entry fields ... */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                            <div className="md:col-span-4 grid grid-cols-1 md:grid-cols-4 gap-2 mb-2">
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">Recipient Name</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Juan Perez"
                                        value={manualEntry.recipientName}
                                        onChange={(e) => setManualEntry({ ...manualEntry, recipientName: e.target.value })}
                                        className="w-full border border-gray-300 rounded-md p-2 text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">Recipient Email (for QR)</label>
                                    <input
                                        type="email"
                                        placeholder="e.g. juan@email.com"
                                        value={manualEntry.recipientEmail}
                                        onChange={(e) => setManualEntry({ ...manualEntry, recipientEmail: e.target.value })}
                                        className="w-full border border-gray-300 rounded-md p-2 text-sm"
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-medium text-gray-500 mb-1">Search Address (Google)</label>
                                    <AddressAutocomplete
                                        onSelect={(data) => {
                                            setManualEntry(prev => ({
                                                ...prev,
                                                street: data.extracted?.street || data.address,
                                                city: data.extracted?.city || prev.city,
                                                state: data.extracted?.state || prev.state,
                                                zipCode: data.extracted?.zipCode || prev.zipCode,
                                                country: data.extracted?.country || prev.country,
                                                lat: data.lat,
                                                lon: data.lon,
                                                placeId: data.placeId
                                            }));
                                        }}
                                        placeholder="Search to auto-fill..."
                                        className="w-full"
                                    />
                                </div>
                                {/* Hidden Inputs preserved */}
                                <div className="md:col-span-2 hidden"></div>

                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">Street</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Av. Santa Fe"
                                        value={manualEntry.street}
                                        onChange={(e) => setManualEntry({ ...manualEntry, street: e.target.value })}
                                        className="w-full border border-gray-300 rounded-md p-2 text-sm bg-gray-100"
                                        readOnly={!!manualEntry.placeId}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">Number</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. 1234"
                                        value={manualEntry.number}
                                        onChange={(e) => setManualEntry({ ...manualEntry, number: e.target.value })}
                                        className="w-full border border-gray-300 rounded-md p-2 text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">Zip Code</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. 1425"
                                        value={manualEntry.zipCode}
                                        onChange={(e) => setManualEntry({ ...manualEntry, zipCode: e.target.value })}
                                        className="w-full border border-gray-300 rounded-md p-2 text-sm"
                                    />
                                </div>
                            </div>
                            <div className="md:col-span-4 grid grid-cols-1 md:grid-cols-3 gap-2 mb-2">
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">City</label>
                                    <input
                                        type="text"
                                        value={manualEntry.city}
                                        onChange={(e) => setManualEntry({ ...manualEntry, city: e.target.value })}
                                        className="w-full border border-gray-300 rounded-md p-2 text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">State / Province</label>
                                    <input
                                        type="text"
                                        value={manualEntry.state}
                                        onChange={(e) => setManualEntry({ ...manualEntry, state: e.target.value })}
                                        className="w-full border border-gray-300 rounded-md p-2 text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">Country</label>
                                    <input
                                        type="text"
                                        value={manualEntry.country}
                                        onChange={(e) => setManualEntry({ ...manualEntry, country: e.target.value })}
                                        className="w-full border border-gray-300 rounded-md p-2 text-sm"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Product List Section */}
                        <div className="mt-4 border-t border-gray-200 pt-4">
                            <label className="block text-xs font-medium text-gray-500 mb-2">Product List</label>

                            <div className="bg-gray-50 p-3 rounded-md border border-gray-200 mb-2">
                                <div className="flex gap-2 mb-2">
                                    <div className="flex-1">
                                        <label className="block text-xs font-medium text-gray-500 mb-1">Product Name</label>
                                        <input
                                            type="text"
                                            placeholder="e.g. Shirt"
                                            value={newItem.name}
                                            onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                                            className="w-full border border-gray-300 rounded-md p-2 text-sm"
                                        />
                                    </div>
                                    <div className="w-24">
                                        <label className="block text-xs font-medium text-gray-500 mb-1">Quantity</label>
                                        <input
                                            type="number"
                                            placeholder="Qty."
                                            value={newItem.quantity}
                                            onChange={(e) => setNewItem({ ...newItem, quantity: parseInt(e.target.value) || 1 })}
                                            className="w-full border border-gray-300 rounded-md p-2 text-sm"
                                        />
                                    </div>
                                    <div className="w-24">
                                        <label className="block text-xs font-medium text-gray-500 mb-1">Weight (kg)</label>
                                        <input
                                            type="number"
                                            placeholder="Kg"
                                            value={newItem.weight}
                                            onChange={(e) => setNewItem({ ...newItem, weight: parseFloat(e.target.value) || 0 })}
                                            className="w-full border border-gray-300 rounded-md p-2 text-sm"
                                        />
                                    </div>
                                </div>
                                <div className="flex gap-2 items-end">
                                    <div className="flex-1 grid grid-cols-3 gap-2">
                                        <div>
                                            <label className="block text-xs font-medium text-gray-500 mb-1">Length (cm)</label>
                                            <input
                                                type="number"
                                                placeholder="L"
                                                value={newItem.length}
                                                onChange={(e) => setNewItem({ ...newItem, length: parseFloat(e.target.value) || 0 })}
                                                className="w-full border border-gray-300 rounded-md p-2 text-sm"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-500 mb-1">Width (cm)</label>
                                            <input
                                                type="number"
                                                placeholder="W"
                                                value={newItem.width}
                                                onChange={(e) => setNewItem({ ...newItem, width: parseFloat(e.target.value) || 0 })}
                                                className="w-full border border-gray-300 rounded-md p-2 text-sm"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-500 mb-1">Height (cm)</label>
                                            <input
                                                type="number"
                                                placeholder="H"
                                                value={newItem.height}
                                                onChange={(e) => setNewItem({ ...newItem, height: parseFloat(e.target.value) || 0 })}
                                                className="w-full border border-gray-300 rounded-md p-2 text-sm"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-end mt-3">
                                    <button
                                        onClick={() => {
                                            if (newItem.name) {
                                                const itemVolume = (newItem.length * newItem.width * newItem.height) / 1000000; // cm3 to m3
                                                const totalItemVolume = itemVolume * newItem.quantity;
                                                const totalItemWeight = newItem.weight * newItem.quantity;

                                                setManualEntry({
                                                    ...manualEntry,
                                                    items: [...manualEntry.items, {
                                                        name: newItem.name,
                                                        quantity: newItem.quantity,
                                                        weight: newItem.weight,
                                                        dimensions: { length: newItem.length, width: newItem.width, height: newItem.height }
                                                    }],
                                                    volume: manualEntry.volume + totalItemVolume,
                                                    weight: manualEntry.weight + totalItemWeight
                                                });
                                                setNewItem({ name: '', quantity: 1, weight: 1, length: 10, width: 10, height: 10 });
                                            }
                                        }}
                                        className="bg-gray-900 text-white px-6 py-2 rounded-full text-sm font-bold hover:bg-black shadow-md transition-all transform hover:scale-105"
                                    >
                                        + Add Product
                                    </button>
                                </div>
                                <div className="mt-2 text-xs text-amber-600 bg-amber-50 p-2 rounded border border-amber-200">
                                    ⚠️ Warning: Items over 5kg must have accurate dimensions specified to avoid sanctions.
                                </div>
                            </div>

                            {/* List of added items */}
                            {manualEntry.items.length > 0 && (
                                <div className="bg-gray-100 p-2 rounded-md space-y-1">
                                    {manualEntry.items.map((item, idx) => (
                                        <div key={idx} className="flex justify-between text-sm">
                                            <span>{item.quantity}x {item.name} ({item.weight}kg, {item.dimensions.length}x{item.dimensions.width}x{item.dimensions.height} cm)</span>
                                            <button
                                                onClick={() => {
                                                    const newItems = [...manualEntry.items];
                                                    const removedItem = newItems.splice(idx, 1)[0];
                                                    const itemVolume = (removedItem.dimensions.length * removedItem.dimensions.width * removedItem.dimensions.height) / 1000000;
                                                    const totalItemVolume = itemVolume * removedItem.quantity;
                                                    const totalItemWeight = removedItem.weight * removedItem.quantity;

                                                    setManualEntry({
                                                        ...manualEntry,
                                                        items: newItems,
                                                        volume: Math.max(0.001, manualEntry.volume - totalItemVolume),
                                                        weight: Math.max(0, manualEntry.weight - totalItemWeight)
                                                    });
                                                }}
                                                className="text-red-500 text-xs hover:underline"
                                            >
                                                (x)
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Description Input (Always visible) */}
                            <div className="mt-2">
                                <input
                                    type="text"
                                    placeholder="General description (e.g. Mixed Box)"
                                    value={manualEntry.description}
                                    onChange={(e) => setManualEntry({ ...manualEntry, description: e.target.value })}
                                    className="w-full border border-gray-300 rounded-md p-2 text-sm"
                                />
                            </div>
                        </div>
                    </div>

                    {/* CSV Upload Section */}
                    <div className="mb-8 p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <h3 className="text-sm font-bold text-gray-700 mb-2">Or Upload CSV</h3>
                        <input
                            type="file"
                            accept=".csv"
                            onChange={handleFileUpload}
                            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-black file:text-white hover:file:bg-gray-800"
                        />
                        <p className="text-xs text-gray-500 mt-2">
                            Format: Address, Number, City, State, Country, Weight, Volume, Description, Recipient Name
                        </p>
                        <div className="mt-2 text-xs text-gray-400">
                            <p>Supported Columns:</p>
                            <ul className="list-disc pl-4">
                                <li><span className="font-semibold text-gray-700">Address</span> (Required)</li>
                                <li><span className="font-semibold text-gray-700">City</span> (Required)</li>
                                <li><span className="font-semibold text-gray-700">Recipient Name</span> (Optional, defaults to "Valued Customer")</li>
                                <li>Volume, Description (Optional)</li>
                            </ul>
                        </div>
                    </div>

                    {/* Shipments Table */}
                    {
                        shipments.length > 0 && (
                            <div>
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-lg font-bold">Shipments ({shipments.length})</h3>
                                    <div className="flex gap-2">
                                        {selectedIndices.length > 0 && (
                                            <button
                                                onClick={handleDeleteSelected}
                                                className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600"
                                            >
                                                Delete Selected ({selectedIndices.length})
                                            </button>
                                        )}
                                        <button
                                            onClick={handleCalculateCosts}
                                            disabled={isCalculating}
                                            className="bg-green-600 text-white px-4 py-2 rounded text-sm font-bold hover:bg-green-700 disabled:opacity-50"
                                        >
                                            {isCalculating ? 'Calculating...' : 'Calculate Costs'}
                                        </button>
                                    </div>
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-4 py-3 text-left">
                                                    <input
                                                        type="checkbox"
                                                        onChange={(e) => {
                                                            if (e.target.checked) {
                                                                setSelectedIndices(shipments.map((_, i) => i));
                                                            } else {
                                                                setSelectedIndices([]);
                                                            }
                                                        }}
                                                        checked={shipments.length > 0 && selectedIndices.length === shipments.length}
                                                        className="rounded border-gray-300 text-black focus:ring-black"
                                                    />
                                                </th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Origin</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Destination</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Weight / Vol</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Distance</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    {isRealCost ? "Final Cost" : "Est. Cost"}
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {shipments.map((s, idx) => {
                                                return (
                                                    <React.Fragment key={idx}>
                                                        <tr className={editingRowIndex === idx ? "bg-blue-50" : selectedIndices.includes(idx) ? "bg-gray-50" : ""}>
                                                            <td className="px-4 py-4 whitespace-nowrap">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={selectedIndices.includes(idx)}
                                                                    onChange={() => handleSelectRow(idx)}
                                                                    className="rounded border-gray-300 text-black focus:ring-black"
                                                                />
                                                            </td>
                                                            <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                                                                {editingRowIndex === idx ? (
                                                                    <div className="flex gap-2">
                                                                        <button onClick={saveEditing} className="text-green-600 hover:text-green-900">💾</button>
                                                                        <button onClick={cancelEditing} className="text-gray-600 hover:text-gray-900">❌</button>
                                                                    </div>
                                                                ) : (
                                                                    <button onClick={() => startEditing(idx)} className="text-indigo-600 hover:text-indigo-900">
                                                                        ✏️
                                                                    </button>
                                                                )}
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{s.pickupAddress}</td>

                                                            {/* Render Normal Row or Edit Form */}
                                                            {editingRowIndex === idx ? (
                                                                <>
                                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                                        <input
                                                                            className="border rounded p-1 w-full"
                                                                            value={editFormData.deliveryAddress || ''}
                                                                            onChange={e => setEditFormData({ ...editFormData, deliveryAddress: e.target.value })}
                                                                        />
                                                                    </td>
                                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                                        <input
                                                                            className="border rounded p-1 w-full"
                                                                            value={editFormData.description || ''}
                                                                            onChange={e => setEditFormData({ ...editFormData, description: e.target.value })}
                                                                        />
                                                                    </td>
                                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                                        <div className="flex flex-col gap-1">
                                                                            <input
                                                                                type="number"
                                                                                placeholder="Kg"
                                                                                className="border rounded p-1 w-20"
                                                                                value={editFormData.weight || 0}
                                                                                onChange={e => {
                                                                                    const val = parseFloat(e.target.value);
                                                                                    setEditFormData({ ...editFormData, weight: isNaN(val) ? 0 : val });
                                                                                }}
                                                                            />
                                                                            <input
                                                                                type="number"
                                                                                placeholder="m3"
                                                                                className="border rounded p-1 w-20"
                                                                                value={editFormData.volume || 0}
                                                                                onChange={e => {
                                                                                    const val = parseFloat(e.target.value);
                                                                                    setEditFormData({ ...editFormData, volume: isNaN(val) ? 0 : val });
                                                                                }}
                                                                            />
                                                                        </div>
                                                                    </td>
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{s.deliveryAddress}</td>
                                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{s.description || '-'}</td>
                                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                                        <div className="flex flex-col">
                                                                            <span>{s.weight} kg</span>
                                                                            <span className="text-xs text-gray-400">{s.volume} m3</span>
                                                                        </div>
                                                                    </td>
                                                                </>
                                                            )}

                                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                                {s.distanceKm} km {isRealCost ? '(Real)' : '(Est.)'}
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-green-600">${s.estimatedCost?.toFixed(2)}</td>
                                                        </tr>
                                                    </React.Fragment>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>

                                <div className="mt-6 flex justify-between items-center bg-gray-100 p-4 rounded-lg">
                                    <span className="text-xl font-bold text-gray-800">Total to Pay:</span>
                                    <div className="text-right">
                                        <span className="text-2xl font-bold text-green-600 block">${totalCost.toFixed(2)} USD</span>
                                        {!isRealCost && <span className="text-xs text-gray-500">(Estimated)</span>}
                                    </div>
                                </div>

                                {isRealCost ? (
                                    <BusinessWallet
                                        totalCost={totalCost}
                                        shipmentsData={shipments}
                                        pickupAddress={savedAddresses[parseInt(selectedPickupAddress)]}
                                        onPaymentSuccess={(createdDetails) => {
                                            toast.success("Payment Successful! Creating shipments...");
                                            if (createdDetails) {
                                                setCreatedShipmentsDetails(createdDetails);
                                            }
                                            setTotalCost(0);
                                            setIsRealCost(false);
                                        }}
                                    />
                                ) : (
                                    <div className="mt-6 bg-yellow-50 border border-yellow-200 p-4 rounded-lg text-center">
                                        <p className="text-yellow-800 font-semibold">
                                            Please click "Calculate Costs" to verify addresses and generate coordinates before paying.
                                        </p>
                                    </div>
                                )}
                            </div>
                        )
                    }
                </>
            )}
        </div >
    );
}
