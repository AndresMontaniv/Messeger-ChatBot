const { Schema, model } = require('mongoose');

const ProductSchema = Schema(
    {
        name: {
            type: String,
            required: true,
            unique: true
        },
        description: String,
        price: Number,
        category: {
            type: Schema.Types.ObjectId, ref: 'categories'
        },
    }, { timestamps: true }
);

ProductSchema.method('toJSON', function () {
    const { __v, _id, ...object } = this.toObject();
    object.uid = _id;
    return object;
});

module.exports = model('Product', ProductSchema);