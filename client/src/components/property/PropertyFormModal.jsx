import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  Trash2,
  Building,
  DollarSign,
  MapPin,
  CheckSquare,
  Image as ImageIcon,
  Save,
  AlertCircle,
  Loader2,
  Navigation,
  Upload,
  Star,
  ArrowUp,
  ArrowDown,
  CheckCircle2,
} from 'lucide-react';
import PropertyMap from './PropertyMap';
import propertyService from '../../services/propertyService';

const PROPERTY_TYPES = [
  { value: 'apartment', label: 'Apartment' },
  { value: 'house', label: 'Independent House' },
  { value: 'villa', label: 'Luxury Villa' },
  { value: 'studio', label: 'Studio Apartment' },
  { value: 'commercial', label: 'Commercial Space' },
];

const FURNISHING_TYPES = [
  { value: 'unfurnished', label: 'Unfurnished' },
  { value: 'semi_furnished', label: 'Semi Furnished' },
  { value: 'fully_furnished', label: 'Fully Furnished' },
];

const PROPERTY_STATUSES = [
  { value: 'published', label: 'Published (Live)' },
  { value: 'draft', label: 'Draft' },
  { value: 'pending', label: 'Pending Approval' },
  { value: 'rented', label: 'Rented' },
];

const PRESET_AMENITIES = [
  'High Speed WiFi',
  'Covered Parking',
  'Swimming Pool',
  'Gym / Fitness Centre',
  'Air Conditioning',
  'Power Backup',
  'Gated Security',
  'Elevator',
  'Balcony / Terrace',
  'Modular Kitchen',
  'Pet Friendly',
  'Washing Machine',
  'Furnished',
  'Private Garden',
  'EV Charging Station',
  '24/7 Water Supply',
];

