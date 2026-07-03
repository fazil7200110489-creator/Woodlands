const mongoose = require('mongoose');

const MONGODB_URI = "mongodb+srv://fazil721655_db_user:Fazil721655@cluster0.g6tcpbm.mongodb.net/woodlands?retryWrites=true&w=majority&appName=Cluster0";

// Define the schema inline
const menuItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: { type: String, required: true },
  image: { type: String, required: true },
});

const MenuItemModel = mongoose.models.MenuItem || mongoose.model("MenuItem", menuItemSchema);

// Category fallbacks (HTTP 200 verified)
const CATEGORY_FALLBACKS = {
  Shawarma: "https://images.unsplash.com/photo-1561651823-34feb02250e4?w=800&q=80",
  Grill: "https://images.unsplash.com/photo-1608039829572-78524f79c4c7?w=800&q=80",
  Rice: "https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=800&q=80",
  Noodles: "https://images.unsplash.com/photo-1612929633738-8fe44f7ec841?w=800&q=80",
  Starters: "https://images.unsplash.com/photo-1627308595229-7830a5c91f9f?w=800&q=80",
  Extras: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=800&q=80",
  Burger: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&q=80",
  default: "https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=800&q=80",
};

// Keyword dictionary (HTTP 200 verified)
const IMAGE_DICTIONARY = {
  "full grill": "https://images.unsplash.com/photo-1608039829572-78524f79c4c7?w=800&q=80",
  "half grill": "https://images.unsplash.com/photo-1616137422495-1e9e46e2aa77?w=800&q=80",
  "quarter grill": "https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?w=800&q=80",
  "grill chicken": "https://images.unsplash.com/photo-1608039829572-78524f79c4c7?w=800&q=80",
  "grilled chicken": "https://images.unsplash.com/photo-1608039829572-78524f79c4c7?w=800&q=80",
  "bbq chicken": "https://images.unsplash.com/photo-1544025162-d76694265947?w=800&q=80",
  "chilli chicken": "https://images.unsplash.com/photo-1627308595229-7830a5c91f9f?w=800&q=80",
  "pepper chicken": "https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?w=800&q=80",
  "chicken 65": "https://images.unsplash.com/photo-1569058242253-92a9c755a0ec?w=800&q=80",
  "lollipop sauce": "https://images.unsplash.com/photo-1585238342024-78d387f4a707?w=800&q=80",
  "lollipop": "https://images.unsplash.com/photo-1606755962773-d324e0a13086?w=800&q=80",
  "chilli beef": "https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=800&q=80",
  "pepper beef": "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=800&q=80",
  "special shawarma": "https://images.unsplash.com/photo-1603360946369-dc9bb6258143?w=800&q=80",
  "shawarma": "https://images.unsplash.com/photo-1561651823-34feb02250e4?w=800&q=80",
  "schezwan chicken rice": "https://images.unsplash.com/photo-1512058564366-18510be2db19?w=800&q=80",
  "schezwan beef rice": "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=800&q=80",
  "chicken fried rice": "https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=800&q=80",
  "beef rice": "https://images.unsplash.com/photo-1617093727343-374698b1b08d?w=800&q=80",
  "fried rice": "https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=800&q=80",
  "schezwan chicken noodles": "https://images.unsplash.com/photo-1585032226651-759b368d7246?w=800&q=80",
  "chicken noodles": "https://images.unsplash.com/photo-1612929633738-8fe44f7ec841?w=800&q=80",
  "noodles": "https://images.unsplash.com/photo-1612929633738-8fe44f7ec841?w=800&q=80",
  "mayonnaise": "https://images.unsplash.com/photo-1607330289024-1535c6b4e1c1?w=800&q=80",
  "kuboos": "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=800&q=80",
  "french fries": "https://images.unsplash.com/photo-1576107232684-1279f390859f?w=800&q=80",
  "pepsi": "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=800&q=80",
  "coke": "https://images.unsplash.com/photo-1629203851122-3726ecdf080e?w=800&q=80",
  "lime juice": "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=800&q=80",
  "ice cream": "https://images.unsplash.com/photo-1497034825429-c343d7c6a68f?w=800&q=80",
  "biryani": "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&q=80",
  "veg burger": "https://images.unsplash.com/photo-1525059696034-4967a8e1dca2?w=800&q=80",
  "burger": "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&q=80"
};

