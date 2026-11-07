// Firebase Web config is public by design. Protect database access with Rules.
export const firebaseConfig = {
  apiKey: "YOUR_FIREBASE_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  databaseURL: "https://YOUR_PROJECT_ID-default-rtdb.firebaseio.com",
  projectId: "YOUR_PROJECT_ID",
  appId: "YOUR_FIREBASE_APP_ID"
};

// Google OAuth Web client ID. Leave blank until configured in Google Cloud.
export const googleClientId = "YOUR_GOOGLE_OAUTH_CLIENT_ID.apps.googleusercontent.com";
