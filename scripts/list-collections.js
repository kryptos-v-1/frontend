const { MongoClient } = require("mongodb");

const MONGODB_URI = "mongodb+srv://0dayashish_db_user:xuyPXKKppwkXvV1t@kryptos.qlwiizw.mongodb.net/?appName=kryptos";

async function listCollections() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log("✓ Connected to MongoDB\n");
    
    const db = client.db("kryptos");
    const collections = await db.listCollections().toArray();
    
    console.log(`Found ${collections.length} collection(s):\n`);
    for (const col of collections) {
      console.log(`- ${col.name}`);
    }
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await client.close();
  }
}

listCollections();