// Normalization & Alias Layer
function normalizeMenuName(name) {
  let normalized = name
    .toLowerCase()
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  let aliasMatched = "None";

  if (normalized.includes("myonise")) {
    normalized = normalized.replace("myonise", "mayonnaise");
    aliasMatched = "myonise → mayonnaise";
  }
  if (normalized.includes("kupus")) {
    normalized = normalized.replace("kupus", "kuboos");
    aliasMatched = "kupus → kuboos";
  }
  if (normalized.includes("shawarmah")) {
    normalized = normalized.replace("shawarmah", "shawarma");
    aliasMatched = "shawarmah → shawarma";
  }
  if (normalized.includes("sezwan")) {
    normalized = normalized.replace("sezwan", "schezwan");
    aliasMatched = "sezwan → schezwan";
  }
  if (normalized.includes("lollypop")) {
    normalized = normalized.replace("lollypop", "lollipop");
    aliasMatched = "lollypop → lollipop";
  }
  if (normalized.includes("sayce")) {
    normalized = normalized.replace("sayce", "sauce");
    aliasMatched = "sayce → sauce";
  }
  if (normalized.includes("1/2 grill") || normalized.includes("half grilled chicken")) {
    normalized = "half grill";
    aliasMatched = "grill fraction/alias → half grill";
  }
  if (normalized.includes("full grilled chicken")) {
    normalized = "full grill";
    aliasMatched = "full grilled chicken → full grill";
  }
  if (normalized.includes("quarter grilled chicken")) {
    normalized = "quarter grill";
    aliasMatched = "quarter grilled chicken → quarter grill";
  }
  if (normalized.includes("chicken rice") && !normalized.includes("fried")) {
    normalized = normalized.replace("chicken rice", "chicken fried rice");
    aliasMatched = "chicken rice → chicken fried rice";
  }

  return { normalized, aliasMatched };
}

// Unified Image Resolver
function resolveFoodImage(name, category = "default", fallbackSrc) {
  const { normalized, aliasMatched } = normalizeMenuName(name);

  // Check first: if the image is a custom user-uploaded file, preserve it
  if (
    fallbackSrc &&
    fallbackSrc.trim() !== "" &&
    (fallbackSrc.startsWith("/uploads/") ||
      fallbackSrc.startsWith("data:") ||
      (!fallbackSrc.includes("unsplash.com") && !fallbackSrc.includes("/images/default")))
  ) {
    return { url: fallbackSrc, level: "Custom Upload" };
  }

  // Level 1: Exact Match
  if (IMAGE_DICTIONARY[normalized]) {
    return { url: IMAGE_DICTIONARY[normalized], level: "Exact Match" };
  }

  // Level 2: Keyword Match
  for (const key of Object.keys(IMAGE_DICTIONARY)) {
    if (normalized.includes(key)) {
      return { url: IMAGE_DICTIONARY[key], level: "Keyword Match" };
    }
  }

  // Level 3: Category Fallback Match
  const catKey = category.charAt(0).toUpperCase() + category.slice(1).toLowerCase();
  if (CATEGORY_FALLBACKS[catKey]) {
    return { url: CATEGORY_FALLBACKS[catKey], level: "Category Match" };
  }

  // Level 4: Generic Food Image Fallback
  return { url: fallbackSrc || CATEGORY_FALLBACKS["default"], level: "Generic Fallback" };
}

