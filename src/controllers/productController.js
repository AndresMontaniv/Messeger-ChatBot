const { response } = require("express");
const Product = require("../models/product");

const createProduct = async (req, res = response) => {
    const { name } = req.body;
    try {
        const existProduct = await Usuario.findOne({ name });
        if (existProduct) {
            return res.status(400).json({
                ok: false,
                message: 'Ese nombre ya esta ocupado'
            });
        }
        const user = new Product(req.body);

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
    createProduct
}