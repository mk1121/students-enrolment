# Gmail OAuth 2.0 Setup Guide

This guide will help you set up Gmail OAuth 2.0 authentication for the Students Enrollment System email functionality.

## Quick Setup Process

### Step 1: Get credentials.json file

1. Go to [Gmail API Quickstart](https://developers.google.com/gmail/api/quickstart/nodejs)
2. Click **"Enable the Gmail API"**
3. Choose **"Desktop app"** as the application type
4. Download the `credentials.json` file
5. Save this file in your project root directory

### Step 2: Create the OAuth setup script

Create a file called `gmail-oauth-setup.js` in your project root with this content:

```javascript
const fs = require('fs');
const readline = require('readline');
const {google} = require('googleapis');

// If modifying these scopes, delete token.json.
const SCOPES = ['https://mail.google.com'];
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = 'token.json';

// Load client secrets from a local file.
fs.readFile('credentials.json', (err, content) => {
    if(err){
        return console.log('Error loading client secret file:', err);
    }

    // Authorize the client with credentials, then call the Gmail API.
    authorize(JSON.parse(content), getAuth);
});

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(credentials, callback) {
    const {client_secret, client_id, redirect_uris} = credentials.installed;
    const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

    // Check if we have previously stored a token.
    fs.readFile(TOKEN_PATH, (err, token) => {
        if(err){
            return getNewToken(oAuth2Client, callback);
        }
        oAuth2Client.setCredentials(JSON.parse(token));
        callback(oAuth2Client);
    });
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback for the authorized client.
 */
function getNewToken(oAuth2Client, callback) {
    const authUrl = oAuth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES,
    });
    console.log('Authorize this app by visiting this url:', authUrl);
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });
    rl.question('Enter the code from that page here: ', (code) => {
        rl.close();
        oAuth2Client.getToken(code, (err, token) => {
        if (err) return console.error('Error retrieving access token', err);
        oAuth2Client.setCredentials(token);
        // Store the token to disk for later program executions
        fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
            if (err) return console.error(err);
            console.log('Token stored to', TOKEN_PATH);
        });
        callback(oAuth2Client);
        });
    });
}

function getAuth(auth) {
    console.log('✅ OAuth2 authentication successful!');
    console.log('📋 Token information:');
    console.log('   Access Token:', auth.credentials.access_token ? 'Present' : 'Not present');
    console.log('   Refresh Token:', auth.credentials.refresh_token ? 'Present' : 'Not present');
    console.log('   Expiry Date:', auth.credentials.expiry_date ? new Date(auth.credentials.expiry_date).toLocaleString() : 'Not set');
    
    // Extract and display the refresh token for .env file
    if (auth.credentials.refresh_token) {
        console.log('\n🔑 Refresh Token for .env file:');
        console.log(`GMAIL_REFRESH_TOKEN=${auth.credentials.refresh_token}`);
    }
    
    // Test Gmail API access
    const gmail = google.gmail({version: 'v1', auth});
    gmail.users.getProfile({userId: 'me'}, (err, res) => {
        if (err) {
            console.log('❌ Gmail API test failed:', err.message);
        } else {
            console.log('✅ Gmail API test successful!');
            console.log('   Email address:', res.data.emailAddress);
        }
    });
}
```

### Step 3: Run the setup script

In your terminal, run:

```bash
node gmail-oauth-setup.js
```

Follow the prompts:
1. Visit the authorization URL that appears
2. Sign in with your Gmail account
3. Grant the requested permissions
4. Copy the authorization code
5. Paste it back into the terminal

### Step 4: Get your credentials

After running the script, you'll have:
- `credentials.json` - Contains your Client ID and Client Secret
- `token.json` - Contains your access and refresh tokens

### Step 5: Extract the information

Open both files and extract the following information:

**From `credentials.json`:**
```json
{
  "installed": {
    "client_id": "YOUR_CLIENT_ID",
    "client_secret": "YOUR_CLIENT_SECRET"
  }
}
```

**From `token.json`:**
```json
{
  "refresh_token": "YOUR_REFRESH_TOKEN"
}
```

### Step 6: Use in your email function

Create your email sending function with the extracted information:

```javascript
const nodemailer = require('nodemailer');
const { google } = require("googleapis");
const OAuth2 = google.auth.OAuth2;

// Fill in your extracted information here
const email = 'your-gmail@gmail.com'           // Your Gmail address
const clientId = 'YOUR_CLIENT_ID'              // From credentials.json
const clientSecret = 'YOUR_CLIENT_SECRET'      // From credentials.json
const refresh = 'YOUR_REFRESH_TOKEN'           // From token.json

async function sendEmail() {
    try {
        const oauth2Client = new OAuth2(
            clientId,
            clientSecret,
            'https://developers.google.com/oauthplayground' // Redirect URI
        );

        oauth2Client.setCredentials({
            refresh_token: refresh
        });
        
        // Get new access token
        const { token: newAccessToken } = await oauth2Client.getAccessToken();

        let transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                type: 'OAuth2',
                user: email,
                clientId: clientId,
                clientSecret: clientSecret,
                refreshToken: refresh,
                accessToken: newAccessToken
            }
        });

        const mailOptions = {
            from: email,
            to: email, // Send to yourself for testing
            subject: "Node.js Email with Secure OAuth",
            generateTextFromHTML: true,
            html: "<b>test</b>"
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent:', info.response);
        transporter.close();
        
    } catch (error) {
        console.error('Error sending email:', error);
    }
}

sendEmail();
```

## Alternative: Use Environment Variables

Instead of hardcoding the values, you can use environment variables:

1. Create a `.env` file in your project root:
```env
EMAIL_USER=your-gmail@gmail.com
GMAIL_CLIENT_ID=YOUR_CLIENT_ID
GMAIL_CLIENT_SECRET=YOUR_CLIENT_SECRET
GMAIL_REFRESH_TOKEN=YOUR_REFRESH_TOKEN
```

2. Use the `test-nodemailer-oauth2-fixed.js` script that's already in your project.

## Troubleshooting

### Common Issues:

1. **"Invalid client_id"** - Check that your Client ID is correct
2. **"Token has been expired or revoked"** - Generate a new refresh token
3. **"Insufficient permissions"** - Make sure Gmail API is enabled
4. **"BadCredentials"** - Your refresh token is invalid, generate a new one

### Security Notes:

- Never commit `credentials.json` or `token.json` to version control
- Add them to your `.gitignore` file
- Use environment variables in production
- Regularly rotate your refresh tokens

## Testing

After setup, test your configuration:

```bash
node test-nodemailer-oauth2-fixed.js
```

If successful, you should receive a test email at your Gmail address. 