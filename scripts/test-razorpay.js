const Razorpay = require('razorpay');
const fs = require('fs');
const path = require('path');

// Read .env.local
const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const getEnv = (key) => {
  const match = envContent.match(new RegExp(`^${key}=(.*)$`, 'm'));
  return match ? match[1].trim() : '';
};

async function testRazorpay() {
  console.log('🔄 Testing Razorpay configuration...\n');

  const keyId = getEnv('RAZORPAY_KEY_ID');
  const keySecret = getEnv('RAZORPAY_KEY_SECRET');

  console.log('Key ID:', keyId ? keyId.substring(0, 15) + '...' : 'NOT SET');
  console.log('Key Secret:', keySecret ? keySecret.substring(0, 10) + '...' : 'NOT SET');

  if (!keyId || !keySecret) {
    console.error('\n❌ Razorpay credentials not found in .env.local');
    return;
  }

  if (keyId.includes('your-razorpay') || keySecret.includes('your-razorpay')) {
    console.error('\n❌ Razorpay credentials are still using placeholder values');
    return;
  }

  console.log('\n✅ Credentials configured');

  // Initialize Razorpay
  const razorpay = new Razorpay({
    key_id: keyId,
    key_secret: keySecret,
  });

  console.log('\n🔄 Creating test order...');

  try {
    const order = await razorpay.orders.create({
      amount: 1900, // ₹19.00 in paise
      currency: 'INR',
      receipt: `test_receipt_${Date.now()}`,
      notes: {
        test: 'true'
      }
    });

    console.log('✅ Order created successfully!');
    console.log('Order ID:', order.id);
    console.log('Amount:', order.amount / 100, order.currency);
    console.log('Status:', order.status);
    console.log('\n✅ Razorpay integration is working!\n');
  } catch (error) {
    console.error('❌ Failed to create order:', error.error || error.message);
    if (error.error) {
      console.error('Details:', error.error);
    }
  }
}

testRazorpay();
