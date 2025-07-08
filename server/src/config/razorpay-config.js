const Razorpay = require('razorpay');
const { razorpayKey, razorpaySecret } = require('./server-config');

var instance = new Razorpay({
    key_id: razorpayKey,
    key_secret: razorpaySecret,
});
  
module.exports = instance;