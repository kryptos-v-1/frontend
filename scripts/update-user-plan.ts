import { MongoClient } from "mongodb";

const MONGODB_URI = "mongodb+srv://0dayashish_db_user:xuyPXKKppwkXvV1t@kryptos.qlwiizw.mongodb.net/?appName=kryptos";
const EMAIL = "0day.ashish@gmail.com";
const NEW_PLAN = "pro";

async function updateUserPlan() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log("✓ Connected to MongoDB");
    
    const db = client.db("kryptos");
    const usersCollection = db.collection("user");
    
    // Find user by email
    const user = await usersCollection.findOne({ email: EMAIL });
    
    if (!user) {
      console.log(`✗ User with email ${EMAIL} not found`);
      return;
    }
    
    console.log(`Found user: ${user.email} (ID: ${user._id})`);
    console.log(`Current plan: ${user.plan || "free"}`);
    
    // Update user plan
    const result = await usersCollection.updateOne(
      { email: EMAIL },
      {
        $set: {
          plan: NEW_PLAN,
          updated_at: new Date(),
        },
      }
    );
    
    if (result.modifiedCount === 1) {
      console.log(`✓ Successfully updated user plan to: ${NEW_PLAN}`);
      
      // Verify update
      const updatedUser = await usersCollection.findOne({ email: EMAIL });
      console.log(`Verified new plan: ${updatedUser?.plan}`);
    } else {
      console.log("✗ Update failed");
    }
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await client.close();
    console.log("✓ Connection closed");
  }
}

updateUserPlan();
