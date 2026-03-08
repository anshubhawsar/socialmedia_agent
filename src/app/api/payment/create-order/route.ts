import { NextRequest, NextResponse } from "next/server";
import { getRazorpayInstance, PRICING, isRazorpayConfigured } from "@/lib/razorpay";

export async function POST(request: NextRequest) {
  try {
    // Check if Razorpay is configured
    if (!isRazorpayConfigured()) {
      console.error("Razorpay not configured");
      return NextResponse.json(
        { error: "Payment gateway not configured. Please contact support." },
        { status: 503 }
      );
    }

    // Verify user is logged in (set by middleware)
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      console.error("No userId in request headers");
      return NextResponse.json({ 
        error: "Please login to upgrade your account" 
      }, { status: 401 });
    }

    console.log("Creating Razorpay order for user:", userId);

    // Create Razorpay order
    const razorpay = getRazorpayInstance();
    const order = await razorpay.orders.create({
      amount: PRICING.PRO_MONTHLY.amount,
      currency: PRICING.PRO_MONTHLY.currency,
      receipt: `receipt_${userId}_${Date.now()}`,
      notes: {
        user_id: userId,
        subscription_type: "pro_monthly",
      },
    });

    console.log("Razorpay order created:", order.id);

    return NextResponse.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
    });
  } catch (error) {
    console.error("Error creating Razorpay order:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { 
        error: "Failed to create payment order", 
        details: errorMessage 
      },
      { status: 500 }
    );
  }
}
