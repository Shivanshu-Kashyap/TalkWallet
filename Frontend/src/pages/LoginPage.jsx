import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { Phone, Shield, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { useStartOTPMutation, useVerifyOTPMutation } from '../store/api';
import { loginStart, loginSuccess, loginFailure } from '../store/slices/authSlice';

const LoginPage = () => {
  const [step, setStep] = useState('phone'); // 'phone' or 'otp'
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isNewUser, setIsNewUser] = useState(false);
  
  const dispatch = useDispatch();
  const [startOTP, { isLoading: otpLoading }] = useStartOTPMutation();
  const [verifyOTP, { isLoading: verifyLoading }] = useVerifyOTPMutation();

  const formatPhoneNumber = (phone) => {
    // Simple E.164 formatting (assuming +91 for India)
    if (phone.startsWith('+')) return phone;
    if (phone.startsWith('91')) return `+${phone}`;
    if (phone.length === 10) return `+91${phone}`;
    return phone;
  };

  const handleSendOTP = async (e) => {
    e.preventDefault();
    
    const formattedPhone = formatPhoneNumber(phoneNumber);
    
    try {
      dispatch(loginStart());
      const response = await startOTP({ phoneE164: formattedPhone }).unwrap();
      toast.success(response.message);
      setStep('otp');
      
      // In development, show OTP
      if (response.otp) {
        toast.success(`Development OTP: ${response.otp}`);
      }
    } catch (error) {
      dispatch(loginFailure());
      toast.error(error.data?.message || 'Failed to send OTP');
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    
    const formattedPhone = formatPhoneNumber(phoneNumber);
    
    try {
      dispatch(loginStart());
      const response = await verifyOTP({ 
        phoneE164: formattedPhone, 
        otp,
        ...(displayName && { displayName })
      }).unwrap();
      
      dispatch(loginSuccess(response));
      toast.success('Login successful!');
    } catch (error) {
      dispatch(loginFailure());
      if (error.data?.message === 'Display name is required for new users') {
        setIsNewUser(true);
        toast.error('Please enter your display name');
      } else {
        toast.error(error.data?.message || 'Invalid OTP');
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-white px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-primary-500 rounded-full flex items-center justify-center mb-6">
            <span className="text-2xl font-bold text-white">₹</span>
          </div>
          <h2 className="text-3xl font-bold text-gray-900">SmartSplit</h2>
          <p className="mt-2 text-gray-600">
            {step === 'phone' ? 'Enter your phone number to continue' : 'Enter the verification code'}
          </p>
        </div>

        {step === 'phone' ? (
          <form onSubmit={handleSendOTP} className="mt-8 space-y-6">
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Phone className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  required
                  className="appearance-none rounded-lg relative block w-full px-3 py-3 pl-10 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Enter your phone number"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                />
              </div>
              <p className="mt-1 text-sm text-gray-500">
                We'll send you a verification code via SMS
              </p>
            </div>

            <button
              type="submit"
              disabled={otpLoading || !phoneNumber}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {otpLoading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <>
                  Send OTP
                  <ArrowRight className="ml-2 h-5 w-5" />
                </>
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOTP} className="mt-8 space-y-6">
            {isNewUser && (
              <div>
                <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 mb-2">
                  Display Name
                </label>
                <input
                  id="displayName"
                  name="displayName"
                  type="text"
                  required={isNewUser}
                  className="appearance-none rounded-lg relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Enter your name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                />
              </div>
            )}
            
            <div>
              <label htmlFor="otp" className="block text-sm font-medium text-gray-700 mb-2">
                Verification Code
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Shield className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="otp"
                  name="otp"
                  type="text"
                  required
                  maxLength={6}
                  className="appearance-none rounded-lg relative block w-full px-3 py-3 pl-10 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-center text-lg tracking-widest"
                  placeholder="000000"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                />
              </div>
              <p className="mt-1 text-sm text-gray-500">
                Sent to {phoneNumber}
              </p>
            </div>

            <div className="flex space-x-3">
              <button
                type="button"
                onClick={() => {
                  setStep('phone');
                  setOtp('');
                  setIsNewUser(false);
                  setDisplayName('');
                }}
                className="flex-1 py-3 px-4 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={verifyLoading || !otp || (isNewUser && !displayName)}
                className="flex-1 py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {verifyLoading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mx-auto"></div>
                ) : (
                  'Verify'
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default LoginPage;
