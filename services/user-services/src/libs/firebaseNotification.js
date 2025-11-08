const admin = require('firebase-admin');
const UsersModel = require('../models/users.js');

// Initialize Firebase Admin SDK
// Note: You need to put your firebase-service-account.json in the root directory
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const sendPushNotification = async (userId, title, body, data = {}) => {
    try {
        // Get user's FCM token from the database
        const user = await UsersModel.findById(userId);
        if (!user || !user.device_token) {
            console.log('No FCM token found for user:', userId);
            return false;
        }

        const message = {
            notification: {
                title,
                body
            },
            data: {
                ...data,
                click_action: 'NOTIFICATION_CLICK'
            },
            token: user.device_token
        };

        const response = await admin.messaging().send(message);
        console.log('Successfully sent notification:', response);
        return true;
    } catch (error) {
        console.error('Error sending notification:', error);
        return false;
    }
};

module.exports = {
    sendPushNotification
};