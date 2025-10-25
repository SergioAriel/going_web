import cron from 'node-cron';
import client from '@/lib/mongodb';
import { User } from '@/interfaces';

// This cron job runs every minute
cron.schedule('* * * * *', async () => {
  console.log('Running cron job to check for idle drivers...');

  const db = client.db("going");
  const usersCollection = db.collection<User>("users");

  const idleTimeout = 10 * 60 * 1000; // 10 minutes

  const now = new Date();

  const idleDrivers = await usersCollection.find({
    isDriver: true,
    'driverDetails.status': 'IDLE',
    'driverDetails.idleSince': { $lt: new Date(now.getTime() - idleTimeout) }
  }).toArray();

  if (idleDrivers.length > 0) {
    console.log(`Found ${idleDrivers.length} idle drivers.`);
    for (const driver of idleDrivers) {
      // TODO: Implement the logic to assign a new collection route
      console.log(`Re-assigning driver ${driver._id} to be a collector.`);

      await usersCollection.updateOne(
        { _id: driver._id },
        { $set: { 'driverDetails.status': 'COLLECTING_BATCH', 'driverDetails.idleSince': undefined } }
      );
    }
  }
});
