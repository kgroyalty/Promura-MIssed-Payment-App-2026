import express from 'express';
import admin from 'firebase-admin';

const app = express();
app.use(express.json());

// Initialize Firebase Admin with Application Default Credentials
// Checks if already initialized to handle hot-reloads
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault()
  });
}

const db = admin.firestore();

/**
 * POST /webhook
 * Real-time endpoint for Apify Melon Scraper automation.
 * Ingests data into the 'missedPayments' landing zone for the UI to pick up.
 */
app.post('/webhook', async (req, res) => {
  try {
    console.log('Apify webhook pulse received');
    
    // Dataset items from Apify or direct payload
    const dataItems = req.body.datasetItems || req.body;
    
    // Normalize payload structure
    const payload = {
      run_id: req.body.run_id || `run_${Date.now()}`,
      sync_timestamp: new Date().toISOString(),
      creators: Array.isArray(dataItems) ? dataItems : [dataItems],
      summary: {
        total_creators: Array.isArray(dataItems) ? dataItems.length : 1,
        active_creators: Array.isArray(dataItems) ? dataItems.length : 1,
        pending_creators: 0,
        total_risk_capital: 0,
        next_payout_amount: 0,
        creators_with_issues: 0
      }
    };

    // Save to Firestore landing zone
    await db.collection('missedPayments').add({
      ...payload,
      processed: false,
      server_timestamp: admin.firestore.FieldValue.serverTimestamp(),
      source: 'Apify_Automation'
    });

    console.log(`Successfully queued ${payload.summary.total_creators} records for processing.`);
    res.status(200).json({ saved: true });
  } catch (error) {
    console.error('Webhook Failure:', error);
    res.status(500).json({ saved: false, error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Automation Webhook Server Active on Port ${PORT}`));