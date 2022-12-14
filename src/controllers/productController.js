const { response } = require("express");
const Product = require("../models/product");
const Deal = require("../models/deal");
const Discount = require("../models/discount");

const createProduct = async (req, res = response) => {
    const { name } = req.body;
    try {
        const existProduct = await Product.findOne({ name });

        if (existProduct) {
            return res.status(400).json({
                ok: false,
                message: 'Ese nombre ya esta ocupado.'
            });
        }
        const product = new Product(req.body);

        await product.save();

        res.json({
            ok: true,
            product
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