/**
 * Script to delete a specific user from Firestore
 * 
 * Usage: node scripts/deleteUser.js "user name or email"
 */

require('dotenv').config();
const { db } = require('../src/firebase');

async function deleteUser(searchTerm) {
  if (!searchTerm) {
    console.error('Please provide a search term (name or email)');
    console.log('Usage: node scripts/deleteUser.js "naif alotabi"');
    process.exit(1);
  }

  console.log(`Searching for user: "${searchTerm}"...\n`);

  try {
    // Search by name (case-insensitive partial match)
    const usersSnapshot = await db.collection('users').get();
    const matchingUsers = usersSnapshot.docs.filter(doc => {
      const data = doc.data();
      const name = (data.name || '').toLowerCase();
      const email = (data.email || '').toLowerCase();
      const search = searchTerm.toLowerCase();
      return name.includes(search) || email.includes(search);
    });

    if (matchingUsers.length === 0) {
      console.log('❌ No users found matching that search term.');
      process.exit(0);
    }

    console.log(`Found ${matchingUsers.length} matching user(s):\n`);
    matchingUsers.forEach((doc, index) => {
      const data = doc.data();
      console.log(`${index + 1}. ID: ${doc.id}`);
      console.log(`   Name: ${data.name || 'N/A'}`);
      console.log(`   Email: ${data.email || 'N/A'}`);
      console.log(`   Role: ${data.role || 'N/A'}`);
      console.log('');
    });

    // Delete all matching users
    console.log('Deleting user(s)...');
    const deletes = matchingUsers.map(doc => {
      console.log(`  - Deleting: ${doc.data().name || doc.id}`);
      return doc.ref.delete();
    });

    await Promise.all(deletes);
    console.log(`\n✅ Successfully deleted ${matchingUsers.length} user(s)!`);

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

// Get search term from command line argument
const searchTerm = process.argv[2];
deleteUser(searchTerm)
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });

