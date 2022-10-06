const { response } = require("express");
const Visit = require("../models/visit");
const Client = require("../models/client");

const createVisit = async (facebookId) => {
    try {

        const client = await Client.findOne({ facebookId });
        if (!client) {
            return;
        }
        const currentVisit = await Visit.findOneAndUpdate(
            {
                client: client,
                isClosed: false
            }, { isClosed: true }
        );
        if (currentVisit) {
            await currentVisit.save();
        }
        const visit = new Visit({ client: client.id });

        await visit.save();

        return visit;

    } catch (error) {
        console.log(error);
        return;
    }
}

const editVisit = async (facebookId, req) => {
    try {
        const client = await Client.findOne({ facebookId });
        if (!client) {
            return;
        }
        const currentVisit = await Visit.findOneAndUpdate(
            {
                client: client,
                isClosed: false
            }, req
        );
        if (currentVisit) {
            await currentVisit.save();
            return;
        }
        console.log('visit', currentVisit);
        return currentVisit;

    } catch (error) {
        console.log(error);
        return;
    }

}

const getCurrentVisit = async (facebookId) => {
    try {
        const client = await Client.findOne({ facebookId });
        if (!client) {
            return;
        }
        const currentVisit = await Visit.findOne({
            client: client,
            isClosed: false
        });

        return currentVisit;

    } catch (error) {
        console.log(error);
        return;
    }

}

module.exports = {
    createVisit,
    editVisit,
    getCurrentVisit
}