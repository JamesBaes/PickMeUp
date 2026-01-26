import Script from "next/script";

// sandbox for testing checkouts
// when we go into product use this URL instead for the script:
// https://web.squarecdn.com/v1/square.js

// secure credit card input that handles PCI compliance
export default function CheckoutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Script
        // Production URL
        // src="https://web.squarecdn.com/v1/square.js"

        // Development URL
        src="https://sandbox.web.squarecdn.com/v1/square.js"
        strategy="beforeInteractive"
      />
      {children}
    </>
  );
}
