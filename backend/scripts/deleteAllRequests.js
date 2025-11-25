/**
 * Script to delete all requests and related data
 * 
 * WARNING: This will delete ALL requests, documents, and audit logs!
 * Use with caution.
 */

require('dotenv').config();
const { db, storage } = require('../src/firebase');

async function deleteAllRequests() {
  console.log('Starting deletion process...\n');

  try {
    // 1. Delete all documents from 'documents' collection
    console.log('Deleting documents...');
    const documentsSnapshot = await db.collection('documents').get();
    const documentDeletes = documentsSnapshot.docs.map(doc => doc.ref.delete());
    await Promise.all(documentDeletes);
    console.log(`✓ Deleted ${documentsSnapshot.size} documents\n`);

    // 2. Delete all audit logs
    console.log('Deleting audit logs...');
    const auditLogsSnapshot = await db.collection('auditLogs').get();
    const auditLogDeletes = auditLogsSnapshot.docs.map(doc => doc.ref.delete());
    await Promise.all(auditLogDeletes);
    console.log(`✓ Deleted ${auditLogsSnapshot.size} audit logs\n`);

    // 3. Delete all files from Storage
    console.log('Deleting files from Storage...');
    let filesCount = 0;
    try {
      const bucket = storage.bucket('customer-request-tracking.firebasestorage.app');
      const [files] = await bucket.getFiles({ prefix: 'requests/' });
      filesCount = files.length;
      if (files.length > 0) {
        const fileDeletes = files.map(file => file.delete());
        await Promise.all(fileDeletes);
        console.log(`✓ Deleted ${files.length} files from Storage\n`);
      } else {
        console.log(`✓ No files to delete in Storage\n`);
      }
    } catch (storageError) {
      console.log(`⚠ Could not delete Storage files: ${storageError.message}\n`);
    }

    // 4. Delete all requests
    console.log('Deleting requests...');
    const requestsSnapshot = await db.collection('requests').get();
    const requestDeletes = requestsSnapshot.docs.map(doc => doc.ref.delete());
    await Promise.all(requestDeletes);
    console.log(`✓ Deleted ${requestsSnapshot.size} requests\n`);

    console.log('✅ All data deleted successfully!');
    console.log('\nSummary:');
    console.log(`- Requests: ${requestsSnapshot.size}`);
    console.log(`- Documents: ${documentsSnapshot.size}`);
    console.log(`- Audit Logs: ${auditLogsSnapshot.size}`);
    console.log(`- Storage Files: ${filesCount}`);

  } catch (error) {
    console.error('❌ Error deleting data:', error);
    process.exit(1);
  }
}

// Run the script
deleteAllRequests()
  .then(() => {
    console.log('\nDone!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });

