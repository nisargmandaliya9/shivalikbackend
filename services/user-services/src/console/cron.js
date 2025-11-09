const cron = require('node-cron');
const LeaveRequestsModel = require('../models/leaverequests.js');
const UsersModel = require('../models/users.js');
const { sendPushNotification } = require('../libs/firebaseNotification.js');

// MongoDB Atlas connection string
// const mongoURI = process.env.ENTRYTRACKING_DB_URL;
// const dbName = process.env.DB_NAME;
// const bucketName = process.env.AWS_BUCKET;
// const AWS = require('aws-sdk');
// const s3 = new AWS.S3({
// 	accessKeyId: process.env.AWS_ACCESS_KEY,
// 	secretAccessKey: process.env.AWS_SECRET_KEY,
// 	region: process.env.AWS_DEFAULT_REGION,
// });

// league data store to DB from bet365 data.
// const testing = async (req, res) => {
// 	try {
// 		console.log("******************************* Cron is working fine.");
// 	} catch (err) {
// 		console.log(err);
// 	}
// }


// const webRegistrationReportCron = async () => {
//   try {
//     console.log('R Registration from web : Report Cron started');

//     // Logic of Cron Function

//     console.log('Lead Task Report Cron finished');
//   } catch (err) {
//     console.error('Lead Task Report Cron Error:', err);
//   }
// };

const autoCancelPendingLeaves = async () => {
	try {
		console.log('Auto-cancel pending leaves cron started');

		const now = new Date();

		// Find pending leave requests whose to_date has passed
		const toCancel = await LeaveRequestsModel.find({
			status: 'Pending',
			isDeleted: false,
			to_date: { $lt: now },
		});

		if (!toCancel || toCancel.length === 0) {
			console.log('No pending leaves to auto-cancel');
			return;
		}

		for (const req of toCancel) {
			try {
				req.status = 'Rejected';
				req.rejection_reason = 'Auto cancelled: leave date passed without action';
				await req.save();

				// Notify employee about auto-rejection
				const employee = await UsersModel.findById(req.employee_id);
				if (employee && employee.device_token) {
					try {
						await sendPushNotification(
							employee.device_token,
							'Leave Auto-cancelled',
							`Your leave request for ${new Date(req.from_date).toLocaleDateString()} to ${new Date(req.to_date).toLocaleDateString()} was auto-cancelled because it was not actioned.`,
							{ type: 'LEAVE_AUTO_CANCELLED', request_id: req._id.toString() }
						);
					} catch (pushErr) {
						console.error('Push notification failed for auto-cancel:', pushErr);
					}
				}
			} catch (innerErr) {
				console.error('Failed to auto-cancel a leave request:', innerErr);
			}
		}

		console.log(`Auto-cancelled ${toCancel.length} pending leave(s)`);
	} catch (err) {
		console.error('Error in autoCancelPendingLeaves cron:', err);
	}
}

// Schedule the auto-cancel job to run every day at 00:00
try {
	cron.schedule('0 0 * * *', autoCancelPendingLeaves);
	console.log('Scheduled autoCancelPendingLeaves to run every day at 00:00');
} catch (scheduleErr) {
	console.error('Failed to schedule autoCancelPendingLeaves:', scheduleErr);
}

// Defind object to all function.
const obj = {
	// testing: testing,
	// webRegistrationReportCron: webRegistrationReportCron,
	autoCancelPendingLeaves: autoCancelPendingLeaves
}

const job = (cron, time, fname) => {
	try {
		const cronJob = cron.schedule(time, obj[fname]);
		cronJob.start();
	} catch (err) {
		console.log(err);
	}
}

module.exports = {
  job,
}