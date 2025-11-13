import React, { useState } from 'react';
import axios from 'axios';
import { AuthContext } from '../App';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { toast } from 'sonner';
import { Truck, Wallet, BarChart3, TrendingUp, Shield, MapPin } from 'lucide-react';

const LandingPage = () => {
  const { login, API } = React.useContext(AuthContext);
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [loading, setLoading] = useState(false);

  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [registerData, setRegisterData] = useState({
    email: '',
    password: '',
    name: '',
    role: 'fleet_owner',
    phone: ''
  });

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await axios.post(`${API}/auth/login`, loginData);
      login(response.data.token, response.data.user);
      toast.success('Login successful!');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await axios.post(`${API}/auth/register`, registerData);
      login(response.data.token, response.data.user);
      toast.success('Registration successful!');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-purple-50">
        {/* Navigation */}
        <nav className="container mx-auto px-6 py-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <Truck className="h-8 w-8 text-blue-600" />
              <span className="text-2xl font-bold gradient-text">TransOps</span>
            </div>
            <Button
              data-testid="get-started-btn"
              onClick={() => setShowAuth(true)}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-2 rounded-full"
            >
              Get Started
            </Button>
          </div>
        </nav>

        {/* Hero Content */}
        <div className="container mx-auto px-6 py-20">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6 animate-fade-in">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight">
                Complete Digital Control for
                <span className="gradient-text"> Indian Road Transport</span>
              </h1>
              <p className="text-base md:text-lg text-gray-600">
                Eliminate cash dependency, track every expense, optimize routes with AI, and maximize profitability. All in one unified platform.
              </p>
              <div className="flex flex-wrap gap-4">
                <Button
                  data-testid="fleet-owner-signup-btn"
                  onClick={() => {
                    setShowAuth(true);
                    setAuthMode('register');
                    setRegisterData({ ...registerData, role: 'fleet_owner' });
                  }}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-6 text-lg rounded-full"
                >
                  For Fleet Owners
                </Button>
                <Button
                  data-testid="driver-signup-btn"
                  onClick={() => {
                    setShowAuth(true);
                    setAuthMode('register');
                    setRegisterData({ ...registerData, role: 'driver' });
                  }}
                  variant="outline"
                  className="px-8 py-6 text-lg border-2 border-blue-600 text-blue-600 hover:bg-blue-50 rounded-full"
                >
                  For Drivers
                </Button>
              </div>
            </div>

            {/* Features Grid */}
            <div className="grid grid-cols-2 gap-4 animate-slide-in">
              <Card className="card-hover glass">
                <CardContent className="p-6">
                  <Wallet className="h-10 w-10 text-blue-600 mb-3" />
                  <h3 className="font-semibold text-lg mb-2">Digital Wallets</h3>
                  <p className="text-sm text-gray-600">Category-based spending limits</p>
                </CardContent>
              </Card>
              <Card className="card-hover glass">
                <CardContent className="p-6">
                  <BarChart3 className="h-10 w-10 text-purple-600 mb-3" />
                  <h3 className="font-semibold text-lg mb-2">Live Dashboard</h3>
                  <p className="text-sm text-gray-600">Real-time expense tracking</p>
                </CardContent>
              </Card>
              <Card className="card-hover glass">
                <CardContent className="p-6">
                  <TrendingUp className="h-10 w-10 text-green-600 mb-3" />
                  <h3 className="font-semibold text-lg mb-2">AI Optimization</h3>
                  <p className="text-sm text-gray-600">Smart route planning</p>
                </CardContent>
              </Card>
              <Card className="card-hover glass">
                <CardContent className="p-6">
                  <Shield className="h-10 w-10 text-orange-600 mb-3" />
                  <h3 className="font-semibold text-lg mb-2">Fraud Prevention</h3>
                  <p className="text-sm text-gray-600">Complete transparency</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="container mx-auto px-6 py-20">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">Why TransOps?</h2>
          <p className="text-lg text-gray-600">Built specifically for Indian road transport operations</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <Card className="card-hover">
            <CardHeader>
              <CardTitle>Unified Platform</CardTitle>
              <CardDescription>
                Replace Happay, FASTag, and multiple fuel apps with one solution
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  Fuel, tolls, food, lodging, repairs in one wallet
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  Works across all fuel providers
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  Automated expense reconciliation
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="card-hover">
            <CardHeader>
              <CardTitle>Driver Empowerment</CardTitle>
              <CardDescription>
                Eliminate cash dependency and build trust
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  Digital wallet with category limits
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  Performance-based rewards
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  Transparent expense tracking
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="card-hover">
            <CardHeader>
              <CardTitle>AI-Powered Insights</CardTitle>
              <CardDescription>
                Optimize operations with intelligent suggestions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  Route optimization for fuel efficiency
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  Trip cost predictions
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  Return load marketplace
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Auth Modal */}
      {showAuth && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md glass animate-fade-in">
            <CardHeader>
              <CardTitle className="text-2xl">
                {authMode === 'login' ? 'Welcome Back' : 'Create Account'}
              </CardTitle>
              <CardDescription>
                {authMode === 'login'
                  ? 'Sign in to access your dashboard'
                  : 'Join TransOps and transform your operations'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={authMode} onValueChange={setAuthMode}>
                <TabsList className="grid w-full grid-cols-2 mb-4">
                  <TabsTrigger value="login" data-testid="login-tab">Login</TabsTrigger>
                  <TabsTrigger value="register" data-testid="register-tab">Register</TabsTrigger>
                </TabsList>

                <TabsContent value="login">
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                      <Label htmlFor="login-email">Email</Label>
                      <Input
                        id="login-email"
                        data-testid="login-email-input"
                        type="email"
                        placeholder="your@email.com"
                        value={loginData.email}
                        onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="login-password">Password</Label>
                      <Input
                        id="login-password"
                        data-testid="login-password-input"
                        type="password"
                        placeholder="••••••••"
                        value={loginData.password}
                        onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                        required
                      />
                    </div>
                    <Button
                      data-testid="login-submit-btn"
                      type="submit"
                      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                      disabled={loading}
                    >
                      {loading ? 'Signing in...' : 'Sign In'}
                    </Button>
                  </form>
                </TabsContent>

                <TabsContent value="register">
                  <form onSubmit={handleRegister} className="space-y-4">
                    <div>
                      <Label htmlFor="register-name">Full Name</Label>
                      <Input
                        id="register-name"
                        data-testid="register-name-input"
                        placeholder="John Doe"
                        value={registerData.name}
                        onChange={(e) => setRegisterData({ ...registerData, name: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="register-email">Email</Label>
                      <Input
                        id="register-email"
                        data-testid="register-email-input"
                        type="email"
                        placeholder="your@email.com"
                        value={registerData.email}
                        onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="register-phone">Phone</Label>
                      <Input
                        id="register-phone"
                        data-testid="register-phone-input"
                        placeholder="+91 98765 43210"
                        value={registerData.phone}
                        onChange={(e) => setRegisterData({ ...registerData, phone: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="register-password">Password</Label>
                      <Input
                        id="register-password"
                        data-testid="register-password-input"
                        type="password"
                        placeholder="••••••••"
                        value={registerData.password}
                        onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="register-role">I am a</Label>
                      <select
                        id="register-role"
                        data-testid="register-role-select"
                        className="w-full border border-gray-300 rounded-md p-2"
                        value={registerData.role}
                        onChange={(e) => setRegisterData({ ...registerData, role: e.target.value })}
                      >
                        <option value="fleet_owner">Fleet Owner</option>
                        <option value="driver">Driver</option>
                      </select>
                    </div>
                    {registerData.role === 'driver' && (
                      <div>
                        <Label htmlFor="register-fleet-owner-id">Fleet Owner ID (Required for drivers)</Label>
                        <Input
                          id="register-fleet-owner-id"
                          data-testid="register-fleet-owner-id-input"
                          placeholder="Enter your fleet owner's ID"
                          value={registerData.fleet_owner_id || ''}
                          onChange={(e) => setRegisterData({ ...registerData, fleet_owner_id: e.target.value })}
                          required={registerData.role === 'driver'}
                        />
                        <p className="text-xs text-gray-500 mt-1">Ask your fleet owner for their ID</p>
                      </div>
                    )}
                    <Button
                      data-testid="register-submit-btn"
                      type="submit"
                      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                      disabled={loading}
                    >
                      {loading ? 'Creating account...' : 'Create Account'}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>

              <Button
                data-testid="close-auth-modal-btn"
                variant="ghost"
                onClick={() => setShowAuth(false)}
                className="w-full mt-4"
              >
                Close
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default LandingPage;
