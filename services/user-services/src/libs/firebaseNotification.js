const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
// Note: You need to put your firebase-service-account.json in the root directory
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const sendPushNotification = async (deviceToken, title, body, data = {}) => {
    try {
        if (!deviceToken) {
            console.log('No device token available to send notification');
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
            token: deviceToken
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