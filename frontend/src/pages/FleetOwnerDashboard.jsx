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
  Truck,
  Users,
  BarChart3,
  TrendingUp,
  Plus,
  LogOut,
  Wallet,
  MapPin,
  Package,
  AlertCircle,
  DollarSign,
  Activity
} from 'lucide-react';

const FleetOwnerDashboard = () => {
  const { user, logout, token, API } = useContext(AuthContext);
  const [stats, setStats] = useState(null);
  const [trips, setTrips] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [returnLoads, setReturnLoads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  // Modal states
  const [showTripModal, setShowTripModal] = useState(false);
  const [showVehicleModal, setShowVehicleModal] = useState(false);
  const [showReturnLoadModal, setShowReturnLoadModal] = useState(false);
  const [showRouteOptimize, setShowRouteOptimize] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const [tripData, setTripData] = useState({
    driver_id: '',
    vehicle_id: '',
    origin: '',
    destination: '',
    cargo_details: '',
    estimated_distance: ''
  });

  const [vehicleData, setVehicleData] = useState({
    registration_number: '',
    vehicle_type: 'truck',
    capacity: '',
    model: ''
  });

  const [returnLoadData, setReturnLoadData] = useState({
    origin: '',
    destination: '',
    cargo_type: '',
    weight: '',
    offered_price: '',
    pickup_date: ''
  });

  const [routeOptimizeData, setRouteOptimizeData] = useState({
    origin: '',
    destination: '',
    vehicle_type: 'truck',
    cargo_details: ''
  });

  const [aiSuggestion, setAiSuggestion] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);

  const axiosConfig = {
    headers: { Authorization: `Bearer ${token}` }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [statsRes, tripsRes, driversRes, vehiclesRes, expensesRes, loadsRes] = await Promise.all([
        axios.get(`${API}/dashboard/stats`, axiosConfig),
        axios.get(`${API}/trips`, axiosConfig),
        axios.get(`${API}/drivers`, axiosConfig),
        axios.get(`${API}/vehicles`, axiosConfig),
        axios.get(`${API}/expenses`, axiosConfig),
        axios.get(`${API}/return-loads`, axiosConfig)
      ]);

      setStats(statsRes.data);
      setTrips(tripsRes.data);
      setDrivers(driversRes.data);
      setVehicles(vehiclesRes.data);
      setExpenses(expensesRes.data);
      setReturnLoads(loadsRes.data);
    } catch (error) {
      toast.error('Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTrip = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/trips`, tripData, axiosConfig);
      toast.success('Trip created successfully!');
      setShowTripModal(false);
      fetchDashboardData();
      setTripData({
        driver_id: '',
        vehicle_id: '',
        origin: '',
        destination: '',
        cargo_details: '',
        estimated_distance: ''
      });
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create trip');
    }
  };

  const handleCreateVehicle = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/vehicles`, vehicleData, axiosConfig);
      toast.success('Vehicle added successfully!');
      setShowVehicleModal(false);
      fetchDashboardData();
      setVehicleData({
        registration_number: '',
        vehicle_type: 'truck',
        capacity: '',
        model: ''
      });
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to add vehicle');
    }
  };

  const handleCreateReturnLoad = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/return-loads`, returnLoadData, axiosConfig);
      toast.success('Return load posted successfully!');
      setShowReturnLoadModal(false);
      fetchDashboardData();
      setReturnLoadData({
        origin: '',
        destination: '',
        cargo_type: '',
        weight: '',
        offered_price: '',
        pickup_date: ''
      });
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to post return load');
    }
  };

  const handleRouteOptimize = async (e) => {
    e.preventDefault();
    setAiLoading(true);
    try {
      const response = await axios.post(`${API}/ai/route-optimize`, routeOptimizeData, axiosConfig);
      setAiSuggestion(response.data.route_suggestion);
      toast.success('Route optimized!');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to optimize route');
    } finally {
      setAiLoading(false);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100" data-testid="fleet-owner-dashboard">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <Truck className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold gradient-text">TransOps</h1>
                <p className="text-sm text-gray-600">Fleet Owner Dashboard</p>
              </div>
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

      {/* Fleet Owner ID Card */}
      <div className="container mx-auto px-6 py-6">
        <Card className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
          <CardContent className="p-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm opacity-90">Your Fleet Owner ID (Share with drivers)</p>
                <p className="text-2xl font-bold font-mono" data-testid="fleet-owner-id">{user?.id}</p>
              </div>
              <Button
                data-testid="copy-id-btn"
                onClick={() => {
                  navigator.clipboard.writeText(user?.id);
                  toast.success('Fleet Owner ID copied!');
                }}
                className="bg-white text-blue-600 hover:bg-gray-100"
              >
                Copy ID
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stats Overview */}
      <div className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
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
                  <p className="text-sm text-gray-600 mb-1">Active Trips</p>
                  <p className="text-3xl font-bold">{stats?.active_trips || 0}</p>
                </div>
                <TrendingUp className="h-10 w-10 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="stat-card glass">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Vehicles</p>
                  <p className="text-3xl font-bold">{stats?.total_vehicles || 0}</p>
                </div>
                <Truck className="h-10 w-10 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="stat-card glass">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Drivers</p>
                  <p className="text-3xl font-bold">{stats?.total_drivers || 0}</p>
                </div>
                <Users className="h-10 w-10 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap gap-4 mb-8">
          <Button
            data-testid="create-trip-btn"
            onClick={() => setShowTripModal(true)}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Trip
          </Button>
          <Button
            data-testid="add-vehicle-btn"
            onClick={() => setShowVehicleModal(true)}
            variant="outline"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Vehicle
          </Button>
          <Button
            data-testid="post-return-load-btn"
            onClick={() => setShowReturnLoadModal(true)}
            variant="outline"
          >
            <Plus className="h-4 w-4 mr-2" />
            Post Return Load
          </Button>
          <Button
            data-testid="route-optimize-btn"
            onClick={() => setShowRouteOptimize(true)}
            variant="outline"
          >
            <MapPin className="h-4 w-4 mr-2" />
            AI Route Optimizer
          </Button>
          <Button
            data-testid="add-balance-btn"
            onClick={() => setShowPaymentModal(true)}
            variant="outline"
            className="border-green-600 text-green-600 hover:bg-green-50"
          >
            <Wallet className="h-4 w-4 mr-2" />
            Add Balance
          </Button>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview" data-testid="overview-tab">Overview</TabsTrigger>
            <TabsTrigger value="trips" data-testid="trips-tab">Trips</TabsTrigger>
            <TabsTrigger value="drivers" data-testid="drivers-tab">Drivers</TabsTrigger>
            <TabsTrigger value="vehicles" data-testid="vehicles-tab">Vehicles</TabsTrigger>
            <TabsTrigger value="returns" data-testid="returns-tab">Return Loads</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6 mt-6">
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Trips</CardTitle>
                </CardHeader>
                <CardContent>
                  {trips.slice(0, 5).map((trip) => (
                    <div key={trip.id} className="flex justify-between items-center py-3 border-b last:border-b-0">
                      <div>
                        <p className="font-semibold">{trip.origin} → {trip.destination}</p>
                        <p className="text-sm text-gray-600">{trip.status}</p>
                      </div>
                      <p className="text-sm font-semibold">₹{trip.total_expenses}</p>
                    </div>
                  ))}
                  {trips.length === 0 && (
                    <p className="text-center text-gray-500 py-4">No trips yet</p>
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
                      <div>
                        <p className="font-semibold capitalize">{expense.category}</p>
                        <p className="text-sm text-gray-600">{expense.description || 'No description'}</p>
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
                <CardTitle>All Trips</CardTitle>
                <CardDescription>Manage and track all trips</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {trips.map((trip) => (
                    <Card key={trip.id} className="p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-semibold text-lg">{trip.origin} → {trip.destination}</p>
                          <p className="text-sm text-gray-600 mt-1">Status: <span className="capitalize font-semibold">{trip.status}</span></p>
                          <p className="text-sm text-gray-600">Distance: {trip.estimated_distance || 'N/A'} km</p>
                          {trip.cargo_details && <p className="text-sm text-gray-600">Cargo: {trip.cargo_details}</p>}
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-600">Total Expenses</p>
                          <p className="text-2xl font-bold text-red-600">₹{trip.total_expenses}</p>
                        </div>
                      </div>
                    </Card>
                  ))}
                  {trips.length === 0 && (
                    <p className="text-center text-gray-500 py-8">No trips created yet. Create your first trip!</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="drivers" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Drivers</CardTitle>
                <CardDescription>Manage your driver fleet</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {drivers.map((driver) => (
                    <Card key={driver.id} className="p-4">
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-semibold">{driver.name}</p>
                            <p className="text-sm text-gray-600">{driver.email}</p>
                            <p className="text-sm text-gray-600">{driver.phone || 'No phone'}</p>
                          </div>
                          <Users className="h-8 w-8 text-blue-600" />
                        </div>
                        <Button
                          data-testid={`manage-wallet-${driver.id}`}
                          variant="outline"
                          size="sm"
                          onClick={async () => {
                            const fuel = prompt('Enter Fuel Limit (₹):', '0');
                            const toll = prompt('Enter Toll Limit (₹):', '0');
                            const food = prompt('Enter Food Limit (₹):', '0');
                            const lodging = prompt('Enter Lodging Limit (₹):', '0');
                            const repair = prompt('Enter Repair Limit (₹):', '0');
                            
                            if (fuel !== null) {
                              try {
                                await axios.put(
                                  `${API}/wallet/${driver.id}/limits?fuel_limit=${fuel}&toll_limit=${toll}&food_limit=${food}&lodging_limit=${lodging}&repair_limit=${repair}`,
                                  {},
                                  axiosConfig
                                );
                                toast.success('Wallet limits updated!');
                                fetchDashboardData();
                              } catch (error) {
                                toast.error(error.response?.data?.detail || 'Failed to update limits');
                              }
                            }
                          }}
                          className="w-full"
                        >
                          <Wallet className="h-4 w-4 mr-2" />
                          Manage Wallet Limits
                        </Button>
                      </div>
                    </Card>
                  ))}
                  {drivers.length === 0 && (
                    <p className="text-center text-gray-500 py-8">No drivers yet. Share your Fleet Owner ID with drivers to get started!</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="vehicles" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Vehicles</CardTitle>
                <CardDescription>Manage your vehicle fleet</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  {vehicles.map((vehicle) => (
                    <Card key={vehicle.id} className="p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-semibold text-lg">{vehicle.registration_number}</p>
                          <p className="text-sm text-gray-600 capitalize">Type: {vehicle.vehicle_type}</p>
                          {vehicle.model && <p className="text-sm text-gray-600">Model: {vehicle.model}</p>}
                          {vehicle.capacity && <p className="text-sm text-gray-600">Capacity: {vehicle.capacity} tons</p>}
                          <p className="text-sm font-semibold mt-2 capitalize">Status: {vehicle.status}</p>
                        </div>
                        <Truck className="h-8 w-8 text-purple-600" />
                      </div>
                    </Card>
                  ))}
                  {vehicles.length === 0 && (
                    <p className="text-center text-gray-500 py-8 col-span-2">No vehicles added yet. Add your first vehicle!</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="returns" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Return Load Marketplace</CardTitle>
                <CardDescription>Available return loads to minimize empty trips</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {returnLoads.map((load) => (
                    <Card key={load.id} className="p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-semibold text-lg">{load.origin} → {load.destination}</p>
                          {load.cargo_type && <p className="text-sm text-gray-600">Cargo: {load.cargo_type}</p>}
                          {load.weight && <p className="text-sm text-gray-600">Weight: {load.weight} kg</p>}
                          {load.pickup_date && <p className="text-sm text-gray-600">Pickup: {load.pickup_date}</p>}
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-600">Offered Price</p>
                          <p className="text-2xl font-bold text-green-600">₹{load.offered_price}</p>
                        </div>
                      </div>
                    </Card>
                  ))}
                  {returnLoads.length === 0 && (
                    <p className="text-center text-gray-500 py-8">No return loads available. Post a load to get started!</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Create Trip Modal */}
      {showTripModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-lg glass animate-fade-in">
            <CardHeader>
              <CardTitle>Create New Trip</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateTrip} className="space-y-4">
                <div>
                  <Label>Driver</Label>
                  <select
                    data-testid="trip-driver-select"
                    className="w-full border border-gray-300 rounded-md p-2"
                    value={tripData.driver_id}
                    onChange={(e) => setTripData({ ...tripData, driver_id: e.target.value })}
                    required
                  >
                    <option value="">Select Driver</option>
                    {drivers.map((d) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label>Vehicle</Label>
                  <select
                    data-testid="trip-vehicle-select"
                    className="w-full border border-gray-300 rounded-md p-2"
                    value={tripData.vehicle_id}
                    onChange={(e) => setTripData({ ...tripData, vehicle_id: e.target.value })}
                    required
                  >
                    <option value="">Select Vehicle</option>
                    {vehicles.map((v) => (
                      <option key={v.id} value={v.id}>{v.registration_number}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label>Origin</Label>
                  <Input
                    data-testid="trip-origin-input"
                    placeholder="Mumbai"
                    value={tripData.origin}
                    onChange={(e) => setTripData({ ...tripData, origin: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label>Destination</Label>
                  <Input
                    data-testid="trip-destination-input"
                    placeholder="Delhi"
                    value={tripData.destination}
                    onChange={(e) => setTripData({ ...tripData, destination: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label>Cargo Details</Label>
                  <Input
                    data-testid="trip-cargo-input"
                    placeholder="Electronics"
                    value={tripData.cargo_details}
                    onChange={(e) => setTripData({ ...tripData, cargo_details: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Estimated Distance (km)</Label>
                  <Input
                    data-testid="trip-distance-input"
                    type="number"
                    placeholder="1400"
                    value={tripData.estimated_distance}
                    onChange={(e) => setTripData({ ...tripData, estimated_distance: e.target.value })}
                  />
                </div>
                <div className="flex space-x-2">
                  <Button data-testid="trip-submit-btn" type="submit" className="flex-1">
                    Create Trip
                  </Button>
                  <Button
                    data-testid="trip-cancel-btn"
                    type="button"
                    variant="outline"
                    onClick={() => setShowTripModal(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Add Vehicle Modal */}
      {showVehicleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-lg glass animate-fade-in">
            <CardHeader>
              <CardTitle>Add New Vehicle</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateVehicle} className="space-y-4">
                <div>
                  <Label>Registration Number</Label>
                  <Input
                    data-testid="vehicle-reg-input"
                    placeholder="MH-01-AB-1234"
                    value={vehicleData.registration_number}
                    onChange={(e) => setVehicleData({ ...vehicleData, registration_number: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label>Vehicle Type</Label>
                  <select
                    data-testid="vehicle-type-select"
                    className="w-full border border-gray-300 rounded-md p-2"
                    value={vehicleData.vehicle_type}
                    onChange={(e) => setVehicleData({ ...vehicleData, vehicle_type: e.target.value })}
                  >
                    <option value="truck">Truck</option>
                    <option value="trailer">Trailer</option>
                    <option value="van">Van</option>
                  </select>
                </div>
                <div>
                  <Label>Capacity (tons)</Label>
                  <Input
                    data-testid="vehicle-capacity-input"
                    type="number"
                    placeholder="10"
                    value={vehicleData.capacity}
                    onChange={(e) => setVehicleData({ ...vehicleData, capacity: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Model</Label>
                  <Input
                    data-testid="vehicle-model-input"
                    placeholder="Tata LPT 1918"
                    value={vehicleData.model}
                    onChange={(e) => setVehicleData({ ...vehicleData, model: e.target.value })}
                  />
                </div>
                <div className="flex space-x-2">
                  <Button data-testid="vehicle-submit-btn" type="submit" className="flex-1">
                    Add Vehicle
                  </Button>
                  <Button
                    data-testid="vehicle-cancel-btn"
                    type="button"
                    variant="outline"
                    onClick={() => setShowVehicleModal(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Return Load Modal */}
      {showReturnLoadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-lg glass animate-fade-in">
            <CardHeader>
              <CardTitle>Post Return Load</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateReturnLoad} className="space-y-4">
                <div>
                  <Label>Origin</Label>
                  <Input
                    data-testid="load-origin-input"
                    placeholder="Delhi"
                    value={returnLoadData.origin}
                    onChange={(e) => setReturnLoadData({ ...returnLoadData, origin: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label>Destination</Label>
                  <Input
                    data-testid="load-destination-input"
                    placeholder="Mumbai"
                    value={returnLoadData.destination}
                    onChange={(e) => setReturnLoadData({ ...returnLoadData, destination: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label>Cargo Type</Label>
                  <Input
                    data-testid="load-cargo-input"
                    placeholder="Construction Materials"
                    value={returnLoadData.cargo_type}
                    onChange={(e) => setReturnLoadData({ ...returnLoadData, cargo_type: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Weight (kg)</Label>
                  <Input
                    data-testid="load-weight-input"
                    type="number"
                    placeholder="5000"
                    value={returnLoadData.weight}
                    onChange={(e) => setReturnLoadData({ ...returnLoadData, weight: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Offered Price (₹)</Label>
                  <Input
                    data-testid="load-price-input"
                    type="number"
                    placeholder="25000"
                    value={returnLoadData.offered_price}
                    onChange={(e) => setReturnLoadData({ ...returnLoadData, offered_price: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label>Pickup Date</Label>
                  <Input
                    data-testid="load-date-input"
                    type="date"
                    value={returnLoadData.pickup_date}
                    onChange={(e) => setReturnLoadData({ ...returnLoadData, pickup_date: e.target.value })}
                  />
                </div>
                <div className="flex space-x-2">
                  <Button data-testid="load-submit-btn" type="submit" className="flex-1">
                    Post Load
                  </Button>
                  <Button
                    data-testid="load-cancel-btn"
                    type="button"
                    variant="outline"
                    onClick={() => setShowReturnLoadModal(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* AI Route Optimize Modal */}
      {showRouteOptimize && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-lg glass animate-fade-in max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>AI Route Optimizer</CardTitle>
              <CardDescription>Get intelligent route suggestions and cost predictions</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleRouteOptimize} className="space-y-4">
                <div>
                  <Label>Origin</Label>
                  <Input
                    data-testid="ai-origin-input"
                    placeholder="Mumbai"
                    value={routeOptimizeData.origin}
                    onChange={(e) => setRouteOptimizeData({ ...routeOptimizeData, origin: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label>Destination</Label>
                  <Input
                    data-testid="ai-destination-input"
                    placeholder="Delhi"
                    value={routeOptimizeData.destination}
                    onChange={(e) => setRouteOptimizeData({ ...routeOptimizeData, destination: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label>Vehicle Type</Label>
                  <select
                    data-testid="ai-vehicle-select"
                    className="w-full border border-gray-300 rounded-md p-2"
                    value={routeOptimizeData.vehicle_type}
                    onChange={(e) => setRouteOptimizeData({ ...routeOptimizeData, vehicle_type: e.target.value })}
                  >
                    <option value="truck">Truck</option>
                    <option value="trailer">Trailer</option>
                    <option value="van">Van</option>
                  </select>
                </div>
                <div>
                  <Label>Cargo Details</Label>
                  <Input
                    data-testid="ai-cargo-input"
                    placeholder="Electronics, Fragile"
                    value={routeOptimizeData.cargo_details}
                    onChange={(e) => setRouteOptimizeData({ ...routeOptimizeData, cargo_details: e.target.value })}
                  />
                </div>
                <Button
                  data-testid="ai-optimize-btn"
                  type="submit"
                  className="w-full"
                  disabled={aiLoading}
                >
                  {aiLoading ? 'Optimizing...' : 'Get AI Suggestions'}
                </Button>
              </form>

              {aiSuggestion && (
                <div className="mt-6 p-4 bg-blue-50 rounded-lg" data-testid="ai-suggestion-result">
                  <h4 className="font-semibold mb-2 flex items-center">
                    <MapPin className="h-4 w-4 mr-2 text-blue-600" />
                    AI Recommendations
                  </h4>
                  <div className="text-sm whitespace-pre-wrap">{aiSuggestion}</div>
                </div>
              )}

              <Button
                data-testid="ai-close-btn"
                variant="outline"
                onClick={() => {
                  setShowRouteOptimize(false);
                  setAiSuggestion(null);
                }}
                className="w-full mt-4"
              >
                Close
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md glass animate-fade-in">
            <CardHeader>
              <CardTitle>Add Balance to Driver Wallets</CardTitle>
              <CardDescription>Choose a top-up package</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Card
                data-testid="package-small"
                className="p-4 cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-blue-500"
                onClick={() => handlePayment('small')}
              >
                <h3 className="font-semibold text-lg">Small Package</h3>
                <p className="text-3xl font-bold text-blue-600">₹500</p>
                <p className="text-sm text-gray-600">For short trips</p>
              </Card>

              <Card
                data-testid="package-medium"
                className="p-4 cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-blue-500"
                onClick={() => handlePayment('medium')}
              >
                <h3 className="font-semibold text-lg">Medium Package</h3>
                <p className="text-3xl font-bold text-blue-600">₹1,000</p>
                <p className="text-sm text-gray-600">Most popular</p>
              </Card>

              <Card
                data-testid="package-large"
                className="p-4 cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-blue-500"
                onClick={() => handlePayment('large')}
              >
                <h3 className="font-semibold text-lg">Large Package</h3>
                <p className="text-3xl font-bold text-blue-600">₹2,000</p>
                <p className="text-sm text-gray-600">For long hauls</p>
              </Card>

              <Button
                data-testid="payment-cancel-btn"
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

export default FleetOwnerDashboard;
