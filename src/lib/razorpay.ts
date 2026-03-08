import Razorpay from "razorpay";

// Initialize Razorpay instance
export function getRazorpayInstance() {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    throw new Error("Razorpay credentials not configured");
  }

  if (
    process.env.RAZORPAY_KEY_ID === "your-razorpay-key-id" ||
    process.env.RAZORPAY_KEY_SECRET === "your-razorpay-key-secret"
  ) {
    throw new Error("Razorpay credentials are still using placeholder values");
  }

  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
}

// Check if Razorpay is properly configured
export function isRazorpayConfigured(): boolean {
  return (
    !!process.env.RAZORPAY_KEY_ID &&
    !!process.env.RAZORPAY_KEY_SECRET &&
    !process.env.RAZORPAY_KEY_ID.includes("your-razorpay") &&
    !process.env.RAZORPAY_KEY_SECRET.includes("your-razorpay")
  );
}

// Pricing constants (in paise for Razorpay)
export const PRICING = {
  PRO_MONTHLY: {
    amount: 1900, // ₹19.00 in paise
    currency: "INR",
    name: "Social Media Manager Pro - Monthly",
  },
};
