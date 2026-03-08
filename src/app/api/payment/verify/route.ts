import { NextRequest, NextResponse } from "next/server";
import { getRazorpayInstance, isRazorpayConfigured } from "@/lib/razorpay";
import crypto from "crypto";
import { supabase } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  try {
    // Check if Razorpay is configured
    if (!isRazorpayConfigured()) {
      return NextResponse.json(
        { error: "Payment gateway not configured" },
        { status: 503 }
      );
    }

    // Verify user is logged in (set by middleware)
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get payment details from request
    const body = await request.json();
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json(
        { error: "Missing payment details" },
        { status: 400 }
      );
    }

    // Verify payment signature
    const razorpay = getRazorpayInstance();
    const generated_signature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (generated_signature !== razorpay_signature) {
      return NextResponse.json(
        { error: "Invalid payment signature" },
        { status: 400 }
      );
    }

    // Fetch payment details to confirm
    const payment = await razorpay.payments.fetch(razorpay_payment_id);
    
    if (payment.status !== "captured" && payment.status !== "authorized") {
      return NextResponse.json(
        { error: "Payment not successful" },
        { status: 400 }
      );
    }

    // Activate Pro subscription in database
    if (supabase) {
      // Update profile to Pro with unlimited tokens
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          is_subscribed: true,
          tokens_used: 0,
          token_limit: 999999, // Unlimited
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId);

      if (updateError) {
        console.error("Error updating profile:", updateError);
        return NextResponse.json(
          { error: "Failed to activate subscription" },
          { status: 500 }
        );
      }
    } else {
      // Cookie-based fallback (set in response)
      const response = NextResponse.json({
        success: true,
        message: "Payment verified successfully",
        payment_id: razorpay_payment_id,
      });

      response.cookies.set("is_subscribed", "true", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 365, // 1 year
      });

      response.cookies.set("tokens_used", "0", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 365,
      });

      return response;
    }

    return NextResponse.json({
      success: true,
      message: "Payment verified and subscription activated",
      payment_id: razorpay_payment_id,
    });
  } catch (error) {
    console.error("Error verifying payment:", error);
    return NextResponse.json(
      { error: "Failed to verify payment" },
      { status: 500 }
    );
  }
}
