from fastapi import FastAPI, APIRouter, HTTPException, Depends, Header, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
import jwt
import bcrypt
from emergentintegrations.llm.chat import LlmChat, UserMessage
from emergentintegrations.payments.stripe.checkout import StripeCheckout, CheckoutSessionResponse, CheckoutStatusResponse, CheckoutSessionRequest

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Configuration
JWT_SECRET = os.environ.get('JWT_SECRET', 'transops_secret_key_2025')
JWT_ALGORITHM = 'HS256'
JWT_EXPIRATION_HOURS = 168  # 7 days

# Create the main app
app = FastAPI()
api_router = APIRouter(prefix="/api")
security = HTTPBearer()

# Logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ==================== Models ====================

class UserRegister(BaseModel):
    email: str
    password: str
    name: str
    role: str  # 'fleet_owner' or 'driver'
    phone: Optional[str] = None
    fleet_owner_id: Optional[str] = None  # For drivers to link to fleet owner

class UserLogin(BaseModel):
    email: str
    password: str

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: str
    name: str
    role: str
    phone: Optional[str] = None
    fleet_owner_id: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class WalletCreate(BaseModel):
    driver_id: str
    initial_balance: float = 0.0

class Wallet(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    driver_id: str
    balance: float
    fuel_limit: float = 0.0
    toll_limit: float = 0.0
    food_limit: float = 0.0
    lodging_limit: float = 0.0
    repair_limit: float = 0.0
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class WalletTopup(BaseModel):
    amount: float
    category: Optional[str] = None  # fuel, toll, food, lodging, repair

class ExpenseCreate(BaseModel):
    trip_id: str
    driver_id: str
    category: str  # fuel, toll, food, lodging, repair
    amount: float
    description: Optional[str] = None
    location: Optional[str] = None

class Expense(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    trip_id: str
    driver_id: str
    category: str
    amount: float
    description: Optional[str] = None
    location: Optional[str] = None
    status: str = "approved"  # approved, pending, rejected
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class TripCreate(BaseModel):
    driver_id: str
    vehicle_id: str
    origin: str
    destination: str
    cargo_details: Optional[str] = None
    estimated_distance: Optional[float] = None

class Trip(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    fleet_owner_id: str
    driver_id: str
    vehicle_id: str
    origin: str
    destination: str
    cargo_details: Optional[str] = None
    estimated_distance: Optional[float] = None
    actual_distance: Optional[float] = None
    status: str = "planned"  # planned, in_progress, completed, cancelled
    total_expenses: float = 0.0
    revenue: Optional[float] = None
    profitability: Optional[float] = None
    ai_route_suggestion: Optional[str] = None
    ai_cost_prediction: Optional[float] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None

class VehicleCreate(BaseModel):
    registration_number: str
    vehicle_type: str
    capacity: Optional[float] = None
    model: Optional[str] = None

class Vehicle(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    fleet_owner_id: str
    registration_number: str
    vehicle_type: str
    capacity: Optional[float] = None
    model: Optional[str] = None
    status: str = "available"  # available, in_use, maintenance
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ReturnLoadCreate(BaseModel):
    origin: str
    destination: str
    cargo_type: Optional[str] = None
    weight: Optional[float] = None
    offered_price: float
    pickup_date: Optional[str] = None

class ReturnLoad(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    fleet_owner_id: str
    origin: str
    destination: str
    cargo_type: Optional[str] = None
    weight: Optional[float] = None
    offered_price: float
    pickup_date: Optional[str] = None
    status: str = "available"  # available, booked, completed
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class DriverPerformance(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    driver_id: str
    total_trips: int = 0
    total_distance: float = 0.0
    average_fuel_efficiency: float = 0.0
    safety_score: float = 100.0
    reward_points: int = 0
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class PaymentTransaction(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    session_id: str
    amount: float
    currency: str = "usd"
    payment_status: str = "pending"  # pending, paid, failed, expired
    status: str = "initiated"  # initiated, completed, failed
    metadata: Optional[Dict[str, Any]] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class CheckoutRequest(BaseModel):
    package: str  # small, medium, large

class AIRouteRequest(BaseModel):
    origin: str
    destination: str
    vehicle_type: str
    cargo_details: Optional[str] = None

# ==================== Helper Functions ====================

def create_token(user_id: str, email: str, role: str) -> str:
    payload = {
        'user_id': user_id,
        'email': email,
        'role': role,
        'exp': datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def verify_token(token: str) -> Dict:
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    payload = verify_token(token)
    user = await db.users.find_one({'id': payload['user_id']}, {'_id': 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

# ==================== Auth Routes ====================

@api_router.post("/auth/register")
async def register(user_data: UserRegister):
    # Check if user exists
    existing_user = await db.users.find_one({'email': user_data.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Validate fleet owner ID for drivers
    if user_data.role == 'driver' and user_data.fleet_owner_id:
        fleet_owner = await db.users.find_one({'id': user_data.fleet_owner_id, 'role': 'fleet_owner'})
        if not fleet_owner:
            raise HTTPException(status_code=400, detail="Invalid Fleet Owner ID")
    
    # Hash password
    hashed_password = bcrypt.hashpw(user_data.password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    
    # Create user
    user = User(
        email=user_data.email,
        name=user_data.name,
        role=user_data.role,
        phone=user_data.phone,
        fleet_owner_id=user_data.fleet_owner_id
    )
    
    user_dict = user.model_dump()
    user_dict['password'] = hashed_password
    user_dict['created_at'] = user_dict['created_at'].isoformat()
    
    await db.users.insert_one(user_dict)
    
    # If driver, create wallet
    if user_data.role == 'driver':
        wallet = Wallet(driver_id=user.id, balance=0.0)
        wallet_dict = wallet.model_dump()
        wallet_dict['created_at'] = wallet_dict['created_at'].isoformat()
        await db.wallets.insert_one(wallet_dict)
        
        # Create performance record
        performance = DriverPerformance(driver_id=user.id)
        perf_dict = performance.model_dump()
        perf_dict['created_at'] = perf_dict['created_at'].isoformat()
        perf_dict['updated_at'] = perf_dict['updated_at'].isoformat()
        await db.driver_performance.insert_one(perf_dict)
    
    token = create_token(user.id, user.email, user.role)
    
    return {
        'token': token,
        'user': user.model_dump()
    }

@api_router.post("/auth/login")
async def login(credentials: UserLogin):
    user = await db.users.find_one({'email': credentials.email})
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Verify password
    if not bcrypt.checkpw(credentials.password.encode('utf-8'), user['password'].encode('utf-8')):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_token(user['id'], user['email'], user['role'])
    
    del user['password']
    del user['_id']
    
    return {
        'token': token,
        'user': user
    }

@api_router.get("/auth/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    return current_user

# ==================== Wallet Routes ====================

@api_router.get("/wallet")
async def get_wallet(current_user: dict = Depends(get_current_user)):
    if current_user['role'] != 'driver':
        raise HTTPException(status_code=403, detail="Only drivers have wallets")
    
    wallet = await db.wallets.find_one({'driver_id': current_user['id']}, {'_id': 0})
    if not wallet:
        raise HTTPException(status_code=404, detail="Wallet not found")
    
    return wallet

@api_router.post("/wallet/topup")
async def topup_wallet(topup_data: WalletTopup, current_user: dict = Depends(get_current_user)):
    if current_user['role'] == 'driver':
        raise HTTPException(status_code=403, detail="Drivers cannot topup their own wallets")
    
    # Find driver wallet (assuming fleet owner is topping up driver's wallet)
    # In real scenario, you'd pass driver_id
    return {"message": "Use payment checkout to add balance"}

@api_router.put("/wallet/{driver_id}/limits")
async def update_wallet_limits(
    driver_id: str,
    fuel_limit: Optional[float] = None,
    toll_limit: Optional[float] = None,
    food_limit: Optional[float] = None,
    lodging_limit: Optional[float] = None,
    repair_limit: Optional[float] = None,
    current_user: dict = Depends(get_current_user)
):
    if current_user['role'] != 'fleet_owner':
        raise HTTPException(status_code=403, detail="Only fleet owners can update limits")
    
    update_data = {}
    if fuel_limit is not None:
        update_data['fuel_limit'] = fuel_limit
    if toll_limit is not None:
        update_data['toll_limit'] = toll_limit
    if food_limit is not None:
        update_data['food_limit'] = food_limit
    if lodging_limit is not None:
        update_data['lodging_limit'] = lodging_limit
    if repair_limit is not None:
        update_data['repair_limit'] = repair_limit
    
    await db.wallets.update_one({'driver_id': driver_id}, {'$set': update_data})
    
    return {"message": "Wallet limits updated successfully"}

# ==================== Trip Routes ====================

@api_router.post("/trips")
async def create_trip(trip_data: TripCreate, current_user: dict = Depends(get_current_user)):
    if current_user['role'] != 'fleet_owner':
        raise HTTPException(status_code=403, detail="Only fleet owners can create trips")
    
    trip = Trip(
        fleet_owner_id=current_user['id'],
        driver_id=trip_data.driver_id,
        vehicle_id=trip_data.vehicle_id,
        origin=trip_data.origin,
        destination=trip_data.destination,
        cargo_details=trip_data.cargo_details,
        estimated_distance=trip_data.estimated_distance
    )
    
    trip_dict = trip.model_dump()
    trip_dict['created_at'] = trip_dict['created_at'].isoformat()
    if trip_dict['started_at']:
        trip_dict['started_at'] = trip_dict['started_at'].isoformat()
    if trip_dict['completed_at']:
        trip_dict['completed_at'] = trip_dict['completed_at'].isoformat()
    
    await db.trips.insert_one(trip_dict)
    
    return trip.model_dump()

@api_router.get("/trips")
async def get_trips(current_user: dict = Depends(get_current_user)):
    if current_user['role'] == 'fleet_owner':
        trips = await db.trips.find({'fleet_owner_id': current_user['id']}, {'_id': 0}).to_list(1000)
    else:
        trips = await db.trips.find({'driver_id': current_user['id']}, {'_id': 0}).to_list(1000)
    
    return trips

@api_router.get("/trips/{trip_id}")
async def get_trip(trip_id: str, current_user: dict = Depends(get_current_user)):
    trip = await db.trips.find_one({'id': trip_id}, {'_id': 0})
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    
    return trip

@api_router.put("/trips/{trip_id}/status")
async def update_trip_status(trip_id: str, status: str, current_user: dict = Depends(get_current_user)):
    update_data = {'status': status}
    
    if status == 'in_progress':
        update_data['started_at'] = datetime.now(timezone.utc).isoformat()
    elif status == 'completed':
        update_data['completed_at'] = datetime.now(timezone.utc).isoformat()
    
    await db.trips.update_one({'id': trip_id}, {'$set': update_data})
    
    return {"message": "Trip status updated"}

# ==================== Expense Routes ====================

@api_router.post("/expenses")
async def create_expense(expense_data: ExpenseCreate, current_user: dict = Depends(get_current_user)):
    # Check wallet limits
    wallet = await db.wallets.find_one({'driver_id': expense_data.driver_id})
    if not wallet:
        raise HTTPException(status_code=404, detail="Wallet not found")
    
    category_limit_map = {
        'fuel': wallet.get('fuel_limit', 0),
        'toll': wallet.get('toll_limit', 0),
        'food': wallet.get('food_limit', 0),
        'lodging': wallet.get('lodging_limit', 0),
        'repair': wallet.get('repair_limit', 0)
    }
    
    limit = category_limit_map.get(expense_data.category, 0)
    
    if expense_data.amount > limit:
        raise HTTPException(status_code=400, detail=f"Expense exceeds {expense_data.category} limit")
    
    if wallet['balance'] < expense_data.amount:
        raise HTTPException(status_code=400, detail="Insufficient wallet balance")
    
    expense = Expense(
        trip_id=expense_data.trip_id,
        driver_id=expense_data.driver_id,
        category=expense_data.category,
        amount=expense_data.amount,
        description=expense_data.description,
        location=expense_data.location
    )
    
    expense_dict = expense.model_dump()
    expense_dict['created_at'] = expense_dict['created_at'].isoformat()
    
    await db.expenses.insert_one(expense_dict)
    
    # Deduct from wallet
    await db.wallets.update_one(
        {'driver_id': expense_data.driver_id},
        {'$inc': {'balance': -expense_data.amount}}
    )
    
    # Update trip expenses
    await db.trips.update_one(
        {'id': expense_data.trip_id},
        {'$inc': {'total_expenses': expense_data.amount}}
    )
    
    return expense.model_dump()

@api_router.get("/expenses")
async def get_expenses(trip_id: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    query = {}
    
    if trip_id:
        query['trip_id'] = trip_id
    
    if current_user['role'] == 'driver':
        query['driver_id'] = current_user['id']
    elif current_user['role'] == 'fleet_owner':
        # Get all expenses for owner's trips
        trip_ids = await db.trips.find({'fleet_owner_id': current_user['id']}, {'id': 1, '_id': 0}).to_list(1000)
        trip_id_list = [t['id'] for t in trip_ids]
        query['trip_id'] = {'$in': trip_id_list}
    
    expenses = await db.expenses.find(query, {'_id': 0}).to_list(1000)
    
    return expenses

# ==================== Vehicle Routes ====================

@api_router.post("/vehicles")
async def create_vehicle(vehicle_data: VehicleCreate, current_user: dict = Depends(get_current_user)):
    if current_user['role'] != 'fleet_owner':
        raise HTTPException(status_code=403, detail="Only fleet owners can add vehicles")
    
    vehicle = Vehicle(
        fleet_owner_id=current_user['id'],
        registration_number=vehicle_data.registration_number,
        vehicle_type=vehicle_data.vehicle_type,
        capacity=vehicle_data.capacity,
        model=vehicle_data.model
    )
    
    vehicle_dict = vehicle.model_dump()
    vehicle_dict['created_at'] = vehicle_dict['created_at'].isoformat()
    
    await db.vehicles.insert_one(vehicle_dict)
    
    return vehicle.model_dump()

@api_router.get("/vehicles")
async def get_vehicles(current_user: dict = Depends(get_current_user)):
    if current_user['role'] != 'fleet_owner':
        raise HTTPException(status_code=403, detail="Only fleet owners can view vehicles")
    
    vehicles = await db.vehicles.find({'fleet_owner_id': current_user['id']}, {'_id': 0}).to_list(1000)
    
    return vehicles

# ==================== Return Load Routes ====================

@api_router.post("/return-loads")
async def create_return_load(load_data: ReturnLoadCreate, current_user: dict = Depends(get_current_user)):
    if current_user['role'] != 'fleet_owner':
        raise HTTPException(status_code=403, detail="Only fleet owners can post return loads")
    
    return_load = ReturnLoad(
        fleet_owner_id=current_user['id'],
        origin=load_data.origin,
        destination=load_data.destination,
        cargo_type=load_data.cargo_type,
        weight=load_data.weight,
        offered_price=load_data.offered_price,
        pickup_date=load_data.pickup_date
    )
    
    load_dict = return_load.model_dump()
    load_dict['created_at'] = load_dict['created_at'].isoformat()
    
    await db.return_loads.insert_one(load_dict)
    
    return return_load.model_dump()

@api_router.get("/return-loads")
async def get_return_loads(current_user: dict = Depends(get_current_user)):
    loads = await db.return_loads.find({'status': 'available'}, {'_id': 0}).to_list(1000)
    
    return loads

@api_router.put("/return-loads/{load_id}/book")
async def book_return_load(load_id: str, current_user: dict = Depends(get_current_user)):
    if current_user['role'] != 'fleet_owner':
        raise HTTPException(status_code=403, detail="Only fleet owners can book loads")
    
    await db.return_loads.update_one(
        {'id': load_id},
        {'$set': {'status': 'booked', 'booked_by': current_user['id']}}
    )
    
    return {"message": "Return load booked successfully"}

# ==================== Driver Performance Routes ====================

@api_router.get("/performance/{driver_id}")
async def get_driver_performance(driver_id: str, current_user: dict = Depends(get_current_user)):
    performance = await db.driver_performance.find_one({'driver_id': driver_id}, {'_id': 0})
    if not performance:
        raise HTTPException(status_code=404, detail="Performance record not found")
    
    return performance

@api_router.get("/drivers")
async def get_drivers(current_user: dict = Depends(get_current_user)):
    if current_user['role'] != 'fleet_owner':
        raise HTTPException(status_code=403, detail="Only fleet owners can view drivers")
    
    drivers = await db.users.find(
        {'role': 'driver', 'fleet_owner_id': current_user['id']},
        {'_id': 0, 'password': 0}
    ).to_list(1000)
    
    return drivers

# ==================== Dashboard Routes ====================

@api_router.get("/dashboard/stats")
async def get_dashboard_stats(current_user: dict = Depends(get_current_user)):
    if current_user['role'] == 'fleet_owner':
        # Get total trips
        total_trips = await db.trips.count_documents({'fleet_owner_id': current_user['id']})
        
        # Get total expenses
        trip_ids = await db.trips.find({'fleet_owner_id': current_user['id']}, {'id': 1, '_id': 0}).to_list(1000)
        trip_id_list = [t['id'] for t in trip_ids]
        
        expenses = await db.expenses.find({'trip_id': {'$in': trip_id_list}}, {'_id': 0}).to_list(10000)
        total_expenses = sum(e['amount'] for e in expenses)
        
        # Get active trips
        active_trips = await db.trips.count_documents(
            {'fleet_owner_id': current_user['id'], 'status': 'in_progress'}
        )
        
        # Get total vehicles
        total_vehicles = await db.vehicles.count_documents({'fleet_owner_id': current_user['id']})
        
        # Get total drivers
        total_drivers = await db.users.count_documents(
            {'role': 'driver', 'fleet_owner_id': current_user['id']}
        )
        
        return {
            'total_trips': total_trips,
            'total_expenses': round(total_expenses, 2),
            'active_trips': active_trips,
            'total_vehicles': total_vehicles,
            'total_drivers': total_drivers
        }
    else:
        # Driver stats
        total_trips = await db.trips.count_documents({'driver_id': current_user['id']})
        
        expenses = await db.expenses.find({'driver_id': current_user['id']}, {'_id': 0}).to_list(10000)
        total_expenses = sum(e['amount'] for e in expenses)
        
        wallet = await db.wallets.find_one({'driver_id': current_user['id']}, {'_id': 0})
        wallet_balance = wallet['balance'] if wallet else 0
        
        performance = await db.driver_performance.find_one({'driver_id': current_user['id']}, {'_id': 0})
        reward_points = performance['reward_points'] if performance else 0
        
        return {
            'total_trips': total_trips,
            'total_expenses': round(total_expenses, 2),
            'wallet_balance': round(wallet_balance, 2),
            'reward_points': reward_points
        }

# ==================== AI Routes ====================

@api_router.post("/ai/route-optimize")
async def optimize_route(route_data: AIRouteRequest, current_user: dict = Depends(get_current_user)):
    try:
        api_key = os.environ.get('EMERGENT_LLM_KEY')
        if not api_key:
            raise HTTPException(status_code=500, detail="AI service not configured")
        
        chat = LlmChat(
            api_key=api_key,
            session_id=f"route_{current_user['id']}_{datetime.now(timezone.utc).timestamp()}",
            system_message="You are an AI route optimization expert for Indian road transport. Provide practical route suggestions, estimated costs, and fuel efficiency tips."
        ).with_model("openai", "gpt-4o-mini")
        
        prompt = f"""Optimize route for:
Origin: {route_data.origin}
Destination: {route_data.destination}
Vehicle: {route_data.vehicle_type}
Cargo: {route_data.cargo_details or 'Standard cargo'}

Provide:
1. Recommended route with major stops
2. Estimated fuel cost (in INR)
3. Estimated toll costs
4. Total estimated distance
5. Tips for fuel efficiency

Keep response concise and practical."""
        
        user_message = UserMessage(text=prompt)
        response = await chat.send_message(user_message)
        
        return {
            'route_suggestion': response,
            'timestamp': datetime.now(timezone.utc).isoformat()
        }
    except Exception as e:
        logger.error(f"AI route optimization error: {str(e)}")
        raise HTTPException(status_code=500, detail="AI service error")

# ==================== Payment Routes ====================

PACKAGES = {
    'small': 500.0,   # ₹500
    'medium': 1000.0, # ₹1000
    'large': 2000.0   # ₹2000
}

@api_router.post("/payments/checkout")
async def create_checkout_session(
    request: Request,
    checkout_data: CheckoutRequest,
    current_user: dict = Depends(get_current_user)
):
    try:
        # Validate package
        if checkout_data.package not in PACKAGES:
            raise HTTPException(status_code=400, detail="Invalid package")
        
        amount = PACKAGES[checkout_data.package]
        
        # Get origin URL from request
        origin = request.headers.get('origin') or str(request.base_url).rstrip('/')
        
        # Create webhook and success URLs
        host_url = str(request.base_url).rstrip('/')
        webhook_url = f"{host_url}/api/webhook/stripe"
        success_url = f"{origin}/payment-success?session_id={{{{CHECKOUT_SESSION_ID}}}}"
        cancel_url = f"{origin}/dashboard"
        
        # Initialize Stripe
        stripe_api_key = os.environ.get('STRIPE_API_KEY')
        stripe_checkout = StripeCheckout(api_key=stripe_api_key, webhook_url=webhook_url)
        
        # Create checkout session
        checkout_request = CheckoutSessionRequest(
            amount=amount,
            currency="inr",
            success_url=success_url,
            cancel_url=cancel_url,
            metadata={
                'user_id': current_user['id'],
                'package': checkout_data.package,
                'role': current_user['role']
            }
        )
        
        session = await stripe_checkout.create_checkout_session(checkout_request)
        
        # Create payment transaction record
        transaction = PaymentTransaction(
            user_id=current_user['id'],
            session_id=session.session_id,
            amount=amount,
            currency="inr",
            metadata=checkout_request.metadata
        )
        
        trans_dict = transaction.model_dump()
        trans_dict['created_at'] = trans_dict['created_at'].isoformat()
        trans_dict['updated_at'] = trans_dict['updated_at'].isoformat()
        
        await db.payment_transactions.insert_one(trans_dict)
        
        return {
            'url': session.url,
            'session_id': session.session_id
        }
    except Exception as e:
        logger.error(f"Checkout error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/payments/status/{session_id}")
async def get_payment_status(
    session_id: str,
    current_user: dict = Depends(get_current_user)
):
    try:
        # Check if already processed
        transaction = await db.payment_transactions.find_one(
            {'session_id': session_id, 'user_id': current_user['id']},
            {'_id': 0}
        )
        
        if not transaction:
            raise HTTPException(status_code=404, detail="Transaction not found")
        
        # If already paid, return cached status
        if transaction['payment_status'] == 'paid':
            return transaction
        
        # Check with Stripe
        stripe_api_key = os.environ.get('STRIPE_API_KEY')
        webhook_url = ""  # Not needed for status check
        stripe_checkout = StripeCheckout(api_key=stripe_api_key, webhook_url=webhook_url)
        
        status_response = await stripe_checkout.get_checkout_status(session_id)
        
        # Update transaction
        update_data = {
            'payment_status': status_response.payment_status,
            'status': 'completed' if status_response.payment_status == 'paid' else status_response.status,
            'updated_at': datetime.now(timezone.utc).isoformat()
        }
        
        await db.payment_transactions.update_one(
            {'session_id': session_id},
            {'$set': update_data}
        )
        
        # If payment successful and not yet credited, credit the wallet
        if status_response.payment_status == 'paid' and transaction['payment_status'] != 'paid':
            # Credit wallet for driver
            if current_user['role'] == 'driver':
                await db.wallets.update_one(
                    {'driver_id': current_user['id']},
                    {'$inc': {'balance': transaction['amount']}}
                )
        
        # Get updated transaction
        updated_transaction = await db.payment_transactions.find_one(
            {'session_id': session_id},
            {'_id': 0}
        )
        
        return updated_transaction
    except Exception as e:
        logger.error(f"Payment status error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/webhook/stripe")
async def stripe_webhook(request: Request):
    try:
        body = await request.body()
        signature = request.headers.get("stripe-signature")
        
        stripe_api_key = os.environ.get('STRIPE_API_KEY')
        webhook_url = ""  # Not needed for webhook handling
        stripe_checkout = StripeCheckout(api_key=stripe_api_key, webhook_url=webhook_url)
        
        webhook_response = await stripe_checkout.handle_webhook(body, signature)
        
        # Update transaction based on webhook
        if webhook_response.event_type in ['checkout.session.completed', 'payment_intent.succeeded']:
            await db.payment_transactions.update_one(
                {'session_id': webhook_response.session_id},
                {'$set': {
                    'payment_status': webhook_response.payment_status,
                    'status': 'completed',
                    'updated_at': datetime.now(timezone.utc).isoformat()
                }}
            )
        
        return {"status": "success"}
    except Exception as e:
        logger.error(f"Webhook error: {str(e)}")
        return {"status": "error", "message": str(e)}

# ==================== Root Route ====================

@api_router.get("/")
async def root():
    return {"message": "TransOps API", "status": "running"}

# Include router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()