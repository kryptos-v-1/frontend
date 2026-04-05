const { MongoClient } = require("mongodb");

const MONGODB_URI = "mongodb+srv://0dayashish_db_user:xuyPXKKppwkXvV1t@kryptos.qlwiizw.mongodb.net/?appName=kryptos";

async function listUsers() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log("✓ Connected to MongoDB");
    
    const db = client.db("kryptos");
    const usersCollection = db.collection("user");
    
    // Find all users
    const users = await usersCollection.find({}).toArray();
    
    console.log(`\nFound ${users.length} user(s):\n`);
    users.forEach((user, index) => {
      console.log(`${index + 1}. Email: ${user.email || "N/A"}`);
      console.log(`   ID: ${user._id}`);
      console.log(`   Plan: ${user.plan || "free"}`);
      console.log(`   Created: ${user.createdAt || "N/A"}\n`);
    });
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await client.close();
  }
}

listUsers();
