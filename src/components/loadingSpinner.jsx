export default function LoadingSpinner() {
    
    return (
        <div className="w-full h-full flex justify-center items-center">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-t-blue-900 border-b-blue-900 border-l-blue-900 border-gray-300"></div>
        </div>
    );
};