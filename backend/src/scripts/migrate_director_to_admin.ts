import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });

async function run() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('No MONGODB_URI found in .env');
    process.exit(1);
  }

  await mongoose.connect(uri);
  console.log('Connected to MongoDB successfully');
  const db = mongoose.connection.db;
  if (!db) {
    console.error('No db found');
    process.exit(1);
  }

  const usersCol = db.collection('users');
  const directorUsers = await usersCol.find({ role: 'DIRECTOR' }).toArray();
  console.log('Director users before migration:', directorUsers.map((u) => ({ id: u._id, email: u.email, role: u.role, fullName: u.fullName })));

  const updateResult = await usersCol.updateMany(
    { role: 'DIRECTOR' },
    { $set: { role: 'ADMIN' } }
  );
  console.log(`Updated ${updateResult.modifiedCount} user(s) from DIRECTOR to ADMIN.`);

  const verifyUsers = await usersCol.find({ role: 'ADMIN' }).toArray();
  console.log('Admin users after migration:', verifyUsers.map((u) => ({ id: u._id, email: u.email, role: u.role, fullName: u.fullName })));

  // Check announcements targetRoles or targetRole if any
  const announcementsCol = db.collection('announcements');
  const annDirector = await announcementsCol.find({
    $or: [
      { targetRole: 'DIRECTOR' },
      { targetRoles: 'DIRECTOR' },
    ],
  }).toArray();
  if (annDirector.length > 0) {
    console.log(`Found ${annDirector.length} announcements with DIRECTOR target.`);
    await announcementsCol.updateMany(
      { targetRole: 'DIRECTOR' },
      { $set: { targetRole: 'ADMIN' } }
    );
    await announcementsCol.updateMany(
      { targetRoles: 'DIRECTOR' },
      { $set: { 'targetRoles.$': 'ADMIN' } }
    );
  }

  await mongoose.disconnect();
  console.log('Migration completed successfully.');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
