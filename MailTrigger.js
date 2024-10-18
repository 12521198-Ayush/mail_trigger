const fetch = require('node-fetch');
const nodemailer = require('nodemailer');
const cron = require('node-cron');

const users = {
    223: 'Ankush@complia.jrcompliance.com',
    135: 'ayusharma14102001@gmail.com'
};

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'qaz12521198@gmail.com',
        pass: 'lwht kqyrnthdfwip'
    }
});

function sendEmail(userId, leaveType) {
    const recipientEmail = users[userId];
    if (!recipientEmail) {
        console.log(`No email found for User ID: ${userId}`);
        return;
    }

    const mailOptions = {
        from: 'qaz12521198@gmail.com',
        to: recipientEmail,
        subject: `${leaveType} Notice for User ID: ${userId}`,
        text: `User ID: ${userId} has been marked for a ${leaveType}.`
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.log('Error sending email:', error);
        } else {
            console.log('Email sent:', info.response);
        }
    });
}

function calculateDuration(timeStart, timeFinish) {
    const startTime = new Date(timeStart).getTime();
    const finishTime = timeFinish ? new Date(timeFinish).getTime() : new Date().getTime();
    const durationHours = (finishTime - startTime) / (1000 * 60 * 60);
    return durationHours;
}

async function checkUserStatus(userId) {
    const url = `https://jrcompliance.bitrix24.in/rest/135/nmx9v3wo9g6g23an/timeman.status.json?USER_ID=${userId}`;

    try {
        const response = await fetch(url);
        const data = await response.json();
        
        const { STATUS, TIME_START, TIME_FINISH } = data.result;

        if (STATUS === "CLOSED" && TIME_START) {
            const duration = calculateDuration(TIME_START, TIME_FINISH);

            if (duration < 5) {
                sendEmail(userId, 'Half Day Leave');
            } else if (duration >= 5 && duration < 8) {
                sendEmail(userId, 'Short Leave');
            } else {
                console.log(`User ${userId} has worked more than 8 hours.`);
            }
        } else {
            console.log(`User ${userId} has not completed the work day or is still working.`);
        }

    } catch (error) {
        console.log(`Error fetching status for user ${userId}:`, error);
    }
}

function checkAllUsers() {
    console.log("Checking user statuses...");
    Object.keys(users).forEach(userId => {
        checkUserStatus(userId);
    });
}

cron.schedule('0 17 * * *', () => {
    checkAllUsers();
    console.log("Checked user statuses once for today.");
});

// Optionally, log when the script starts
console.log("Script started. Will check every day at 5:00 PM.");
