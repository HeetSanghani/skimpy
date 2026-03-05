import React, { useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useSelector } from 'react-redux';

// ─── Per-field validation rules ───────────────────────────────────────────────
const VALIDATORS = {
    first_name: (v) => /^[A-Za-z\s'-]{2,}$/.test(v.trim()) ? null : "Enter a valid first name (letters only, min 2 chars)",
    last_name: (v) => /^[A-Za-z\s'-]{2,}$/.test(v.trim()) ? null : "Enter a valid last name (letters only, min 2 chars)",
    phone: (v) => /^\d{10}$/.test(v.trim()) ? null : "Phone must be exactly 10 digits",
    street_address: (v) => v.trim().length >= 5 ? null : "Street address must be at least 5 characters",
    city: (v) => /^[A-Za-z\s'-]{2,}$/.test(v.trim()) ? null : "Enter a valid city name",
    state: (v) => /^[A-Za-z\s'-]{2,}$/.test(v.trim()) ? null : "Enter a valid state name",
    postcode: (v) => /^\d{6}$/.test(v.trim()) ? null : "PIN code must be exactly 6 digits",
    country: (v) => v.trim().length >= 2 ? null : "Country is required",
};

// Field-level error message component
function FieldError({ msg }) {
    if (!msg) return null;
    return (
        <p className="mt-1 text-xs text-red-500 font-medium flex items-center gap-1">
            <svg className="w-3 h-3 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {msg}
        </p>
    );
}

// Reusable labelled input wrapper
function FormField({ label, children, error, required }) {
    return (
        <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
                {label}{required && <span className="text-red-400 ml-0.5">*</span>}
            </label>
            {children}
            <FieldError msg={error} />
        </div>
    );
}

const INITIAL = {
    first_name: '', last_name: '', phone: '',
    street_address: '', city: '', state: '',
    postcode: '', country: 'India',
};

const AddressModal = ({ isOpen, onClose, onAddressAdded }) => {
    const { token } = useSelector((state) => state.auth);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState(INITIAL);
    const [errors, setErrors] = useState({});
    const [touched, setTouched] = useState({});

    if (!isOpen) return null;

    // ── Handlers ──────────────────────────────────────────────────────────────
    const validate = (name, value) => VALIDATORS[name]?.(value) ?? null;

    const handleChange = (e) => {
        const { name, value } = e.target;

        // For phone / postcode, strip non-digits as the user types
        let sanitised = value;
        if (name === 'phone') sanitised = value.replace(/\D/g, '').slice(0, 10);
        if (name === 'postcode') sanitised = value.replace(/\D/g, '').slice(0, 6);

        setFormData((prev) => ({ ...prev, [name]: sanitised }));

        if (touched[name]) {
            setErrors((prev) => ({ ...prev, [name]: validate(name, sanitised) }));
        }
    };

    const handleBlur = (e) => {
        const { name, value } = e.target;
        setTouched((prev) => ({ ...prev, [name]: true }));
        setErrors((prev) => ({ ...prev, [name]: validate(name, value) }));
    };

    const inputClass = (name) =>
        `mt-0.5 block w-full rounded-lg border px-3 py-2.5 text-sm shadow-sm
     focus:outline-none focus:ring-2 transition-all duration-150
     ${errors[name] && touched[name]
            ? 'border-red-400 bg-red-50 focus:ring-red-300'
            : 'border-gray-300 bg-white focus:ring-indigo-300 focus:border-indigo-400'}`;

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Touch all fields and validate all
        const newTouched = Object.fromEntries(Object.keys(VALIDATORS).map((k) => [k, true]));
        const newErrors = Object.fromEntries(
            Object.entries(VALIDATORS).map(([k, fn]) => [k, fn(formData[k] ?? '')])
        );

        setTouched(newTouched);
        setErrors(newErrors);

        if (Object.values(newErrors).some(Boolean)) {
            toast.error('Please fix the errors before saving.');
            return;
        }

        setLoading(true);
        try {
            await axios.post('/user/settings/add-delivery-address', formData, {
                headers: { Authorization: `Bearer ${token}` },
            });
            toast.success('Address added successfully!');
            onAddressAdded();
            onClose();
            setFormData(INITIAL);
            setErrors({});
            setTouched({});
        } catch (error) {
            toast.error(error.response?.data?.detail || 'Failed to add address');
        } finally {
            setLoading(false);
        }
    };

    // ── JSX ───────────────────────────────────────────────────────────────────
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg relative max-h-[92vh] overflow-y-auto">

                {/* Header */}
                <div className="sticky top-0 bg-white z-10 px-6 pt-6 pb-4 border-b border-gray-100 flex items-center justify-between">
                    <div>
                        <h3 className="text-xl font-bold text-gray-900">Add New Address</h3>
                        <p className="text-xs text-gray-400 mt-0.5">All fields marked <span className="text-red-400">*</span> are required</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 transition-colors"
                    >
                        <svg className="w-4 h-4" viewBox="0 0 24 24" stroke="currentColor" fill="none">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit} noValidate className="px-6 py-5 space-y-4">

                    {/* Name Row */}
                    <div className="grid grid-cols-2 gap-4">
                        <FormField label="First Name" error={touched.first_name && errors.first_name} required>
                            <input
                                type="text"
                                name="first_name"
                                value={formData.first_name}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                autoComplete="given-name"
                                placeholder="Heet"
                                className={inputClass('first_name')}
                            />
                        </FormField>
                        <FormField label="Last Name" error={touched.last_name && errors.last_name} required>
                            <input
                                type="text"
                                name="last_name"
                                value={formData.last_name}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                autoComplete="family-name"
                                placeholder="Sanghani"
                                className={inputClass('last_name')}
                            />
                        </FormField>
                    </div>

                    {/* Phone */}
                    <FormField
                        label="Mobile Number (10 digits)"
                        error={touched.phone && errors.phone}
                        required
                    >
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 font-medium select-none">+91</span>
                            <input
                                type="tel"
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                inputMode="numeric"
                                maxLength={10}
                                autoComplete="tel-national"
                                placeholder="9876543210"
                                className={`${inputClass('phone')} pl-10`}
                            />
                        </div>
                    </FormField>

                    {/* Street Address */}
                    <FormField label="Street Address" error={touched.street_address && errors.street_address} required>
                        <textarea
                            name="street_address"
                            value={formData.street_address}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            rows={2}
                            autoComplete="street-address"
                            placeholder="House / Flat No., Building, Street, Area"
                            className={inputClass('street_address')}
                        />
                    </FormField>

                    {/* City + State */}
                    <div className="grid grid-cols-2 gap-4">
                        <FormField label="City" error={touched.city && errors.city} required>
                            <input
                                type="text"
                                name="city"
                                value={formData.city}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                autoComplete="address-level2"
                                placeholder="Surat"
                                className={inputClass('city')}
                            />
                        </FormField>
                        <FormField label="State" error={touched.state && errors.state} required>
                            <input
                                type="text"
                                name="state"
                                value={formData.state}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                autoComplete="address-level1"
                                placeholder="Gujarat"
                                className={inputClass('state')}
                            />
                        </FormField>
                    </div>

                    {/* PIN Code + Country */}
                    <div className="grid grid-cols-2 gap-4">
                        <FormField
                            label="PIN Code (6 digits)"
                            error={touched.postcode && errors.postcode}
                            required
                        >
                            <input
                                type="text"
                                name="postcode"
                                value={formData.postcode}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                inputMode="numeric"
                                maxLength={6}
                                autoComplete="postal-code"
                                placeholder="395001"
                                className={inputClass('postcode')}
                            />
                        </FormField>
                        <FormField label="Country" error={touched.country && errors.country} required>
                            <input
                                type="text"
                                name="country"
                                value={formData.country}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                autoComplete="country-name"
                                placeholder="India"
                                className={inputClass('country')}
                            />
                        </FormField>
                    </div>

                    {/* Submit */}
                    <div className="pt-2">
                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full py-3 px-4 rounded-xl text-sm font-bold text-white transition-all duration-200 flex items-center justify-center gap-2 shadow-md
                ${loading
                                    ? 'bg-indigo-300 cursor-not-allowed'
                                    : 'bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 hover:shadow-lg hover:shadow-indigo-200 active:scale-[0.98]'
                                }`}
                        >
                            {loading
                                ? <><span className="animate-spin text-lg">⏳</span> Saving…</>
                                : <><span>📍</span> Save Address</>
                            }
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddressModal;