export default function PropertyFormModal({
  isOpen,
  onClose,
  onSubmit,
  property = null, // null for Create, Object for Edit
  isSubmitting = false,
}) {
  const isEditMode = !!property;

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    property_type: 'apartment',
    furnishing: 'unfurnished',
    rent_amount: '',
    deposit_amount: '',
    bedrooms: 1,
    bathrooms: 1,
    area_sqft: '',
    address_line: '',
    locality: '',
    city: '',
    state: '',
    zip_code: '',
    latitude: '',
    longitude: '',
    amenities: [],
    images: [],
    status: 'published',
  });

  const [customAmenity, setCustomAmenity] = useState('');
  const [errors, setErrors] = useState({});
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [newImageUrl, setNewImageUrl] = useState('');

  // Populate form data on edit mode
  useEffect(() => {
    if (property) {
      setFormData({
        title: property.title || '',
        description: property.description || '',
        property_type: property.property_type || 'apartment',
        furnishing: property.furnishing || 'unfurnished',
        rent_amount: property.rent_amount || '',
        deposit_amount: property.deposit_amount || '',
        bedrooms: property.bedrooms !== undefined ? property.bedrooms : 1,
        bathrooms: property.bathrooms !== undefined ? property.bathrooms : 1,
        area_sqft: property.area_sqft || '',
        address_line: property.address_line || '',
        locality: property.locality || '',
        city: property.city || '',
        state: property.state || '',
        zip_code: property.zip_code || '',
        latitude: property.latitude || '',
        longitude: property.longitude || '',
        amenities: Array.isArray(property.amenities) ? property.amenities : [],
        images: Array.isArray(property.images) ? property.images : [],
        status: property.status || 'published',
      });
    } else {
      setFormData({
        title: '',
        description: '',
        property_type: 'apartment',
        furnishing: 'unfurnished',
        rent_amount: '',
        deposit_amount: '',
        bedrooms: 1,
        bathrooms: 1,
        area_sqft: '',
        address_line: '',
        locality: '',
        city: '',
        state: '',
        zip_code: '',
        latitude: '',
        longitude: '',
        amenities: ['High Speed WiFi', 'Covered Parking', 'Gated Security'],
        images: [],
        status: 'published',
      });
    }
    setErrors({});
    setUploadError(null);
    setNewImageUrl('');
  }, [property, isOpen]);

  if (!isOpen) return null;

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  const handleAmenityToggle = (amenity) => {
    setFormData((prev) => {
      const exists = prev.amenities.includes(amenity);
      return {
        ...prev,
        amenities: exists
          ? prev.amenities.filter((a) => a !== amenity)
          : [...prev.amenities, amenity],
      };
    });
  };

  const handleAddCustomAmenity = (e) => {
    e.preventDefault();
    if (!customAmenity.trim()) return;
    if (!formData.amenities.includes(customAmenity.trim())) {
      setFormData((prev) => ({
        ...prev,
        amenities: [...prev.amenities, customAmenity.trim()],
      }));
    }
    setCustomAmenity('');
  };

  // Image upload handling
  const handleFileUpload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const data = new FormData();
    for (let i = 0; i < files.length; i++) {
      data.append('images', files[i]);
    }

    try {
      setUploadingFiles(true);
      setUploadError(null);
      const res = await propertyService.uploadImages(data);
      if (res?.data?.images && Array.isArray(res.data.images)) {
        setFormData((prev) => ({
          ...prev,
          images: [...prev.images, ...res.data.images],
        }));
      }
    } catch (err) {
      console.error('Failed to upload property images:', err);
      setUploadError(err.response?.data?.message || 'Failed to upload images. Ensure files are < 5MB.');
    } finally {
      setUploadingFiles(false);
      e.target.value = '';
    }
  };

  const handleAddUrlImage = () => {
    if (!newImageUrl.trim()) return;
    setFormData((prev) => ({
      ...prev,
      images: [...prev.images, newImageUrl.trim()],
    }));
    setNewImageUrl('');
  };

  const handleRemoveImage = (index) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, idx) => idx !== index),
    }));
  };

  const handleSetPrimaryImage = (index) => {
    if (index === 0) return;
    setFormData((prev) => {
      const copy = [...prev.images];
      const [chosen] = copy.splice(index, 1);
      return { ...prev, images: [chosen, ...copy] };
    });
  };

  const handleMoveImage = (index, direction) => {
    const targetIdx = index + direction;
    if (targetIdx < 0 || targetIdx >= formData.images.length) return;
    setFormData((prev) => {
      const copy = [...prev.images];
      const temp = copy[index];
      copy[index] = copy[targetIdx];
      copy[targetIdx] = temp;
      return { ...prev, images: copy };
    });
  };

  const handleLocationPicked = (lat, lng) => {
    setFormData((prev) => ({
      ...prev,
      latitude: parseFloat(lat.toFixed(6)),
      longitude: parseFloat(lng.toFixed(6)),
    }));
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.title.trim()) newErrors.title = 'Title is required';
    if (!formData.address_line.trim()) newErrors.address_line = 'Address is required';
    if (!formData.city.trim()) newErrors.city = 'City is required';
    if (!formData.state.trim()) newErrors.state = 'State is required';
    if (!formData.zip_code.trim()) newErrors.zip_code = 'Zip / Postal code is required';

    if (
      formData.rent_amount === '' ||
      isNaN(Number(formData.rent_amount)) ||
      Number(formData.rent_amount) <= 0
    ) {
      newErrors.rent_amount = 'Please enter a valid monthly rent amount';
    }

    if (
      formData.deposit_amount !== '' &&
      (isNaN(Number(formData.deposit_amount)) || Number(formData.deposit_amount) < 0)
    ) {
      newErrors.deposit_amount = 'Deposit must be a valid non-negative number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    const payload = {
      ...formData,
      locality: formData.locality?.trim() || null,
      furnishing: formData.furnishing || 'unfurnished',
      rent_amount: Number(formData.rent_amount),
      deposit_amount: formData.deposit_amount ? Number(formData.deposit_amount) : 0,
      bedrooms: Number(formData.bedrooms),
      bathrooms: Number(formData.bathrooms),
      area_sqft: formData.area_sqft ? Number(formData.area_sqft) : null,
      latitude: formData.latitude !== '' ? Number(formData.latitude) : null,
      longitude: formData.longitude !== '' ? Number(formData.longitude) : null,
      images: formData.images.filter((url) => url && url.trim().length > 0),
    };

    onSubmit(payload);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-warm-900/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6">
      <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-warm-lg border border-warm-200 overflow-hidden animate-fadeIn">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-warm-100 bg-warm-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary-100 text-primary-700 flex items-center justify-center">
              <Building className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-warm-900">
                {isEditMode ? 'Edit Property Listing' : 'Add New Property Listing'}
              </h2>
              <p className="text-xs text-warm-500">
                Fill in details and photos to publish or update your property on Rentora.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-warm-400 hover:text-warm-700 hover:bg-warm-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form id="property-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Basic Information */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-primary-700 mb-3 flex items-center gap-2">
              <Building className="w-4 h-4" /> Basic Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-3">
                <label className="block text-xs font-semibold text-warm-700 mb-1">
                  Property Title *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Luxury 2 BHK Flat in Gaur Yamuna City with Balcony View"
                  value={formData.title}
                  onChange={(e) => handleChange('title', e.target.value)}
                  className={`w-full px-3.5 py-2.5 bg-white border rounded-xl text-xs sm:text-sm focus:outline-none focus:border-primary-500 ${
                    errors.title ? 'border-brick-400 bg-brick-50/50' : 'border-warm-200'
                  }`}
                />
                {errors.title && <p className="text-xs text-brick-600 mt-1">{errors.title}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-warm-700 mb-1">
                  Property Type *
                </label>
                <select
                  value={formData.property_type}
                  onChange={(e) => handleChange('property_type', e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-warm-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-primary-500 cursor-pointer"
                >
                  {PROPERTY_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-warm-700 mb-1">
                  Furnishing Status *
                </label>
                <select
                  value={formData.furnishing}
                  onChange={(e) => handleChange('furnishing', e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-warm-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-primary-500 cursor-pointer"
                >
                  {FURNISHING_TYPES.map((furn) => (
                    <option key={furn.value} value={furn.value}>
                      {furn.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-warm-700 mb-1">
                  Listing Status *
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => handleChange('status', e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-warm-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-primary-500 cursor-pointer"
                >
                  {PROPERTY_STATUSES.map((status) => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-3">
                <label className="block text-xs font-semibold text-warm-700 mb-1">
                  Description
                </label>
                <textarea
                  rows="3"
                  placeholder="Describe your property highlights, nearby landmarks, furnishing, and house rules..."
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-warm-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-primary-500 resize-none"
                />
              </div>
            </div>
          </div>

          {/* Pricing & Dimensions */}
          <div className="pt-4 border-t border-warm-100">
            <h3 className="text-xs font-bold uppercase tracking-wider text-primary-700 mb-3 flex items-center gap-2">
              <DollarSign className="w-4 h-4" /> Pricing & Specifications
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-semibold text-warm-700 mb-1">
                  Monthly Rent (₹) *
                </label>
                <input
                  type="number"
                  min="0"
                  step="500"
                  placeholder="e.g. 35000"
                  value={formData.rent_amount}
                  onChange={(e) => handleChange('rent_amount', e.target.value)}
                  className={`w-full px-3.5 py-2.5 bg-white border rounded-xl text-xs sm:text-sm focus:outline-none focus:border-primary-500 ${
                    errors.rent_amount ? 'border-brick-400 bg-brick-50/50' : 'border-warm-200'
                  }`}
                />
                {errors.rent_amount && <p className="text-xs text-brick-600 mt-1">{errors.rent_amount}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-warm-700 mb-1">
                  Deposit (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  step="500"
                  placeholder="e.g. 70000"
                  value={formData.deposit_amount}
                  onChange={(e) => handleChange('deposit_amount', e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-warm-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-primary-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-warm-700 mb-1">
                  Bedrooms
                </label>
                <input
                  type="number"
                  min="0"
                  max="20"
                  value={formData.bedrooms}
                  onChange={(e) => handleChange('bedrooms', e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-warm-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-primary-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-warm-700 mb-1">
                  Bathrooms
                </label>
                <input
                  type="number"
                  min="0"
                  max="20"
                  value={formData.bathrooms}
                  onChange={(e) => handleChange('bathrooms', e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-warm-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-primary-500"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-xs font-semibold text-warm-700 mb-1">
                  Carpet Area (sq. ft)
                </label>
                <input
                  type="number"
                  min="0"
                  placeholder="e.g. 1450"
                  value={formData.area_sqft}
                  onChange={(e) => handleChange('area_sqft', e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-warm-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-primary-500"
                />
              </div>
            </div>
          </div>

          {/* Location & Map */}
          <div className="pt-4 border-t border-warm-100">
            <h3 className="text-xs font-bold uppercase tracking-wider text-primary-700 mb-3 flex items-center gap-2">
              <MapPin className="w-4 h-4" /> Location Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-4">
                <label className="block text-xs font-semibold text-warm-700 mb-1">
                  Address Line *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Flat 402, Sunshine Heights, Golf Course Road"
                  value={formData.address_line}
                  onChange={(e) => handleChange('address_line', e.target.value)}
                  className={`w-full px-3.5 py-2.5 bg-white border rounded-xl text-xs sm:text-sm focus:outline-none focus:border-primary-500 ${
                    errors.address_line ? 'border-brick-400 bg-brick-50/50' : 'border-warm-200'
                  }`}
                />
                {errors.address_line && <p className="text-xs text-brick-600 mt-1">{errors.address_line}</p>}
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-warm-700 mb-1">
                  Locality / Sector / Society
                </label>
                <input
                  type="text"
                  placeholder="e.g. Gaur Yamuna City, Cyber City, Indiranagar"
                  value={formData.locality}
                  onChange={(e) => handleChange('locality', e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-warm-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-primary-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-warm-700 mb-1">
                  City *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Greater Noida, Gurgaon"
                  value={formData.city}
                  onChange={(e) => handleChange('city', e.target.value)}
                  className={`w-full px-3.5 py-2.5 bg-white border rounded-xl text-xs sm:text-sm focus:outline-none focus:border-primary-500 ${
                    errors.city ? 'border-brick-400 bg-brick-50/50' : 'border-warm-200'
                  }`}
                />
                {errors.city && <p className="text-xs text-brick-600 mt-1">{errors.city}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-warm-700 mb-1">
                  State *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Uttar Pradesh, Haryana"
                  value={formData.state}
                  onChange={(e) => handleChange('state', e.target.value)}
                  className={`w-full px-3.5 py-2.5 bg-white border rounded-xl text-xs sm:text-sm focus:outline-none focus:border-primary-500 ${
                    errors.state ? 'border-brick-400 bg-brick-50/50' : 'border-warm-200'
                  }`}
                />
                {errors.state && <p className="text-xs text-brick-600 mt-1">{errors.state}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-warm-700 mb-1">
                  Zip / Postal Code *
                </label>
                <input
                  type="text"
                  placeholder="e.g. 201310"
                  value={formData.zip_code}
                  onChange={(e) => handleChange('zip_code', e.target.value)}
                  className={`w-full px-3.5 py-2.5 bg-white border rounded-xl text-xs sm:text-sm focus:outline-none focus:border-primary-500 ${
                    errors.zip_code ? 'border-brick-400 bg-brick-50/50' : 'border-warm-200'
                  }`}
                />
                {errors.zip_code && <p className="text-xs text-brick-600 mt-1">{errors.zip_code}</p>}
              </div>

              {/* Coordinates & Map Picker */}
              <div className="md:col-span-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-warm-700">
                    Geographic Coordinates (Latitude & Longitude)
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowLocationPicker(!showLocationPicker)}
                    className="text-xs font-semibold text-primary-600 hover:text-primary-700 flex items-center gap-1"
                  >
                    <Navigation className="w-3.5 h-3.5" />
                    {showLocationPicker ? 'Hide Map Picker' : 'Pick on Interactive Map'}
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="number"
                    step="0.000001"
                    placeholder="Latitude (e.g. 28.4595)"
                    value={formData.latitude}
                    onChange={(e) => handleChange('latitude', e.target.value)}
                    className="w-full px-3.5 py-2 bg-white border border-warm-200 rounded-xl text-xs focus:outline-none focus:border-primary-500"
                  />
                  <input
                    type="number"
                    step="0.000001"
                    placeholder="Longitude (e.g. 77.0266)"
                    value={formData.longitude}
                    onChange={(e) => handleChange('longitude', e.target.value)}
                    className="w-full px-3.5 py-2 bg-white border border-warm-200 rounded-xl text-xs focus:outline-none focus:border-primary-500"
                  />
                </div>

                {showLocationPicker && (
                  <div className="mt-3">
                    <PropertyMap
                      latitude={formData.latitude}
                      longitude={formData.longitude}
                      isPicker={true}
                      onLocationSelect={handleLocationPicked}
                      height="240px"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Amenities */}
          <div className="pt-4 border-t border-warm-100">
            <h3 className="text-xs font-bold uppercase tracking-wider text-primary-700 mb-3 flex items-center gap-2">
              <CheckSquare className="w-4 h-4" /> Amenities & Features
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
              {PRESET_AMENITIES.map((amenity) => {
                const isSelected = formData.amenities.includes(amenity);
                return (
                  <button
                    key={amenity}
                    type="button"
                    onClick={() => handleAmenityToggle(amenity)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium border text-left transition-all ${
                      isSelected
                        ? 'bg-primary-50 border-primary-300 text-primary-700 font-semibold shadow-warm-xs'
                        : 'bg-warm-50 border-warm-200 text-warm-700 hover:bg-warm-100'
                    }`}
                  >
                    <span
                      className={`w-3.5 h-3.5 rounded flex items-center justify-center text-[10px] border ${
                        isSelected
                          ? 'bg-primary-600 text-white border-primary-600'
                          : 'border-warm-300 bg-white'
                      }`}
                    >
                      {isSelected ? '✓' : ''}
                    </span>
                    <span className="truncate">{amenity}</span>
                  </button>
                );
              })}
            </div>

            {/* Custom Amenity Adder */}
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Add custom amenity (e.g. Smart Locks, Rooftop Jacuzzi)"
                value={customAmenity}
                onChange={(e) => setCustomAmenity(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddCustomAmenity(e);
                  }
                }}
                className="flex-1 px-3 py-2 bg-white border border-warm-200 rounded-xl text-xs focus:outline-none focus:border-primary-500"
              />
              <button
                type="button"
                onClick={handleAddCustomAmenity}
                className="btn-secondary !py-2 !px-4 text-xs font-semibold flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Add
              </button>
            </div>
          </div>

          {/* Photos & Media Management */}
          <div className="pt-4 border-t border-warm-100">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-primary-700 flex items-center gap-2">
                <ImageIcon className="w-4 h-4" /> Property Media & Photo Gallery
              </h3>
              <span className="text-[11px] text-warm-500">
                {formData.images.length} photo{formData.images.length !== 1 ? 's' : ''} added
              </span>
            </div>

            {/* Upload Box */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-3 items-stretch">
                <label className="flex-1 border-2 border-dashed border-warm-300 hover:border-primary-400 bg-warm-50/50 hover:bg-warm-50 rounded-2xl p-4 text-center cursor-pointer transition-colors flex flex-col items-center justify-center">
                  <input
                    type="file"
                    multiple
                    accept="image/png,image/jpeg,image/webp"
                    onChange={handleFileUpload}
                    className="hidden"
                    disabled={uploadingFiles}
                  />
                  {uploadingFiles ? (
                    <div className="flex items-center gap-2 text-xs text-primary-600 font-bold">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Uploading high-resolution photos...</span>
                    </div>
                  ) : (
                    <>
                      <Upload className="w-5 h-5 text-warm-400 mb-1" />
                      <span className="text-xs font-bold text-warm-800">Upload photos from device</span>
                      <span className="text-[10px] text-warm-400 mt-0.5">JPEG, PNG, WEBP (up to 5MB each)</span>
                    </>
                  )}
                </label>

                {/* Add Image by URL */}
                <div className="sm:w-72 flex flex-col gap-1.5 justify-center bg-warm-50 p-3 rounded-2xl border border-warm-200">
                  <label className="text-[10px] font-bold text-warm-700 uppercase">Or Add Image URL</label>
                  <div className="flex gap-1.5">
                    <input
                      type="url"
                      placeholder="https://..."
                      value={newImageUrl}
                      onChange={(e) => setNewImageUrl(e.target.value)}
                      className="flex-1 px-2.5 py-1.5 text-xs bg-white border border-warm-300 rounded-lg outline-none focus:border-primary-500"
                    />
                    <button
                      type="button"
                      onClick={handleAddUrlImage}
                      disabled={!newImageUrl.trim()}
                      className="btn-secondary !py-1.5 !px-2.5 text-xs font-semibold"
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>

              {uploadError && (
                <div className="p-3 bg-brick-50 border border-brick-200 rounded-xl text-xs text-brick-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-brick-600 shrink-0" />
                  <span>{uploadError}</span>
                </div>
              )}

              {/* Photo Thumbnail Management Gallery */}
              {formData.images.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                  {formData.images.map((img, idx) => (
                    <div
                      key={idx}
                      className="relative rounded-xl overflow-hidden border border-warm-200 group bg-warm-100 aspect-video flex flex-col justify-between"
                    >
                      <img src={img} alt={`Property photo ${idx + 1}`} className="w-full h-full object-cover" />

                      {/* Cover badge */}
                      {idx === 0 ? (
                        <span className="absolute top-1.5 left-1.5 bg-sage-600 text-white text-[9px] font-bold px-2 py-0.5 rounded shadow-warm-xs flex items-center gap-1">
                          <Star className="w-2.5 h-2.5 fill-white" /> Primary Cover
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleSetPrimaryImage(idx)}
                          className="absolute top-1.5 left-1.5 bg-warm-900/80 hover:bg-warm-900 text-white text-[9px] font-semibold px-2 py-0.5 rounded shadow-warm-xs opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          Make Cover
                        </button>
                      )}

                      {/* Action overlays */}
                      <div className="absolute bottom-1.5 right-1.5 flex items-center gap-1 bg-warm-900/80 backdrop-blur-sm p-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                        {idx > 0 && (
                          <button
                            type="button"
                            onClick={() => handleMoveImage(idx, -1)}
                            className="p-1 text-white hover:text-primary-300 rounded"
                            title="Move Earlier"
                          >
                            <ArrowUp className="w-3 h-3" />
                          </button>
                        )}
                        {idx < formData.images.length - 1 && (
                          <button
                            type="button"
                            onClick={() => handleMoveImage(idx, 1)}
                            className="p-1 text-white hover:text-primary-300 rounded"
                            title="Move Later"
                          >
                            <ArrowDown className="w-3 h-3" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(idx)}
                          className="p-1 text-brick-300 hover:text-brick-100 rounded"
                          title="Delete Photo"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-warm-100 bg-warm-50/80 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="btn-secondary !py-2.5 !px-5 text-xs font-semibold"
          >
            Cancel
          </button>

          <button
            type="submit"
            form="property-form"
            disabled={isSubmitting}
            className="btn-primary !py-2.5 !px-6 text-xs font-bold flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Saving Listing...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>{isEditMode ? 'Update Listing' : 'Publish Listing'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
