import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../App';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { toast } from 'sonner';
import {
  Wallet,
  TrendingUp,
  LogOut,
  Plus,
  Award,
  Activity,
  DollarSign,
  MapPin,
  Fuel,
  Utensils,
  Home,
  Wrench,
  Navigation
} from 'lucide-react';

const DriverDashboard = () => {
  const { user, logout, token, API } = useContext(AuthContext);
  const [stats, setStats] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [trips, setTrips] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [performance, setPerformance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  // Modal states
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const [expenseData, setExpenseData] = useState({
    trip_id: '',
    category: 'fuel',
    amount: '',
    description: '',
    location: ''
  });

  const axiosConfig = {
    headers: { Authorization: `Bearer ${token}` }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [statsRes, walletRes, tripsRes, expensesRes] = await Promise.all([
        axios.get(`${API}/dashboard/stats`, axiosConfig),
        axios.get(`${API}/wallet`, axiosConfig),
        axios.get(`${API}/trips`, axiosConfig),
        axios.get(`${API}/expenses`, axiosConfig)
      ]);

      setStats(statsRes.data);
      setWallet(walletRes.data);
      setTrips(tripsRes.data);
      setExpenses(expensesRes.data);

      // Fetch performance
      try {
        const perfRes = await axios.get(`${API}/performance/${user.id}`, axiosConfig);
        setPerformance(perfRes.data);
      } catch (error) {
        console.log('Performance data not available');
      }
    } catch (error) {
      toast.error('Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateExpense = async (e) => {
    e.preventDefault();
    try {
      await axios.post(
        `${API}/expenses`,
        {
          ...expenseData,
          driver_id: user.id,
          amount: parseFloat(expenseData.amount)
        },
        axiosConfig
      );
      toast.success('Expense logged successfully!');
      setShowExpenseModal(false);
      fetchDashboardData();
      setExpenseData({
        trip_id: '',
        category: 'fuel',
        amount: '',
        description: '',
        location: ''
      });
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to log expense');
    }
  };

  const handlePayment = async (packageType) => {
    try {
      const response = await axios.post(
        `${API}/payments/checkout`,
        { package: packageType },
        axiosConfig
      );
      window.location.href = response.data.url;
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Payment failed');
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'fuel':
        return <Fuel className="h-5 w-5 text-orange-600" />;
      case 'toll':
        return <Navigation className="h-5 w-5 text-blue-600" />;
      case 'food':
        return <Utensils className="h-5 w-5 text-green-600" />;
      case 'lodging':
        return <Home className="h-5 w-5 text-purple-600" />;
      case 'repair':
        return <Wrench className="h-5 w-5 text-red-600" />;
      default:
        return <DollarSign className="h-5 w-5 text-gray-600" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100" data-testid="driver-dashboard">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold gradient-text">TransOps Driver</h1>
              <p className="text-sm text-gray-600">Your Digital Wallet & Performance</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm text-gray-600">Welcome,</p>
                <p className="font-semibold">{user?.name}</p>
              </div>
              <Button
                data-testid="logout-btn"
                variant="outline"
                onClick={logout}
                className="flex items-center space-x-2"
              >
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Stats Overview */}
      <div className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="stat-card glass">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Wallet Balance</p>
                  <p className="text-3xl font-bold text-green-600">₹{wallet?.balance?.toFixed(2) || 0}</p>
                </div>
                <Wallet className="h-10 w-10 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="stat-card glass">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Trips</p>
                  <p className="text-3xl font-bold">{stats?.total_trips || 0}</p>
                </div>
                <Activity className="h-10 w-10 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="stat-card glass">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Expenses</p>
                  <p className="text-3xl font-bold">₹{stats?.total_expenses || 0}</p>
                </div>
                <DollarSign className="h-10 w-10 text-red-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="stat-card glass">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Reward Points</p>
                  <p className="text-3xl font-bold text-purple-600">{stats?.reward_points || 0}</p>
                </div>
                <Award className="h-10 w-10 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Wallet Limits */}
        <Card className="mb-8 glass">
          <CardHeader>
            <CardTitle>Category Spending Limits</CardTitle>
            <CardDescription>Your daily spending limits by category</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="p-4 bg-orange-50 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <Fuel className="h-5 w-5 text-orange-600" />
                  <p className="font-semibold text-sm">Fuel</p>
                </div>
                <p className="text-2xl font-bold text-orange-600">₹{wallet?.fuel_limit || 0}</p>
              </div>
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <Navigation className="h-5 w-5 text-blue-600" />
                  <p className="font-semibold text-sm">Toll</p>
                </div>
                <p className="text-2xl font-bold text-blue-600">₹{wallet?.toll_limit || 0}</p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <Utensils className="h-5 w-5 text-green-600" />
                  <p className="font-semibold text-sm">Food</p>
                </div>
                <p className="text-2xl font-bold text-green-600">₹{wallet?.food_limit || 0}</p>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <Home className="h-5 w-5 text-purple-600" />
                  <p className="font-semibold text-sm">Lodging</p>
                </div>
                <p className="text-2xl font-bold text-purple-600">₹{wallet?.lodging_limit || 0}</p>
              </div>
              <div className="p-4 bg-red-50 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <Wrench className="h-5 w-5 text-red-600" />
                  <p className="font-semibold text-sm">Repair</p>
                </div>
                <p className="text-2xl font-bold text-red-600">₹{wallet?.repair_limit || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="flex flex-wrap gap-4 mb-8">
          <Button
            data-testid="log-expense-btn"
            onClick={() => setShowExpenseModal(true)}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Log Expense
          </Button>
          <Button
            data-testid="topup-wallet-btn"
            onClick={() => setShowPaymentModal(true)}
            variant="outline"
            className="border-green-600 text-green-600 hover:bg-green-50"
          >
            <Wallet className="h-4 w-4 mr-2" />
            Top-up Wallet
          </Button>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview" data-testid="overview-tab">Overview</TabsTrigger>
            <TabsTrigger value="trips" data-testid="trips-tab">My Trips</TabsTrigger>
            <TabsTrigger value="expenses" data-testid="expenses-tab">Expenses</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6 mt-6">
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Performance Metrics</CardTitle>
                </CardHeader>
                <CardContent>
                  {performance ? (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <p className="text-gray-600">Total Distance</p>
                        <p className="font-semibold">{performance.total_distance} km</p>
                      </div>
                      <div className="flex justify-between items-center">
                        <p className="text-gray-600">Avg Fuel Efficiency</p>
                        <p className="font-semibold">{performance.average_fuel_efficiency} km/l</p>
                      </div>
                      <div className="flex justify-between items-center">
                        <p className="text-gray-600">Safety Score</p>
                        <p className="font-semibold text-green-600">{performance.safety_score}/100</p>
                      </div>
                      <div className="flex justify-between items-center">
                        <p className="text-gray-600">Reward Points</p>
                        <p className="font-semibold text-purple-600">{performance.reward_points}</p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-center text-gray-500 py-4">No performance data yet</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Recent Expenses</CardTitle>
                </CardHeader>
                <CardContent>
                  {expenses.slice(0, 5).map((expense) => (
                    <div key={expense.id} className="flex justify-between items-center py-3 border-b last:border-b-0">
                      <div className="flex items-center space-x-3">
                        {getCategoryIcon(expense.category)}
                        <div>
                          <p className="font-semibold capitalize">{expense.category}</p>
                          <p className="text-sm text-gray-600">{expense.description || 'No description'}</p>
                        </div>
                      </div>
                      <p className="text-sm font-semibold text-red-600">-₹{expense.amount}</p>
                    </div>
                  ))}
                  {expenses.length === 0 && (
                    <p className="text-center text-gray-500 py-4">No expenses yet</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="trips" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>My Trips</CardTitle>
                <CardDescription>All assigned trips</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {trips.map((trip) => (
                    <Card key={trip.id} className="p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-semibold text-lg">{trip.origin} → {trip.destination}</p>
                          <p className="text-sm text-gray-600 mt-1">
                            Status: <span className="capitalize font-semibold">{trip.status}</span>
                          </p>
                          <p className="text-sm text-gray-600">Distance: {trip.estimated_distance || 'N/A'} km</p>
                          {trip.cargo_details && (
                            <p className="text-sm text-gray-600">Cargo: {trip.cargo_details}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-600">Expenses</p>
                          <p className="text-2xl font-bold text-red-600">₹{trip.total_expenses}</p>
                        </div>
                      </div>
                    </Card>
                  ))}
                  {trips.length === 0 && (
                    <p className="text-center text-gray-500 py-8">No trips assigned yet</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="expenses" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>All Expenses</CardTitle>
                <CardDescription>Complete expense history</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {expenses.map((expense) => (
                    <Card key={expense.id} className="p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex items-start space-x-3">
                          {getCategoryIcon(expense.category)}
                          <div>
                            <p className="font-semibold capitalize">{expense.category}</p>
                            <p className="text-sm text-gray-600">{expense.description || 'No description'}</p>
                            {expense.location && (
                              <p className="text-sm text-gray-600 flex items-center mt-1">
                                <MapPin className="h-3 w-3 mr-1" />
                                {expense.location}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-bold text-red-600">-₹{expense.amount}</p>
                          <p className="text-xs text-gray-500 capitalize">{expense.status}</p>
                        </div>
                      </div>
                    </Card>
                  ))}
                  {expenses.length === 0 && (
                    <p className="text-center text-gray-500 py-8">No expenses logged yet</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Log Expense Modal */}
      {showExpenseModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-lg glass animate-fade-in">
            <CardHeader>
              <CardTitle>Log Expense</CardTitle>
              <CardDescription>Record your trip expense</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateExpense} className="space-y-4">
                <div>
                  <Label>Trip</Label>
                  <select
                    data-testid="expense-trip-select"
                    className="w-full border border-gray-300 rounded-md p-2"
                    value={expenseData.trip_id}
                    onChange={(e) => setExpenseData({ ...expenseData, trip_id: e.target.value })}
                    required
                  >
                    <option value="">Select Trip</option>
                    {trips.map((trip) => (
                      <option key={trip.id} value={trip.id}>
                        {trip.origin} → {trip.destination}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label>Category</Label>
                  <select
                    data-testid="expense-category-select"
                    className="w-full border border-gray-300 rounded-md p-2"
                    value={expenseData.category}
                    onChange={(e) => setExpenseData({ ...expenseData, category: e.target.value })}
                  >
                    <option value="fuel">Fuel</option>
                    <option value="toll">Toll</option>
                    <option value="food">Food</option>
                    <option value="lodging">Lodging</option>
                    <option value="repair">Repair</option>
                  </select>
                </div>
                <div>
                  <Label>Amount (₹)</Label>
                  <Input
                    data-testid="expense-amount-input"
                    type="number"
                    step="0.01"
                    placeholder="500"
                    value={expenseData.amount}
                    onChange={(e) => setExpenseData({ ...expenseData, amount: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label>Description</Label>
                  <Input
                    data-testid="expense-description-input"
                    placeholder="Fuel at HP Station"
                    value={expenseData.description}
                    onChange={(e) => setExpenseData({ ...expenseData, description: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Location</Label>
                  <Input
                    data-testid="expense-location-input"
                    placeholder="Mumbai - Pune Highway"
                    value={expenseData.location}
                    onChange={(e) => setExpenseData({ ...expenseData, location: e.target.value })}
                  />
                </div>
                <div className="flex space-x-2">
                  <Button data-testid="expense-submit-btn" type="submit" className="flex-1">
                    Log Expense
                  </Button>
                  <Button
                    data-testid="expense-cancel-btn"
                    type="button"
                    variant="outline"
                    onClick={() => setShowExpenseModal(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md glass animate-fade-in">
            <CardHeader>
              <CardTitle>Top-up Your Wallet</CardTitle>
              <CardDescription>Choose a top-up package</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Card
                data-testid="driver-package-small"
                className="p-4 cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-blue-500"
                onClick={() => handlePayment('small')}
              >
                <h3 className="font-semibold text-lg">Small Package</h3>
                <p className="text-3xl font-bold text-blue-600">₹500</p>
                <p className="text-sm text-gray-600">For short trips</p>
              </Card>

              <Card
                data-testid="driver-package-medium"
                className="p-4 cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-blue-500"
                onClick={() => handlePayment('medium')}
              >
                <h3 className="font-semibold text-lg">Medium Package</h3>
                <p className="text-3xl font-bold text-blue-600">₹1,000</p>
                <p className="text-sm text-gray-600">Most popular</p>
              </Card>

              <Card
                data-testid="driver-package-large"
                className="p-4 cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-blue-500"
                onClick={() => handlePayment('large')}
              >
                <h3 className="font-semibold text-lg">Large Package</h3>
                <p className="text-3xl font-bold text-blue-600">₹2,000</p>
                <p className="text-sm text-gray-600">For long hauls</p>
              </Card>

              <Button
                data-testid="driver-payment-cancel-btn"
                variant="outline"
                onClick={() => setShowPaymentModal(false)}
                className="w-full"
              >
                Cancel
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default DriverDashboard;
