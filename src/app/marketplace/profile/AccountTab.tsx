'use client';

import { useAlert } from "@/context/AlertContext";
import { useUser } from "@/context/UserContext";
import { updateUser } from "@/lib/ServerActions/users";
import { usePrivy } from "@privy-io/react-auth";
import Image from "next/image";
import { useState, useEffect, ChangeEvent, FormEvent } from "react";

export const AccountTab = () => {
  const { user: privyUser, linkGoogle } = usePrivy();
  const { handleAlert } = useAlert();
  const { userData, setUserData } = useUser();

  // Local state for the form, initialized with global user data
  const [formData, setFormData] = useState(userData);

  // Effect to sync local form state if global user data changes
  useEffect(() => {
    setFormData(userData);
  }, [userData]);

  // Generic handler for all text inputs and textareas
  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => (prev ? { ...prev, [name]: value } : null));
  };

  // Handler for the image input
  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && formData) {
      // Note: This creates a temporary local URL for preview.
      // The actual file upload should be handled on submit.
      setFormData({
        ...formData,
        avatar: URL.createObjectURL(file),
      });
      // TODO: Store the file object itself to be uploaded, not just the preview URL.
    }
  };

  // Form submission handler
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!formData || !formData._id) {
      handleAlert({ message: "User data is not available.", isError: true });
      return;
    }

    handleAlert({ message: "Saving changes...", isError: false });

    // TODO: Handle file upload logic here. For now, we only save text fields.
    // We are passing the full formData, but if avatar is a blob URL, it won't save.
    const result = await updateUser(formData._id, formData);

    if (result.status && result.user) {
      // Update global context with the saved data
      setUserData(result.user);
      handleAlert({ message: "Changes saved successfully!", isError: false });
    } else {
      handleAlert({ message: result.message || "Failed to save changes.", isError: true });
    }
  };

  if (!formData) {
    return <div>Loading user data...</div>;
  }

  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Personal Information</h2>
      <form className="space-y-6" onSubmit={handleSubmit}>
        <div className="flex flex-col gap-4 items-center text-center">
          <div className="relative h-24 w-24 rounded-full overflow-hidden">
            <Image
              src={formData.avatar || "/logo.png"}
              alt={formData.fullName || "User Avatar"}
              fill
              className="object-cover"
            />
          </div>
          <div>
            <label htmlFor="imageUpload" className="text-primary hover:text-primary-dark font-medium cursor-pointer">
              Upload Image
            </label>
            <input
              id="imageUpload"
              onChange={handleImageChange}
              type="file"
              className="hidden"
              accept="image/*"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Full Name
            </label>
            <input
              type="text"
              id="fullName"
              name="fullName"
              value={formData.fullName || ''}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-primary focus:border-primary dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email || ''}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-primary focus:border-primary dark:bg-gray-700 dark:text-white"
            />
          </div>
          
          {/* Bio Textarea */}
          <div className="md:col-span-2">
            <label htmlFor="bio" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Bio
            </label>
            <textarea
              id="bio"
              name="bio"
              value={formData.bio || ''}
              onChange={handleChange}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-primary focus:border-primary dark:bg-gray-700 dark:text-white"
            />
          </div>
        </div>

        {/* Social Media Links */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Social Media Links</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="website" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Website
              </label>
              <input
                type="url"
                id="website"
                name="website"
                value={formData.website || ''}
                onChange={handleChange}
                placeholder="https://your-website.com"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-primary focus:border-primary dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div>
              <label htmlFor="x" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                X (Twitter)
              </label>
              <input
                type="url"
                id="x"
                name="x"
                value={formData.x || ''}
                onChange={handleChange}
                placeholder="https://x.com/your-profile"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-primary focus:border-primary dark:bg-gray-700 dark:text-white"
              />
            </div>
            {/* Add other social media inputs similarly */}
          </div>
        </div>

        {/* Google Link Button */}
        {!privyUser?.google && (
          <div className="flex justify-center pt-4">
            <button
              type="button"
              onClick={linkGoogle}
              className="px-6 py-2 bg-white text-black rounded-lg font-medium transition-colors flex items-center space-x-2 border border-gray-300 hover:bg-gray-100"
            >
              <Image src="/google-logo.svg" alt="Google" width={20} height={20} />
              <span>Link Google Account</span>
            </button>
          </div>
        )}

        <div className="flex justify-end pt-4">
          <button
            type="submit"
            className="px-6 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg font-medium transition-colors"
          >
            Save Changes
          </button>
        </div>
      </form>
    </div>
  );
};
