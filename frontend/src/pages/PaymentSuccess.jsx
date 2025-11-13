import React, { useEffect, useState, useContext } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../App';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { token, API } = useContext(AuthContext);
  const [status, setStatus] = useState('checking'); // checking, success, failed
  const [transaction, setTransaction] = useState(null);
  const [attempts, setAttempts] = useState(0);
  const maxAttempts = 5;

  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    if (sessionId) {
      checkPaymentStatus();
    } else {
      setStatus('failed');
    }
  }, [sessionId]);

  const checkPaymentStatus = async () => {
    if (attempts >= maxAttempts) {
      setStatus('failed');
      return;
    }

    try {
      const response = await axios.get(`${API}/payments/status/${sessionId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setTransaction(response.data);

      if (response.data.payment_status === 'paid') {
        setStatus('success');
      } else if (response.data.status === 'expired') {
        setStatus('failed');
      } else {
        // Still pending, poll again
        setAttempts(prev => prev + 1);
        setTimeout(checkPaymentStatus, 2000);
      }
    } catch (error) {
      console.error('Payment status check failed:', error);
      setStatus('failed');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md glass animate-fade-in" data-testid="payment-success-page">
        <CardHeader>
          <CardTitle className="text-center text-2xl">
            {status === 'checking' && 'Processing Payment...'}
            {status === 'success' && 'Payment Successful!'}
            {status === 'failed' && 'Payment Failed'}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center space-y-6">
          {status === 'checking' && (
            <>
              <Loader2 className="h-16 w-16 text-blue-600 animate-spin" data-testid="payment-loading" />
              <p className="text-gray-600 text-center">Please wait while we verify your payment...</p>
            </>
          )}

          {status === 'success' && (
            <>
              <CheckCircle className="h-16 w-16 text-green-600" data-testid="payment-success-icon" />
              <div className="text-center">
                <p className="text-lg font-semibold mb-2">Your payment was successful!</p>
                {transaction && (
                  <div className="mt-4 p-4 bg-green-50 rounded-lg">
                    <p className="text-sm text-gray-600">Amount: <span className="font-semibold">₹{transaction.amount}</span></p>
                    <p className="text-sm text-gray-600">Session ID: <span className="font-mono text-xs">{sessionId}</span></p>
                  </div>
                )}
              </div>
              <Button
                data-testid="return-dashboard-btn"
                onClick={() => navigate('/dashboard')}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                Return to Dashboard
              </Button>
            </>
          )}

          {status === 'failed' && (
            <>
              <XCircle className="h-16 w-16 text-red-600" data-testid="payment-failed-icon" />
              <div className="text-center">
                <p className="text-lg font-semibold mb-2">Payment could not be processed</p>
                <p className="text-sm text-gray-600">Please try again or contact support if the issue persists.</p>
              </div>
              <div className="flex space-x-2 w-full">
                <Button
                  data-testid="retry-payment-btn"
                  onClick={() => navigate('/dashboard')}
                  className="flex-1"
                >
                  Try Again
                </Button>
                <Button
                  data-testid="back-dashboard-btn"
                  variant="outline"
                  onClick={() => navigate('/dashboard')}
                  className="flex-1"
                >
                  Back to Dashboard
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentSuccess;
