'use client';

import { Suspense, useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { createCompany } from '@/lib/ServerActions/company';
// Assuming we have a way to get the current user ID globally or via props/hook
// Hook pattern suggested by dependencies: maybe usePrivy from @privy-io/react-auth?
// User didn't specify auth provider details, checking package.json: "@privy-io/react-auth": "^2.25.0"
import { usePrivy } from '@privy-io/react-auth';
import { Address } from '@/interfaces';

type FormData = {
  name: string;
  taxId: string;
  contactEmail: string;
  phone: string;
  addressStr: string; // Simplified for MVP
  street: string;
  city: string;
  zipCode: string;
  country: string;
  industry: string;
};

const CreateCompanyPage = () => {
  const { user, authenticated, ready } = usePrivy();
  const router = useRouter();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>();
  const [isLoading, setIsLoading] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (ready && !authenticated) {
      router.push('/logistics/business/login');
    }
  }, [ready, authenticated, router]);

  const onSubmit = async (data: FormData) => {
    if (!user || !user.id) {
      toast.error("You must be logged in.");
      return;
    }

    setIsLoading(true);

    try {
      // Construct Address object
      const address: Address = {
        fullName: data.name,
        street: data.street,
        city: data.city,
        state: "Buenos Aires", // Default/Hidden for MVP?
        zipCode: data.zipCode,
        country: data.country || "Argentina",
      };

      const response = await createCompany({
        name: data.name,
        taxId: data.taxId,
        contactEmail: data.contactEmail,
        phone: data.phone,
        address: address,
        industry: data.industry,
        ownerUserId: user.id // Privy DID
      }, user.id);

      if (response.success) {
        toast.success('Company profile created!');
        router.push('/logistics/business/dashboard'); // Redirect to dashboard
      } else {
        toast.error(response.message || 'Error creating company.');
      }
    } catch (error) {
      console.error(error);
      toast.error('An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!ready || !authenticated) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Register Your Company
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Join the Going Business Logistics Network
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-xl">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>

            {/* Company Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">Company Name</label>
              <div className="mt-1">
                <input
                  id="name"
                  type="text"
                  {...register('name', { required: 'Company name is required' })}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
              </div>
            </div>

            {/* Tax ID (CUIT/RFC) */}
            <div>
              <label htmlFor="taxId" className="block text-sm font-medium text-gray-700">Tax ID (CUIT/RFC)</label>
              <div className="mt-1">
                <input
                  id="taxId"
                  type="text"
                  {...register('taxId', { required: 'Tax ID is required' })}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
                {errors.taxId && <p className="text-red-500 text-xs mt-1">{errors.taxId.message}</p>}
              </div>
            </div>

            {/* Contact Email */}
            <div>
              <label htmlFor="contactEmail" className="block text-sm font-medium text-gray-700">Business Email</label>
              <div className="mt-1">
                <input
                  id="contactEmail"
                  type="email"
                  {...register('contactEmail', { required: 'Email is required' })}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
            </div>

            {/* Industry */}
            <div>
              <label htmlFor="industry" className="block text-sm font-medium text-gray-700">Industry</label>
              <div className="mt-1">
                <select
                  id="industry"
                  {...register('industry')}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                >
                  <option value="retail">Retail / E-commerce</option>
                  <option value="food">Food & Beverage</option>
                  <option value="pharmaceutical">Pharmaceutical</option>
                  <option value="manufacturing">Manufacturing</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-4">
              <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">Location</h3>

              <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                <div className="sm:col-span-6">
                  <label htmlFor="street" className="block text-sm font-medium text-gray-700">Street Address</label>
                  <div className="mt-1">
                    <input
                      type="text"
                      id="street"
                      {...register('street', { required: 'Street is required' })}
                      className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md px-3 py-2 border"
                    />
                  </div>
                </div>

                <div className="sm:col-span-3">
                  <label htmlFor="city" className="block text-sm font-medium text-gray-700">City</label>
                  <div className="mt-1">
                    <input
                      type="text"
                      id="city"
                      {...register('city', { required: 'City is required' })}
                      className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md px-3 py-2 border"
                    />
                  </div>
                </div>

                <div className="sm:col-span-3">
                  <label htmlFor="zipCode" className="block text-sm font-medium text-gray-700">ZIP / Postal Code</label>
                  <div className="mt-1">
                    <input
                      type="text"
                      id="zipCode"
                      {...register('zipCode', { required: 'ZIP Code is required' })}
                      className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md px-3 py-2 border"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading || isSubmitting}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {isLoading ? 'Creating...' : 'Create Company'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateCompanyPage;
