'use client';

const JoinCompanyPage = () => {
  return (
    <div className="w-full max-w-2xl text-center">
      <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
        Join an Existing Company
      </h1>
      <div className="mt-10 p-8 border-4 border-dashed border-gray-700 rounded-lg">
        <p className="text-gray-500">
          A form to search for a company or enter an invitation code will be here.
          <br />
          This will trigger an approval request to the company owner.
        </p>
      </div>
    </div>
  );
};

export default JoinCompanyPage;
