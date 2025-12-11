// frontend/client/src/pages/VehiclePage.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { vehicleService, Vehicle, CreateVehicleDto, UpdateVehicleDto, Driver, Route } from '../services/vehicleService';
import { gedimasService, Gedimas } from '../services/gedimasService';

const VehiclePage: React.FC = () => {
    const { user, signOut } = useAuth();
    const navigate = useNavigate();

    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [drivers, setDrivers] = useState<Driver[]>([]);
    const [routes, setRoutes] = useState<Route[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
    const [formData, setFormData] = useState({
        valstybiniaiNum: '',
        rida: 0,
        vietuSk: 0,
        kuroTipas: 1,
        fkVairuotojasIdNaudotojas: null as number | null,
        fkMarsrutasNumeris: null as number | null
    });
    const [formLoading, setFormLoading] = useState(false);

    // Malfunctions tab state (admin)
    const [activeTabVehicle, setActiveTabVehicle] = useState<string | null>(null);
    const [vehicleGedimai, setVehicleGedimai] = useState<Record<string, Gedimas[]>>({});
    const [malTab, setMalTab] = useState<'unresolved'|'resolved'>('unresolved');

    const kuroTipasLabels: { [key: number]: string } = {
        1: 'Benzinas',
        2: 'LPG',
        3: 'Dyzelinas',
        4: 'Elektra'
    };

    const handleSignOut = () => {
        signOut();
        navigate('/login');
    };

    // Fetch vehicles from API
    const fetchVehicles = async (withLoading: boolean = true) => {
        try {
            if (withLoading) setLoading(true);
            setError(null);
            const data = await vehicleService.getAllVehicles(user?.role, user?.idNaudotojas);
            setVehicles(data);

            if (user?.role === 'admin') {
                const entries: Record<string, Gedimas[]> = {};
                for (const v of data) {
                    try {
                        const g = await gedimasService.getVehicleGedimai(v.valstybiniaiNum);
                        entries[v.valstybiniaiNum] = g;
                    } catch {
                        entries[v.valstybiniaiNum] = [];
                    }
                }
                setVehicleGedimai(entries);
            }
        } catch (err) {
            console.error('Error fetching vehicles:', err);
            setError('Nepavyko gauti duomenų iš serverio');
        } finally {
            if (withLoading) setLoading(false);
        }
    };

    // Resolve malfunction (admin action)
    const handleResolveGedimas = async (id: number, valstybiniaiNum: string) => {
        try {
            await gedimasService.resolveGedimas(id);
            const updated = await gedimasService.getVehicleGedimai(valstybiniaiNum);
            setVehicleGedimai(prev => ({ ...prev, [valstybiniaiNum]: updated }));
        } catch (err) {
            console.error('Resolve failed:', err);
            alert('Nepavyko pažymėti gedimo kaip sutvarkyto');
        }
    };

    const loadDropdowns = async () => {
        try {
            console.log('loadDropdowns started');
            const [driversData, routesData] = await Promise.all([
                vehicleService.getDrivers().catch(err => {
                    console.error('getDrivers failed:', err);
                    return [];
                }),
                vehicleService.getRoutes().catch(err => {
                    console.error('getRoutes failed:', err);
                    return [];
                })
            ]);
            // Defensive: ensure array
            const safeDrivers = Array.isArray(driversData) ? driversData : [];
            setDrivers(safeDrivers);
            setRoutes(routesData);
        } catch (err) {
            console.error('Error loading dropdowns:', err);
        }
    };

    useEffect(() => {
        const loadAll = async () => {
            setLoading(true);
            setError(null);
            try {
                await Promise.all([fetchVehicles(false), loadDropdowns()]);
            } finally {
                setLoading(false);
            }
        };
        loadAll();
    }, []);

    const resetForm = () => {
        setFormData({
            valstybiniaiNum: '',
            rida: 0,
            vietuSk: 0,
            kuroTipas: 1,
            fkVairuotojasIdNaudotojas: null,
            fkMarsrutasNumeris: null
        });
        setEditingVehicle(null);
    };

    const handleAddNew = () => {
        resetForm();
        setShowForm(true);
    };

    const handleEdit = (vehicle: Vehicle) => {
        setFormData({
            valstybiniaiNum: vehicle.valstybiniaiNum,
            rida: vehicle.rida,
            vietuSk: vehicle.vietuSk,
            kuroTipas: vehicle.kuroTipas,
            fkVairuotojasIdNaudotojas: vehicle.fkVairuotojasIdNaudotojas || null,
            fkMarsrutasNumeris: vehicle.fkMarsrutasNumeris || null
        });
        setEditingVehicle(vehicle);
        setShowForm(true);
    };

    const handleCancel = () => {
        setShowForm(false);
        resetForm();
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.valstybiniaiNum.trim()) {
            setError('Valstybinis numeris yra privalomas');
            return;
        }

        try {
            setFormLoading(true);
            setError(null);

            if (editingVehicle) {
                // Update existing vehicle - don't include valstybiniaiNum in update data
                const updateData: UpdateVehicleDto = {
                    rida: formData.rida,
                    vietuSk: formData.vietuSk,
                    kuroTipas: formData.kuroTipas,
                    fkVairuotojasIdNaudotojas: formData.fkVairuotojasIdNaudotojas,
                    fkMarsrutasNumeris: formData.fkMarsrutasNumeris
                };
                await vehicleService.updateVehicle(editingVehicle.valstybiniaiNum, updateData);
            } else {
                // Create new vehicle
                const createData: CreateVehicleDto = {
                    valstybiniaiNum: formData.valstybiniaiNum,
                    rida: formData.rida,
                    vietuSk: formData.vietuSk,
                    kuroTipas: formData.kuroTipas,
                    fkVairuotojasIdNaudotojas: formData.fkVairuotojasIdNaudotojas,
                    fkMarsrutasNumeris: formData.fkMarsrutasNumeris
                };
                await vehicleService.createVehicle(createData);
            }

            // Refresh the list
            await fetchVehicles();
            setShowForm(false);
            resetForm();
        } catch (err) {
            console.error('Error saving vehicle:', err);
            setError(editingVehicle ? 'Nepavyko atnaujinti transporto priemonės' : 'Nepavyko sukurti transporto priemonės');
        } finally {
            setFormLoading(false);
        }
    };

    const handleDelete = async (valstybiniaiNum: string) => {
        if (!window.confirm('Ar tikrai norite ištrinti šią transporto priemonę?')) {
            return;
        }

        try {
            await vehicleService.deleteVehicle(valstybiniaiNum);
            await fetchVehicles(); // Refresh the list
        } catch (err) {
            console.error('Error deleting vehicle:', err);
            setError('Nepavyko ištrinti transporto priemonės');
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        let processedValue: any = value;
        
        if (name === 'rida' || name === 'vietuSk' || name === 'kuroTipas') {
            processedValue = parseInt(value);
        } else if (name === 'fkVairuotojasIdNaudotojas' || name === 'fkMarsrutasNumeris') {
            processedValue = value === '' ? null : parseInt(value);
        }
        
        setFormData(prev => ({ ...prev, [name]: processedValue }));
    };

    const clearData = () => {
        setVehicles([]);
    };

    const refreshData = () => {
        fetchVehicles();
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-100">
                <header className="flex items-center justify-between px-6 py-4 bg-white shadow">
                    <div>
                        <h1 className="text-2xl font-semibold text-slate-900">
                            E-Transit – Transporto Priemonės
                        </h1>
                        <p className="text-sm text-slate-500">
                            Prisijungta kaip {user?.name} ({user?.role})
                        </p>
                    </div>
                    <button
                        onClick={handleSignOut}
                        className="bg-slate-900 text-white px-4 py-1 rounded-md hover:bg-slate-800"
                    >
                        Atsijungti
                    </button>
                </header>
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-100">
            {/* Header */}
            <header className="flex items-center justify-between px-6 py-4 bg-white shadow">
                <div>
                    <h1 className="text-2xl font-semibold text-slate-900">
                        E-Transit – Transporto Priemonės
                    </h1>
                    <p className="text-sm text-slate-500">
                        Prisijungta kaip {user?.name} ({user?.role})
                    </p>
                </div>
                <button
                    onClick={handleSignOut}
                    className="bg-slate-900 text-white px-4 py-1 rounded-md hover:bg-slate-800"
                >
                    Atsijungti
                </button>
            </header>

            {/* Body */}
            <div className="container mx-auto px-4 py-8">
                {/* Add/Edit Form Modal */}
                {showForm && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                        <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
                            <div className="px-6 py-4 border-b border-gray-200">
                                <h3 className="text-xl font-bold text-gray-800">
                                    {editingVehicle ? 'Redaguoti transporto priemonę' : 'Nauja transporto priemonė'}
                                </h3>
                            </div>

                            <form onSubmit={handleSubmit} className="p-6 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Valstybinis numeris *
                                    </label>
                                    <input
                                        type="text"
                                        name="valstybiniaiNum"
                                        value={formData.valstybiniaiNum}
                                        onChange={handleInputChange}
                                        className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${editingVehicle ? 'bg-gray-100 cursor-not-allowed' : ''
                                            }`}
                                        placeholder="ABC123"
                                        required
                                        disabled={!!editingVehicle} // Disable when editing
                                        readOnly={!!editingVehicle} // Make it read-only when editing
                                    />
                                    {editingVehicle && (
                                        <p className="text-xs text-gray-500 mt-1">
                                            Valstybinio numerio keisti negalima
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Rida (km)
                                    </label>
                                    <input
                                        type="number"
                                        name="rida"
                                        value={formData.rida}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        min="0"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Vietų skaičius
                                    </label>
                                    <input
                                        type="number"
                                        name="vietuSk"
                                        value={formData.vietuSk}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        min="1"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Kuro tipas
                                    </label>
                                    <select
                                        name="kuroTipas"
                                        value={formData.kuroTipas}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value={1}>Benzinas</option>
                                        <option value={2}>LPG</option>
                                        <option value={3}>Dyzelinas</option>
                                        <option value={4}>Elektra</option>
                                    </select>
                                </div>

                                {/* Driver Assignment */}
                                <div>
                                    <label htmlFor="fkVairuotojasIdNaudotojas" className="block text-sm font-medium text-gray-700 mb-1">
                                        Vairuotojas (neprivaloma)
                                    </label>
                                    <select
                                        id="fkVairuotojasIdNaudotojas"
                                        name="fkVairuotojasIdNaudotojas"
                                        value={formData.fkVairuotojasIdNaudotojas || ''}
                                        onChange={handleInputChange}
                                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="">-- Nepaskirta --</option>
                                        {drivers.map(driver => (
                                            <option key={driver.idNaudotojas} value={driver.idNaudotojas}>
                                                {driver.vardas} {driver.pavarde}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Route Assignment */}
                                <div>
                                    <label htmlFor="fkMarsrutasNumeris" className="block text-sm font-medium text-gray-700 mb-1">
                                        Maršrutas (neprivaloma)
                                    </label>
                                    <select
                                        id="fkMarsrutasNumeris"
                                        name="fkMarsrutasNumeris"
                                        value={formData.fkMarsrutasNumeris || ''}
                                        onChange={handleInputChange}
                                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        disabled={routes.length === 0}
                                    >
                                        <option value="">-- Nepaskirta --</option>
                                        {routes.map(route => (
                                            <option key={route.numeris} value={route.numeris}>
                                                {route.pavadinimas}
                                            </option>
                                        ))}
                                    </select>
                                    {routes.length === 0 && (
                                        <p className="text-xs text-gray-500 mt-1">Nėra galimų maršrutų</p>
                                    )}
                                </div>

                                <div className="flex justify-end space-x-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={handleCancel}
                                        className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition duration-200"
                                        disabled={formLoading}
                                    >
                                        Atšaukti
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition duration-200 disabled:opacity-50"
                                        disabled={formLoading}
                                    >
                                        {formLoading ? 'Išsaugoma...' : editingVehicle ? 'Atnaujinti' : 'Sukurti'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                <div className="bg-white shadow-md rounded-lg overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <div className="flex justify-between items-center">
                            <h2 className="text-2xl font-bold text-gray-800">Transporto Priemonių Sąrašas</h2>
                            <div className="space-x-2">
                                <button
                                    onClick={handleAddNew}
                                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition duration-200"
                                >
                                    + Pridėti naują
                                </button>
                                <button
                                    onClick={refreshData}
                                    className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition duration-200"
                                >
                                    Atnaujinti
                                </button>
                                <button
                                    onClick={clearData}
                                    className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition duration-200"
                                >
                                    Išvalyti
                                </button>
                            </div>
                        </div>
                    </div>

                    {error && (
                        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative m-4">
                            <strong className="font-bold">Klaida! </strong>
                            <span className="block sm:inline">{error}</span>
                            <button
                                onClick={() => setError(null)}
                                className="ml-4 bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm"
                            >
                                Uždaryti
                            </button>
                        </div>
                    )}

                    {vehicles.length === 0 && !error ? (
                        <div className="text-center py-8">
                            <p className="text-gray-500 text-lg">Nėra duomenų rodyti</p>
                            <button
                                onClick={handleAddNew}
                                className="mt-4 bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg transition duration-200"
                            >
                                Pridėti pirmą transporto priemonę
                            </button>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Valstybinis Nr.
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Rida (km)
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Vietų Sk.
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Kuro Tipas
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Vairuotojas
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Maršrutas
                                        </th>
                                        {user?.role === 'admin' && (
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Gedimai
                                            </th>
                                        )}
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Veiksmai
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {vehicles.map((vehicle) => (
                                        <React.Fragment key={vehicle.valstybiniaiNum}>
                                        <tr className="hover:bg-gray-50 transition duration-150">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                {vehicle.valstybiniaiNum}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {vehicle.rida.toLocaleString()} km
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {vehicle.vietuSk}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${vehicle.kuroTipas === 4
                                                    ? 'bg-green-100 text-green-800'
                                                    : vehicle.kuroTipas === 3
                                                        ? 'bg-yellow-100 text-yellow-800'
                                                        : 'bg-blue-100 text-blue-800'
                                                    }`}>
                                                    {kuroTipasLabels[vehicle.kuroTipas]}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {vehicle.vairuotojasVardas && vehicle.vairuotojasPavarde
                                                    ? `${vehicle.vairuotojasVardas} ${vehicle.vairuotojasPavarde}`
                                                    : '-'
                                                }
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {vehicle.marsrutasPavadinimas || '-'}
                                            </td>
                                            {user?.role === 'admin' && (
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    <button
                                                        onClick={() => setActiveTabVehicle(activeTabVehicle === vehicle.valstybiniaiNum ? null : vehicle.valstybiniaiNum)}
                                                        className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-xs"
                                                    >
                                                        {activeTabVehicle === vehicle.valstybiniaiNum ? 'Slėpti' : 'Peržiūrėti'}
                                                    </button>
                                                </td>
                                            )}
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                                                <button
                                                    onClick={() => handleEdit(vehicle)}
                                                    className="text-indigo-600 hover:text-indigo-900 transition duration-200"
                                                >
                                                    Redaguoti
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(vehicle.valstybiniaiNum)}
                                                    className="text-red-600 hover:text-red-900 transition duration-200"
                                                >
                                                    Ištrinti
                                                </button>
                                            </td>
                                        </tr>
                                        {user?.role === 'admin' && activeTabVehicle === vehicle.valstybiniaiNum && (
                                            <tr>
                                                <td colSpan={7} className="px-6 py-4 bg-slate-50">
                                                    <div className="bg-white border rounded-lg">
                                                        <div className="flex items-center justify-between border-b px-4 py-2">
                                                            <div className="flex space-x-2">
                                                                <button
                                                                    className={`px-3 py-1 rounded-md text-sm ${malTab==='unresolved'?'bg-blue-600 text-white':'bg-slate-200 text-slate-800'}`}
                                                                    onClick={() => setMalTab('unresolved')}
                                                                >
                                                                    Nesutvarkyti
                                                                </button>
                                                                <button
                                                                    className={`px-3 py-1 rounded-md text-sm ${malTab==='resolved'?'bg-blue-600 text-white':'bg-slate-200 text-slate-800'}`}
                                                                    onClick={() => setMalTab('resolved')}
                                                                >
                                                                    Sutvarkyti
                                                                </button>
                                                            </div>
                                                            <span className="text-sm text-slate-600">Gedimai: {vehicleGedimai[vehicle.valstybiniaiNum]?.length ?? 0}</span>
                                                        </div>
                                                        <div className="p-4">
                                                            {(() => {
                                                                const list = (vehicleGedimai[vehicle.valstybiniaiNum] || []);
                                                                const filtered = malTab==='unresolved'
                                                                    ? list.filter(g => g.gedimoBusena !== 'Sutvarkyta')
                                                                    : list.filter(g => g.gedimoBusena === 'Sutvarkyta');

                                                                if (filtered.length === 0) {
                                                                    return <div className="text-center text-slate-600">{malTab==='unresolved' ? 'Nėra nesutvarkytų gedimų' : 'Nėra sutvarkytų gedimų'}</div>;
                                                                }

                                                                return (
                                                                    <div className="space-y-3">
                                                                        {filtered.map(g => (
                                                                            <div key={g.idGedimas} className="p-3 border rounded-md flex items-center justify-between">
                                                                                <div>
                                                                                    <div className="font-medium text-slate-900">{g.gedimoTipas || '-'}</div>
                                                                                    <div className="text-sm text-slate-600">{g.data ? new Date(g.data).toLocaleString('lt-LT') : '-'}</div>
                                                                                    {g.komentaras && <div className="text-sm text-slate-700 mt-1">{g.komentaras}</div>}
                                                                                </div>
                                                                                {malTab==='unresolved' && (
                                                                                    <button
                                                                                        onClick={() => handleResolveGedimas(g.idGedimas, vehicle.valstybiniaiNum)}
                                                                                        className="px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 text-xs"
                                                                                    >
                                                                                        Pažymėti kaip sutvarkytą
                                                                                    </button>
                                                                                )}
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                );
                                                            })()}
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                        </React.Fragment>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                        <p className="text-sm text-gray-600">
                            Iš viso: <span className="font-semibold">{vehicles.length}</span> transporto priemonės
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VehiclePage;