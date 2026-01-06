import LogoLoading from "@/components/svgs/LogoLoading";

interface LoadingOverlayProps {
    message?: string;
}

export const LoadingOverlay = ({ message = "Loading..." }: LoadingOverlayProps) => {
    return (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white/80 dark:bg-gray-900/80 backend-blur-sm">
            <div className="flex flex-col items-center p-6 bg-white dark:bg-gray-800 rounded-lg shadow-xl">
                <LogoLoading className="w-16 h-16 text-primary mb-4" />
                <p className="text-lg font-medium text-gray-700 dark:text-gray-200 animate-pulse">
                    {message}
                </p>
            </div>
        </div>
    );
};

export default LoadingOverlay;
