

const product = require('../models/product');
const image = require('../models/image');
const category = require('../models/category');
const deal = require('../models/deal');

async function intentController(result, senderId) {
    let request_body = {};

}


async function producto(response, senderId) {
    // buscar en la base de datos mongoose las 10 primeras poleras
    const dataDB = await product.find().limit(10);
    let productos = '';
    let images = [];
    dataDB.forEach((producto) => {
    pizzas += `\r\n🍕 *${pizza.nombre}* ${pizza.tamano} a ${pizza.precio}Bs. `;
    images.push({ url: pizza.imagen, is_reusable: true });
    });
    const res = response.replace('[x]', pizzas + '\r\n');
    await sendImages(images, senderId).catch((err) => {
    console.log(err);
    return res;
    });
    return res;
}

async function imagenesF(id_prod) {
    const dataDB = await image.find( {product: id_prod});
   // let imagenes = '';
    let imagenes = [];
    dataDB.forEach((imagen) => {
        imagenes.push({ url: imagen.url, is_reusable: true });
    });

    return imagenes;
}

async function categoriasF() {
    const dataDB = await category.find();
    return dataDB;
}

async function ofertasF() {
    const dataDB = await deal.find().sort({$natural:-1}).limit(1);
    return dataDB;
}


module.exports = intentController;