const https = require("https");

const email = "0day.ashish@gmail.com";
const plan = "pro";
const backendUrl = "https://kryptos-backend-uq36.onrender.com";
const adminKey = process.env.ADMIN_API_KEY || "your-admin-key-here";

const path = `/admin/users/${encodeURIComponent(email)}/plan`;

const options = {
  hostname: "kryptos-backend-uq36.onrender.com",
  port: 443,
  path: path,
  method: "PUT",
  headers: {
    "Content-Type": "application/json",
    "X-Admin-Key": adminKey,
  },
};

console.log(`🔄 Updating user plan...`);
console.log(`   Email: ${email}`);
console.log(`   Plan: ${plan}\n`);

const req = https.request(options, (res) => {
  let data = "";

  res.on("data", (chunk) => {
    data += chunk;
  });

  res.on("end", () => {
    if (res.statusCode === 200 || res.statusCode === 201) {
      console.log(`✅ Success! User plan updated to: ${plan}`);
      console.log(`\nResponse:`, JSON.parse(data));
    } else {
      console.log(`❌ Error (${res.statusCode}):`, data);
    }
    process.exit(0);
  });
});

req.on("error", (error) => {
  console.error("❌ Request failed:", error.message);
  process.exit(1);
});

req.write(JSON.stringify({ plan }));
req.end();
