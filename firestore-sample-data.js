// Sample Firestore Data Setup Script
// Copy and paste this into your browser console on Firebase Console

// 1. First, create a sample driver user
const sampleDriver = {
  email: "john.driver@schoolbus.com",
  displayName: "John Driver",
  photoURL: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150",
  role: "driver",
  lastLogin: new Date(),
  
  // Driver details
  busNumber: "Bus-101",
  driverOfBusId: "bus-101",
  area: "Downtown, Westside, North District",
  school: "Lincoln Elementary, Washington High School",
  route: "Main St → Oak Ave → Lincoln Elementary → Park Rd → Washington High → Downtown",
  capacity: 30,
  price: 150.00,
  schedule: "Mon-Fri 7:30 AM & 3:30 PM",
  description: "Experienced school bus driver with 10+ years of safe driving. First Aid certified and fully insured. Known for punctuality and caring attitude towards children.",
  phone: "+1234567890",
  hasFirstAid: true,
  hasInsurance: true,
  yearsExperience: 10,
  isAvailable: true,
  rating: 4.8,
  reviews: 25
};

// 2. Sample parent user
const sampleParent = {
  email: "jane.parent@email.com",
  displayName: "Jane Smith",
  photoURL: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150",
  role: "parent",
  lastLogin: new Date(),
  
  // Parent details
  parentOf: ["student-001", "student-002"],
  children: [
    {
      name: "Emma Smith",
      studentId: "student-001",
      busId: "bus-101",
      school: "Lincoln Elementary"
    },
    {
      name: "Lucas Smith", 
      studentId: "student-002",
      busId: "bus-101",
      school: "Lincoln Elementary"
    }
  ]
};

// 3. Sample students
const student1 = {
  name: "Emma Smith",
  busId: "bus-101",
  parentId: "parent-user-id", // Replace with actual parent ID
  school: "Lincoln Elementary",
  grade: "5th Grade",
  status: "waiting",
  pickupLocation: {
    address: "123 Main St, Downtown",
    coordinates: { lat: 40.7128, lng: -74.0060 }
  },
  dropoffLocation: {
    address: "Lincoln Elementary School",
    coordinates: { lat: 40.7580, lng: -73.9855 }
  },
  emergencyContact: {
    name: "Jane Smith",
    phone: "+1987654321"
  },
  medicalInfo: "No known allergies",
  createdAt: new Date(),
  updatedAt: new Date()
};

const student2 = {
  name: "Lucas Smith",
  busId: "bus-101", 
  parentId: "parent-user-id", // Replace with actual parent ID
  school: "Lincoln Elementary",
  grade: "3rd Grade",
  status: "waiting",
  pickupLocation: {
    address: "123 Main St, Downtown",
    coordinates: { lat: 40.7128, lng: -74.0060 }
  },
  dropoffLocation: {
    address: "Lincoln Elementary School", 
    coordinates: { lat: 40.7580, lng: -73.9855 }
  },
  emergencyContact: {
    name: "Jane Smith",
    phone: "+1987654321"
  },
  medicalInfo: "Mild food allergies",
  createdAt: new Date(),
  updatedAt: new Date()
};

// 4. Sample bus location
const busLocation = {
  busId: "bus-101",
  driverId: "driver-user-id", // Replace with actual driver ID
  currentLocation: {
    lat: 40.7128,
    lng: -74.0060
  },
  speed: 0,
  heading: 0,
  lastUpdated: new Date(),
  isActive: false,
  route: "idle",
  nextStop: "Main St & 1st Ave",
  estimatedArrival: null
};

// Instructions:
// 1. Create these documents manually in Firebase Console
// 2. Replace user IDs with actual Firebase Auth UIDs
// 3. Add more sample data as needed for testing