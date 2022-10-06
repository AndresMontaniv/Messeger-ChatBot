const { response } = require("express");
const Client = require("../models/client");

const createUser = async (req, res = response) => {
    const { name } = req.body;
    try {



        const client = new Client(req.body);

        await user.save();

        res.json({
            ok: true,
            user
        });

    } catch (error) {
        console.log(error);
        res.status(500).json({
            ok: false,
            message: 'Hable Con el Admin'
        });
    }




}

module.exports = {
    createUser
}