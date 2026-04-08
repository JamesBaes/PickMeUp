import { OrderConfirmationData } from './types';

interface PaymentSummaryCardProps {
  orderData: OrderConfirmationData;
  sendingEmail: boolean;
  emailSent: boolean;
  onEmailReceipt: () => void;
}

export default function PaymentSummaryCard({
  orderData,
  sendingEmail,
  emailSent,
  onEmailReceipt,
}: PaymentSummaryCardProps) {
  const billingFields = [
    { label: 'Name',    value: orderData.customerName },
    { label: 'Address', value: orderData.billingAddress },
    { label: 'Email',   value: orderData.customerEmail },
    { label: 'Phone',   value: orderData.customerPhone },
  ].filter(({ value }) => value && value !== 'N/A');

  return (
    <div className="bg-white rounded-2xl shadow-md p-8">
      <h2 className="font-heading font-bold text-3xl text-neutral-900 mb-2">
        Payment Summary
      </h2>
      {orderData.locationName && (
        <p className="font-body text-neutral-500 text-sm mb-6">
          📍 {orderData.locationName}
        </p>
      )}

      <div className="mb-8">
        <h3 className="font-heading font-semibold text-xl text-neutral-800 mb-4">
          Billing Address
        </h3>
        <div className="space-y-2 font-body text-neutral-700">
          {billingFields.map(({ label, value }) => (
            <div key={label} className="flex">
              <span className="w-20 text-neutral-600">{label}:</span>
              <span>{value}</span>
            </div>
          ))}
        </div>
      </div>

      <div>
        <button
          onClick={onEmailReceipt}
          disabled={sendingEmail || emailSent}
          className="bg-accent text-white font-heading font-semibold py-3 px-8 rounded-lg hover:shadow-lg transition-all hover:cursor-pointer disabled:bg-neutral-400 disabled:cursor-not-allowed"
        >
          {sendingEmail ? 'Sending...' : emailSent ? 'Email Sent!' : 'Email Receipt'}
        </button>
        {emailSent && (
          <p className="mt-2 text-sm text-success font-body">
            Receipt sent to {orderData.customerEmail}
          </p>
        )}
      </div>
    </div>
  );
}
