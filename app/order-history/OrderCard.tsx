import { Order } from "@/types/order";

interface OrderCardProps {
  order: Order;
  isActive?: boolean;
}

export default function OrderCard({ order, isActive = false }: OrderCardProps) {
  return (
    <div className={`border rounded-xl p-6 mb-6 ${isActive ? 'border-orange-500 bg-orange-50' : 'border-gray-200 bg-white'}`}>
      {/* Order Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold text-gray-900">{order.date}</h3>
          <p className="text-gray-600">{order.location}</p>
          {isActive && (
            <div className="mt-2">
              <span className="inline-block px-3 py-1 bg-orange-100 text-orange-800 text-sm font-semibold rounded-full">
                Active Order
              </span>
            </div>
          )}
        </div>
        <div className="mt-2 md:mt-0">
          <div className="text-right">
            <p className="text-2xl font-bold text-gray-900">${order.total}</p>
            {!isActive && (
              <p className="text-sm text-gray-500">Order #{order.orderNumber}</p>
            )}
          </div>
        </div>
      </div>

      {/* Items List */}
      <div className="mb-6">
        <h4 className="font-semibold text-gray-700 mb-2">Items:</h4>
        <ul className="space-y-1">
          {order.items.map((item, index) => (
            <li key={index} className="text-gray-600">
              • {item.name} x{item.quantity}
            </li>
          ))}
        </ul>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        {isActive ? (
          <>
            <button className="px-6 py-3 bg-orange-500 text-white font-semibold rounded-lg hover:bg-orange-600 transition">
              Track Order
            </button>
            <button className="px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition">
              View Details
            </button>
          </>
        ) : (
          <>
            <button className="px-6 py-3 bg-gray-800 text-white font-semibold rounded-lg hover:bg-gray-900 transition">
              Order Again
            </button>
            <button className="px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition">
              View Details
            </button>
          </>
        )}
      </div>

      {/* Status Bar for Active Order */}
      {isActive && (
        <div className="mt-6 pt-6 border-t">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Estimated Delivery</p>
              <p className="font-semibold">{order.estimatedDelivery}</p>
            </div>
            <div className="w-48">
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-green-500 rounded-full" 
                  style={{ width: `${order.progress}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-500 mt-1">{order.status}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}