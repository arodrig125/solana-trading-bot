const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');
const logger = require('./logger');

// Setup Google credentials
function setupCredentials() {
  // Check if we have the credentials in environment variables
  if (process.env.GOOGLE_CREDENTIALS) {
    try {
      // Try to parse the credentials from the environment variable
      const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS);
      
      // Write the credentials to a file
      fs.writeFileSync(
        path.join(__dirname, '..', 'credentials.json'),
        JSON.stringify(credentials, null, 2)
      );
      
      logger.successMessage('Google credentials.json file created successfully');
      return true;
    } catch (error) {
      logger.errorMessage('Error creating credentials.json file', error);
      return false;
    }
  } else {
    logger.warningMessage('No GOOGLE_CREDENTIALS environment variable found');
    // Check if credentials.json already exists
    if (fs.existsSync(path.join(__dirname, '..', 'credentials.json'))) {
      logger.successMessage('Using existing credentials.json file');
      return true;
    } else {
      logger.warningMessage('No credentials.json file found. Google Sheets functionality will be disabled.');
      return false;
    }
  }
}

// Get Google Sheets client
async function getSheetsClient() {
  try {
    // Try to find credentials.json in the root directory
    const credentialsPath = path.join(__dirname, '..', 'credentials.json');
    if (!fs.existsSync(credentialsPath)) {
      logger.errorMessage('credentials.json not found');
      return null;
    }
    
    const auth = new google.auth.GoogleAuth({
      keyFile: credentialsPath,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
    const client = await auth.getClient();
    return google.sheets({ version: 'v4', auth: client });
  } catch (error) {
    logger.errorMessage('Error initializing Google Sheets client', error);
    return null;
  }
}

// Log data to Google Sheets
async function logToSheets(sheetsClient, sheetId, values, range = 'Sheet1!A:Z') {
  if (!sheetsClient) return false;
  
  try {
    await sheetsClient.spreadsheets.values.append({
      spreadsheetId: sheetId,
      range: range,
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'INSERT_ROWS',
      resource: {
        values: [values],
      },
    });
    logger.successMessage(`Data logged to Google Sheets: ${range}`);
    return true;
  } catch (error) {
    logger.errorMessage('Error logging to Google Sheets', error);
    return false;
  }
}

// Initialize Google Sheets with proper headers if needed
async function initializeSheets(sheetsClient, sheetId) {
  if (!sheetsClient || !sheetId) return false;
  
  try {
    // Check if the sheet exists and has headers
    const response = await sheetsClient.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: 'Trades!A1:J1',
    });
    
    // If no data or no headers, add them
    if (!response.data.values || response.data.values.length === 0) {
      // Add headers for Trades sheet
      await sheetsClient.spreadsheets.values.update({
        spreadsheetId: sheetId,
        range: 'Trades!A1:J1',
        valueInputOption: 'USER_ENTERED',
        resource: {
          values: [[
            'Timestamp',
            'Mode',
            'Type',
            'Path/Pair',
            'Input Amount',
            'Output Amount',
            'Profit Amount',
            'Profit %',
            'Status',
            'Transaction ID'
          ]]
        }
      });
      
      logger.successMessage('Initialized Trades sheet with headers');
    }
    
    // Check if Summary sheet exists and has headers
    try {
      const summaryResponse = await sheetsClient.spreadsheets.values.get({
        spreadsheetId: sheetId,
        range: 'Summary!A1:I1',
      });
      
      // If no data or no headers, add them
      if (!summaryResponse.data.values || summaryResponse.data.values.length === 0) {
        // Add headers for Summary sheet
        await sheetsClient.spreadsheets.values.update({
          spreadsheetId: sheetId,
          range: 'Summary!A1:I1',
          valueInputOption: 'USER_ENTERED',
          resource: {
            values: [[
              'Date',
              'Trades Today',
              'Successful Trades',
              'Failed Trades',
              'Profit Today',
              'Volume Today',
              'Total Trades',
              'Total Profit',
              'Avg Profit %'
            ]]
          }
        });
        
        logger.successMessage('Initialized Summary sheet with headers');
      }
    } catch (error) {
      // Summary sheet might not exist, create it
      await sheetsClient.spreadsheets.batchUpdate({
        spreadsheetId: sheetId,
        resource: {
          requests: [
            {
              addSheet: {
                properties: {
                  title: 'Summary',
                  gridProperties: {
                    rowCount: 1000,
                    columnCount: 10
                  }
                }
              }
            }
          ]
        }
      });
      
      // Add headers for the new Summary sheet
      await sheetsClient.spreadsheets.values.update({
        spreadsheetId: sheetId,
        range: 'Summary!A1:I1',
        valueInputOption: 'USER_ENTERED',
        resource: {
          values: [[
            'Date',
            'Trades Today',
            'Successful Trades',
            'Failed Trades',
            'Profit Today',
            'Volume Today',
            'Total Trades',
            'Total Profit',
            'Avg Profit %'
          ]]
        }
      });
      
      logger.successMessage('Created and initialized Summary sheet with headers');
    }
    
    return true;
  } catch (error) {
    logger.errorMessage('Error initializing Google Sheets', error);
    return false;
  }
}

