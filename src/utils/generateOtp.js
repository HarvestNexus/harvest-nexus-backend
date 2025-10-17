
/**
 * Generate a numeric OTP of given length
 * @param {number} length - Number of digits for the OTP (default 5)
 * @returns {string} - Numeric OTP as a string
 */
function generateOtp(length = 5) {
  let otp = "";
  for (let i = 0; i < length; i++) {
    otp += Math.floor(Math.random() * 10); 
  }
  return otp;
}

module.exports = generateOtp;
