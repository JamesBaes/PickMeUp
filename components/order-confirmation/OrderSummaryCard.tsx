import Image from 'next/image';
import { OrderConfirmationData } from './types';
import { formatItemName } from '@/helpers/menuHelpers';

interface OrderSummaryCardProps {
  orderData: OrderConfirmationData;
}

export default function OrderSummaryCard({ orderData }: OrderSummaryCardProps) {
  return (
    <div className="bg-white rounded-2xl shadow-md p-8">
      <h2 className="font-heading font-bold text-3xl text-neutral-900 mb-6">
        Order Summary
      </h2>

      <div className="space-y-3 mb-6 font-body">
        {[
          { label: 'Order Number',   value: orderData.orderNumber },
          { label: 'Date',           value: orderData.date },
          { label: 'Payment Method', value: orderData.paymentMethod },
        ].map(({ label, value }) => (
          <div key={label} className="flex justify-between">
            <span className="text-neutral-600">{label}:</span>
            <span className="text-neutral-900">{value}</span>
          </div>
        ))}
      </div>

      <hr className="border-neutral-300 mb-6" />

      <div className="space-y-4 mb-6">
        {orderData.items.map((item, index) => (
          <div key={index} className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full overflow-hidden shrink-0 bg-neutral-100">
              {item.image_url ? (
                <Image
                  src={item.image_url}
                  alt={item.name}
                  width={64}
                  height={64}
                  className="object-cover w-full h-full"
                />
              ) : (
                <div className="w-full h-full bg-neutral-200" />
              )}
            </div>
            <div className="flex-1">
              <h3 className="font-heading font-semibold text-lg text-neutral-900">
                {formatItemName(item.name)}
              </h3>
              <p className="font-body text-sm text-neutral-600">
                Quantity: {item.quantity}
              </p>
            </div>
            <div className="font-body text-neutral-900">
              ${(item.price * item.quantity).toFixed(2)}
            </div>
          </div>
        ))}
      </div>

      <hr className="border-neutral-300 mb-6" />

      <div className="space-y-3 font-body mb-6">
        <div className="flex justify-between">
          <span className="text-neutral-600">Subtotal</span>
          <span className="text-neutral-900">${orderData.subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-neutral-600">Tax</span>
          <span className="text-neutral-900">${orderData.tax.toFixed(2)}</span>
        </div>
      </div>

      <div className="pt-4 border-t border-neutral-300">
        <div className="flex justify-between font-heading text-2xl">
          <span className="font-bold text-neutral-900">Order Total</span>
          <span className="font-bold text-neutral-900">${orderData.total.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
}
