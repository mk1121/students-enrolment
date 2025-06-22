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