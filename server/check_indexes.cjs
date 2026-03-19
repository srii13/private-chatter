require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);
  const collections = await mongoose.connection.db.collections();
  let result = {};
  for (let collection of collections) {
    result[collection.collectionName] = await collection.indexes();
  }
  fs.writeFileSync('indexes.json', JSON.stringify(result, null, 2));
  process.exit(0);
}
main().catch(console.error);
