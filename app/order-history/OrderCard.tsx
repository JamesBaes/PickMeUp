"use client";

interface OrderCardProps {
  order: any;           // Order data from database
  isActive?: boolean;   // Is this an active order?
}

export default function OrderCard({ order, isActive = false }: OrderCardProps) {
  // Safely get values from database order
  const items = order?.items || [];  // If no items, use empty array
  const total = order?.total_amount || 0;
  const status = order?.status || "";
  const progress = order?.progress || 0;
  
  // Format date from database
  const formatDate = (dateString: string) => {
    if (!dateString) return "Recent";
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric"
      });
    } catch (e) {
      return "Recent";
    }
  };

  const orderDate = formatDate(order?.created_at);
  const orderNumber = order?.id?.slice(-8) || "N/A";

  return (
    <div className={`border rounded-xl p-6 mb-6 ${isActive ? 'border-orange-500 bg-orange-50' : 'border-gray-200 bg-white'}`}>
      
      {/* Order Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold text-gray-900">{orderDate}</h3>
          <p className="text-gray-600">Order #{orderNumber}</p>
          
          {/* Active badge */}
          {isActive && (
            <div className="mt-2">
              <span className="inline-block px-3 py-1 bg-orange-100 text-orange-800 text-sm font-semibold rounded-full">
                Active Order
              </span>
            </div>
          )}
        </div>
        
        {/* Price */}
        <div className="mt-2 md:mt-0">
          <div className="text-right">
            <p className="text-2xl font-bold text-gray-900">${total.toFixed(2)}</p>
          </div>
        </div>
      </div>

      {/* Items List */}
      <div className="mb-6">
        <h4 className="font-semibold text-gray-700 mb-2">Items:</h4>
        {items.length > 0 ? (
          <ul className="space-y-1">
            {items.map((item: any, index: number) => (
              <li key={index} className="text-gray-600">
                • {item.quantity}x {item.name}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500">No items found</p>
        )}
      </div>

      {/* Progress Bar - Only for active orders */}
      {isActive && (
        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <div className="flex items-center">
            <div className="mr-4">
              <p className="text-sm text-gray-600">Status:</p>
              <p className="font-semibold text-blue-700">{status}</p>
            </div>
            <div className="flex-1">
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-green-500 rounded-full" 
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {progress}% complete
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        {isActive ? (
          // Active order buttons
          <>
            <button className="px-6 py-3 bg-orange-500 text-white font-semibold rounded-lg hover:bg-orange-600">
              View Details
            </button>
            <button className="px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50">
              Cancel Order
            </button>
          </>
        ) : (
          // Past order buttons
          <>
            <button className="px-6 py-3 bg-gray-800 text-white font-semibold rounded-lg hover:bg-gray-900">
              Order Again
            </button>
            <button className="px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50">
              View Details
            </button>
          </>
        )}
      </div>
    </div>
  );
}