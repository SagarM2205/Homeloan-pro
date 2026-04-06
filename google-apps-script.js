// ==========================================
// GOOGLE SHEETS WEBHOOK FOR HOMELOAN PRO
// ==========================================

// 1. Create a new Google Sheet.
// 2. Click Extensions > Apps Script.
// 3. Delete any code in the editor and paste ALL of this code.
// 4. Click Deploy > New Deployment.
// 5. Select type: "Web app"
// 6. Execute as: "Me"
// 7. Who has access: "Anyone"
// 8. Click Deploy, authorize the permissions, and copy the "Web app URL"
// 9. Paste that URL into your script.js file where indicated!

const SHEET_NAME = "Sheet1"; // Change if your sheet tab is named differently

function doPost(e) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
    
    // Parse the incoming JSON data from the website
    const data = JSON.parse(e.postData.contents);
    
    // Check if sheet is empty and add headers if necessary
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(["Date", "Name", "Phone", "Loan Type", "Monthly Income", "Loan Needed"]);
      sheet.getRange("A1:F1").setFontWeight("bold");
    }

    // Prepare row data
    const rowData = [
      new Date(), 
      data.name || "",
      data.phone || "",
      data.type || "",
      data.income || "",
      data.loanNeeded || ""
    ];

    // 1. Save data to the Google Sheet
    sheet.appendRow(rowData);

    // 2. Send instant Email Notification
    // (MailApp uses the Gmail account you are logged into right now)
    const emailAddress = Session.getActiveUser().getEmail(); 
    const subject = `New Lead: ${data.name} (HomeLoan Pro)`;
    const message = `You received a new lead!\n\n` +
                    `Name: ${data.name || "--"}\n` +
                    `Phone: ${data.phone || "--"}\n` +
                    `Loan Type: ${data.type || "--"}\n` +
                    `Monthly Income: ${data.income || "--"}\n` +
                    `Loan Needed: ${data.loanNeeded || "--"}\n\n` +
                    `This lead has automatically been saved to your Google Sheet.`;

    MailApp.sendEmail(emailAddress, subject, message);

    return ContentService
      .createTextOutput(JSON.stringify({ "status": "success", "message": "Lead saved & emailed!" }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ "status": "error", "message": error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Handle preflight CORS requests
function doOptions(e) {
  return ContentService.createTextOutput("")
    .setMimeType(ContentService.MimeType.JSON);
}