// Log opportunity to Google Sheets
async function logOpportunity(sheetsClient, sheetId, opportunity) {
  if (!sheetsClient || !sheetId) return false;
  
  try {
    const values = [
      new Date().toISOString(),
      opportunity.type,
      opportunity.type === 'triangular' 
        ? opportunity.path.map(p => `${p.from}-${p.to}`).join('->') 
        : opportunity.pair,
      opportunity.startAmount || opportunity.inputAmount,
      opportunity.endAmount || opportunity.outputAmount1,
      opportunity.profitAmount,
      opportunity.profitPercent.toFixed(2),
      'OPPORTUNITY'
    ];
    
    return await logToSheets(sheetsClient, sheetId, values, 'Opportunities!A:H');
  } catch (error) {
    logger.errorMessage('Error logging opportunity to Google Sheets', error);
    return false;
  }
}

// Log trade to Google Sheets
async function logTrade(sheetsClient, sheetId, trade) {
  if (!sheetsClient || !sheetId) return false;
  
  try {
    const opportunity = trade.opportunity;
    
    const values = [
      new Date().toISOString(),
      trade.simulation ? 'SIMULATION' : 'LIVE',
      opportunity.type,
      opportunity.type === 'triangular' 
        ? opportunity.path.map(p => `${p.from}-${p.to}`).join('->') 
        : opportunity.pair,
      opportunity.startAmount || opportunity.inputAmount,
      opportunity.endAmount || opportunity.outputAmount1,
      opportunity.profitAmount,
      opportunity.profitPercent.toFixed(2),
      trade.success ? 'SUCCESS' : 'FAILED',
      trade.txId || 'N/A'
    ];
    
    return await logToSheets(sheetsClient, sheetId, values, 'Trades!A:J');
  } catch (error) {
    logger.errorMessage('Error logging trade to Google Sheets', error);
    return false;
  }
}

// Log daily summary to Google Sheets
async function logDailySummary(sheetsClient, sheetId, summary) {
  if (!sheetsClient || !sheetId) return false;
  
  try {
    const today = new Date().toISOString().split('T')[0];
    const todayStats = summary.today;
    
    const values = [
      today,
      todayStats.trades,
      todayStats.successfulTrades,
      todayStats.failedTrades,
      todayStats.profit.toFixed(6),
      todayStats.volume.toFixed(2),
      summary.overall.totalTrades,
      summary.overall.totalProfit.toFixed(6),
      summary.overall.averageProfitPercent.toFixed(2)
    ];
    
    return await logToSheets(sheetsClient, sheetId, values, 'Summary!A:I');
  } catch (error) {
    logger.errorMessage('Error logging daily summary to Google Sheets', error);
    return false;
  }
}

module.exports = {
  setupCredentials,
  getSheetsClient,
  logToSheets,
  initializeSheets,
  logOpportunity,
  logTrade,
  logDailySummary
};