const initialMenu = [
  { name: "Normal Shawarma", category: "Shawarma", image: "https://images.unsplash.com/photo-1561651823-34feb02250e4?w=800&q=80" },
  { name: "Spl Shawarma", category: "Shawarma", image: "https://images.unsplash.com/photo-1603360946369-dc9bb6258143?w=800&q=80" },
  { name: "Full Grill", category: "Grill", image: "https://images.unsplash.com/photo-1608039829572-78524f79c4c7?w=800&q=80" },
  { name: "Half Grill", category: "Grill", image: "https://images.unsplash.com/photo-1616137422495-1e9e46e2aa77?w=800&q=80" },
  { name: "Kupus", category: "Extras", image: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=800&q=80" },
  { name: "Myonise", category: "Extras", image: "https://images.unsplash.com/photo-1607330289024-1535c6b4e1c1?w=800&q=80" },
  { name: "Chicken Fried Rice", category: "Rice", image: "https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=800&q=80" },
  { name: "Sezwan Chicken Rice", category: "Rice", image: "https://images.unsplash.com/photo-1512058564366-18510be2db19?w=800&q=80" },
  { name: "Beef Rice", category: "Rice", image: "https://images.unsplash.com/photo-1617093727343-374698b1b08d?w=800&q=80" },
  { name: "Sezwan Beef Rice", category: "Rice", image: "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=800&q=80" },
  { name: "Beef Rice 1/2", category: "Rice", image: "https://images.unsplash.com/photo-1617093727343-374698b1b08d?w=800&q=80" },
  { name: "Chicken Rice 1/2", category: "Rice", image: "https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=800&q=80" },
  { name: "Chicken Noodles", category: "Noodles", image: "https://images.unsplash.com/photo-1612929633738-8fe44f7ec841?w=800&q=80" },
  { name: "Sezwan Chicken Noodles", category: "Noodles", image: "https://images.unsplash.com/photo-1585032226651-759b368d7246?w=800&q=80" },
  { name: "Chilli Chicken", category: "Starters", image: "https://images.unsplash.com/photo-1627308595229-7830a5c91f9f?w=800&q=80" },
  { name: "Pepper Chicken", category: "Starters", image: "https://images.unsplash.com/photo-1603496987351-f84a3bd5ea1f?w=800&q=80" },
  { name: "Chilli Beef", category: "Starters", image: "https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=800&q=80" },
  { name: "Pepper Beef", category: "Starters", image: "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=800&q=80" },
  { name: "Lollypop", category: "Starters", image: "https://images.unsplash.com/photo-1606755962773-d324e0a13086?w=800&q=80" },
  { name: "Chicken 65", category: "Starters", image: "https://images.unsplash.com/photo-1569058242253-92a9c755a0ec?w=800&q=80" },
  { name: "Lollypop Sayce", category: "Starters", image: "https://images.unsplash.com/photo-1585238342024-78d387f4a707?w=800&q=80" }
];

async function run() {
  console.log("Connecting to MongoDB...");
  await mongoose.connect(MONGODB_URI, { dbName: "woodlands" });
  console.log("Connected successfully. Syncing images in MongoDB database...");

  // Sync new verified image paths in database
  for (const seedItem of initialMenu) {
    const escaped = seedItem.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    await MenuItemModel.updateOne(
      { name: { $regex: new RegExp(`^${escaped}$`, "i") } },
      { $set: { image: seedItem.image } }
    );
  }
  console.log("Database sync completed.");

  // Scan every menu item in database
  console.log("\nAuditing active menu items from database...");
  const dbItems = await MenuItemModel.find().lean();
  let successCount = 0;
  let missingCount = 0;
  let categoryFallbackCount = 0;
  let failureList = [];

  for (const item of dbItems) {
    const resolution = resolveFoodImage(item.name, item.category, item.image);
    
    // Programmatically verify image URL loads (returns 200 OK)
    let isOk = false;
    let statusCode = "ERROR";
    try {
      const fetchRes = await fetch(resolution.url, { method: "HEAD" });
      isOk = fetchRes.ok;
      statusCode = fetchRes.status;
    } catch (err) {
      statusCode = "FETCH_FAILED: " + err.message;
    }

    let statusSymbol = "";
    if (resolution.level === "Exact Match" || resolution.level === "Keyword Match") {
      if (isOk) {
        statusSymbol = "✔ Successfully mapped";
        successCount++;
      } else {
        statusSymbol = `❌ Resolved URL Broken (${statusCode})`;
        missingCount++;
        failureList.push(`${item.name} (${resolution.url}) - Status ${statusCode}`);
      }
    } else if (resolution.level === "Category Match") {
      if (isOk) {
        statusSymbol = "⚠ Using category fallback";
        categoryFallbackCount++;
      } else {
        statusSymbol = `❌ Category Fallback URL Broken (${statusCode})`;
        missingCount++;
        failureList.push(`${item.name} (${resolution.url}) - Status ${statusCode}`);
      }
    } else {
      statusSymbol = "❌ Missing mapping";
      missingCount++;
      failureList.push(`${item.name} (No mapping)`);
    }

    console.log(`- Item: "${item.name}" | Mapping Level: ${resolution.level} | Status: ${statusSymbol}`);
  }

  console.log("\n--- Audit Summary ---");
  console.log(`✔ Successfully mapped: ${successCount}`);
  console.log(`⚠ Using category fallback: ${categoryFallbackCount}`);
  console.log(`❌ Missing or broken mapping: ${missingCount}`);

  await mongoose.disconnect();

  if (missingCount > 0) {
    console.error("\nAudit Failed: There are broken or missing mappings!");
    console.error(failureList.join("\n"));
    process.exit(1);
  } else {
    console.log("\nAudit Passed! Every menu item has a valid, working image match.");
    process.exit(0);
  }
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
