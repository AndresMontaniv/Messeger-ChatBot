const { response } = require("express");
const User = require("../models/user");

const createUser = async (req, res = response) => {
    const { name } = req.body;
    try {

        const user = new User(req.body);

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