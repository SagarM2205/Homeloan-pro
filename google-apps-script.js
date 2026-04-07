// ===============================================
// SENIOR LEVEL: GOOGLE SHEETS WEBHOOK (V2)
// FEATURES: Daily Partitioning, UTM Tracking, Lead IDs
// ===============================================

/**
 * 1. Go to Sheets > Extensions > Apps Script.
 * 2. Paste this code.
 * 3. Deploy > New Deployment > Web App.
 * 4. Access: "Anyone".
 * 5. UPDATE the URL in your script.js.
 */

function doPost(e) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    
    // 1. Generate Daily Tab Name (e.g., Leads_Apr-07-2026)
    const now = new Date();
    const dateStr = Utilities.formatDate(now, ss.getSpreadsheetTimeZone(), "MMM-dd-yyyy");
    const sheetName = "Leads_" + dateStr;
    
    // 2. Get or Create the sheet for today
    let sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
      // Add Headers for a professional look
      const headers = ["Lead ID", "Timestamp", "Name", "Phone", "Loan Type", "Income", "Amount", "Source (UTM)", "Page URL"];
      sheet.appendRow(headers);
      sheet.getRange("A1:I1").setFontWeight("bold").setBackground("#F0F8F7").setFontColor("#0C7C6E");
      sheet.setFrozenRows(1); // Freeze the header row
    }
    
    // 3. Parse incoming data
    const data = JSON.parse(e.postData.contents);
    
    // 4. Generate a more professional Reference ID
    // Example: HLP-240407-1234
    const idSuffix = Math.floor(Math.random() * 9000) + 1000;
    const leadId = "HLP-" + Utilities.formatDate(now, ss.getSpreadsheetTimeZone(), "yyMMdd") + "-" + idSuffix;

    const rowData = [
      leadId,
      new Date(),
      data.name || "--",
      data.phone || "--",
      data.type || "--",
      data.income || "--",
      data.loanNeeded || "--",
      data.source || "Organic",
      data.url || "Home"
    ];

    // 5. Save the data
    sheet.appendRow(rowData);
    sheet.autoResizeColumns(1, 9); // Auto-fit columns

    // 6. Send instant Email Notification
    sendLeadEmail(data, leadId);

    return ContentService
      .createTextOutput(JSON.stringify({ "status": "success", "leadId": leadId }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ "status": "error", "message": error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function sendLeadEmail(data, leadId) {
  const emailAddress = Session.getActiveUser().getEmail(); 
  const subject = `🚀 [NEW LEAD] ${leadId}: ${data.name} (${data.type})`;
  
  const htmlBody = `
    <div style="font-family: sans-serif; padding: 20px; color: #333; line-height: 1.6;">
      <h2 style="color: #0C7C6E;">You received a fresh lead!</h2>
      <p><strong>Reference ID:</strong> ${leadId}</p>
      <hr style="border: 0; border-top: 1px solid #eee;">
      <table style="width: 100%; border-collapse: collapse;">
        <tr><td style="padding: 8px 0; border-bottom: 1px solid #f9f9f9;"><strong>Name:</strong></td><td style="padding: 8px 0; border-bottom: 1px solid #f9f9f9;">${data.name}</td></tr>
        <tr><td style="padding: 8px 0; border-bottom: 1px solid #f9f9f9;"><strong>Phone:</strong></td><td style="padding: 8px 0; border-bottom: 1px solid #f9f9f9;"><a href="tel:${data.phone}">${data.phone}</a></td></tr>
        <tr><td style="padding: 8px 0; border-bottom: 1px solid #f9f9f9;"><strong>Loan Type:</strong></td><td style="padding: 8px 0; border-bottom: 1px solid #f9f9f9;">${data.type}</td></tr>
        <tr><td style="padding: 8px 0; border-bottom: 1px solid #f9f9f9;"><strong>Monthly Income:</strong></td><td style="padding: 8px 0; border-bottom: 1px solid #f9f9f9;">${data.income}</td></tr>
        <tr><td style="padding: 8px 0; border-bottom: 1px solid #f9f9f9;"><strong>Loan Needed:</strong></td><td style="padding: 8px 0; border-bottom: 1px solid #f9f9f9;">${data.loanNeeded}</td></tr>
        <tr><td style="padding: 8px 0; border-bottom: 1px solid #f9f9f9;"><strong>Source:</strong></td><td style="padding: 8px 0; border-bottom: 1px solid #f9f9f9;">${data.source || 'Direct'}</td></tr>
      </table>
      <p style="margin-top: 20px; font-size: 12px; color: #999;">This lead has been saved to your daily Google Sheet tab.</p>
    </div>
  `;

  MailApp.sendEmail({
    to: emailAddress,
    subject: subject,
    htmlBody: htmlBody
  });
}

function doOptions(e) {
  return ContentService.createTextOutput("").setMimeType(ContentService.MimeType.JSON);
}
