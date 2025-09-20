// Run this script in the browser console to add test data
// Make sure you're logged in and have Firebase initialized

const addTestData = async () => {
  try {
    // Add sample students (you'll need to replace 'YOUR_USER_ID' with actual parent user ID)
    const studentsData = [
      {
        fullName: "John Doe",
        age: 8,
        school: "St. Joseph's College",
        parentId: "YOUR_USER_ID", // Replace with actual parent user ID
        status: "at-home",
        monthlyFee: 2500
      },
      {
        fullName: "Jane Smith", 
        age: 10,
        school: "Royal College",
        parentId: "YOUR_USER_ID", // Replace with actual parent user ID
        status: "at-home",
        monthlyFee: 2800
      }
    ];

    for (const student of studentsData) {
      await addDoc(collection(db, "students"), student);
      console.log(`Added student: ${student.fullName}`);
    }

    console.log("Test data added successfully!");
  } catch (error) {
    console.error("Error adding test data:", error);
  }
};

// Run this function
// addTestData();

console.log("Copy and run addTestData() in the console to add test students");