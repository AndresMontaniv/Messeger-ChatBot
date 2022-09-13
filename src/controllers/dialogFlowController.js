require('dotenv').config();
const dialogflow = require("dialogflow");
const uuid = require("uuid");

const GOOGLE_PROJECT_ID = process.env.GOOGLE_PROJECT_ID;
const GOOGLE_CLIENT_EMAIL = process.env.GOOGLE_CLIENT_EMAIL;
const GOOGLE_PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY;
const DF_LANGUAGE_CODE = process.env.DF_LANGUAGE_CODE;


const sessionIds = new Map();

function setSessionAndUser(senderID) {
    if (!sessionIds.has(senderID)) {
        sessionIds.set(senderID, uuid.v1());
    }
}

const credentials = {
    client_email: GOOGLE_CLIENT_EMAIL,
    private_key: GOOGLE_PRIVATE_KEY,
};

const sessionClient = new dialogflow.SessionsClient({
    projectId: GOOGLE_PROJECT_ID,
    credentials,
});

/**
 * Send a query to the dialogflow agent, and return the query result.
 * @param {string} projectId The project to be used
 */
async function sendToDialogFlow(sender, msg, params) {
    let textToDialogFlow = msg;
    console.log("Project Id = ", GOOGLE_PROJECT_ID);
    console.log("Client Email = ", GOOGLE_CLIENT_EMAIL);
    console.log("Priv Key = ", GOOGLE_PRIVATE_KEY);
    console.log("Language = ", DF_LANGUAGE_CODE);
    console.log("se cago: ", msg);
    setSessionAndUser(sender);
    console.log("se cago");
    try {
        const sessionPath = sessionClient.sessionPath(
            GOOGLE_PROJECT_ID,
            sessionIds.get(sender)
        );
        console.log("se cago");
        const request = {
            session: sessionPath,
            queryInput: {
                text: {
                    text: textToDialogFlow,
                    languageCode: DF_LANGUAGE_CODE,
                },
            },
            queryParams: {
                payload: {
                    data: params,
                },
            },
        };
        const responses = await sessionClient.detectIntent(request);
        console.log("responses.....:", responses);
        const result = responses[0].queryResult;
        let defaultResponses = [];
        if (result.action !== "input.unknown") {
            result.fulfillmentMessages.forEach((element) => {
                if (element.platform === source) {
                    defaultResponses.push(element);
                }
            });
        }
        if (defaultResponses.length > 0) {
            result.fulfillmentMessages = defaultResponses;
            return result;
        }
        return result;

    } catch (e) {
        console.log("error");
        console.log(e);
    }
}

module.exports = {
    sendToDialogFlow,
};
