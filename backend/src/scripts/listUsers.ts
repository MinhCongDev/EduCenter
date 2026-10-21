import mongoose from 'mongoose';
import { config } from '../config';

async function main() {
  await mongoose.connect(config.mongodbUri);
  const users = await mongoose.connection.collection('users').find({}).toArray();
  console.log(`Tong so user: ${users.length}`);
  users.forEach((u: any) => {
    console.log(`- ${u.email} | role=${u.role} | status=${u.status}`);
  });
  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});