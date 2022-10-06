const { response } = require("express");
const Client = require("../models/client");

const createClient = async (firstName, lastName, profilePic, facebookId, phone, email, isClient = false) => {
    try {
        const existClient = await Client.findOne({ facebookId });
        if (existClient) {
            return;
        }
        const client = new Client({
            firstName,
            lastName,
            facebookId,
            profilePic,
            phone,
            email,
            isClient
        });

        await client.save();

        return client;

    } catch (error) {
        console.log(error);
        return;
    }
}

const editClient = async (facebookId, req) => {
    try {

        const client = await Client.findOneAndUpdate({ facebookId }, req);

        await client.save();

        return client;

    } catch (error) {
        console.log(error);
        return;
    }

}

module.exports = {
    createClient,
    editClient
}