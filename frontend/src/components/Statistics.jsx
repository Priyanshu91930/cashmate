import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock, ArrowUpRight, ArrowDownLeft, CreditCard, History } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const Statistics = () => {
  const [requestHistory, setRequestHistory] = useState([]);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        // Fetch request history
        const requestResponse = await fetch('http://localhost:3002/api/cash-requests/history');
        const requestData = await requestResponse.json();
        if (requestData.status === 'success') {
          setRequestHistory(requestData.requests || []);
        }

        // Fetch payment history
        const paymentResponse = await fetch('http://localhost:3002/api/payments/history');
        const paymentData = await paymentResponse.json();
        if (paymentData.status === 'success') {
          setPaymentHistory(paymentData.payments || []);
        }

        setLoading(false);
      } catch (err) {
        setError('Failed to fetch history data');
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  const HistoryItem = ({ item, type }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow duration-200"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
            type === 'request' ? 'bg-blue-50' : 'bg-emerald-50'
          }`}>
            {type === 'request' ? (
              <ArrowUpRight className="text-blue-600" size={20} />
            ) : (
              <ArrowDownLeft className="text-emerald-600" size={20} />
            )}
          </div>
          <div>
            <h3 className="font-semibold text-gray-800">
              {type === 'request' ? item.requester?.name : item.recipient?.name}
            </h3>
            <p className="text-sm text-gray-500">
              {type === 'request' ? 'Requested' : 'Paid'} {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className={`font-semibold ${type === 'request' ? 'text-blue-600' : 'text-emerald-600'}`}>
            ₹{item.amount}
          </p>
          <p className="text-xs text-gray-400">
            {item.status}
          </p>
        </div>
      </div>
    </motion.div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 text-red-700 p-4 rounded-lg">
        {error}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Request History */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="bg-white rounded-2xl p-6 shadow-lg"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
            <History className="text-blue-600" size={20} />
          </div>
          <h2 className="text-xl font-semibold text-gray-800">Request History</h2>
        </div>
        <div className="space-y-4">
          {requestHistory.length > 0 ? (
            requestHistory.map((request) => (
              <HistoryItem key={request._id} item={request} type="request" />
            ))
          ) : (
            <p className="text-gray-500 text-center py-4">No request history found</p>
          )}
        </div>
      </motion.div>

      {/* Payment History */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="bg-white rounded-2xl p-6 shadow-lg"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center">
            <CreditCard className="text-emerald-600" size={20} />
          </div>
          <h2 className="text-xl font-semibold text-gray-800">Payment History</h2>
        </div>
        <div className="space-y-4">
          {paymentHistory.length > 0 ? (
            paymentHistory.map((payment) => (
              <HistoryItem key={payment._id} item={payment} type="payment" />
            ))
          ) : (
            <p className="text-gray-500 text-center py-4">No payment history found</p>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default Statistics; 