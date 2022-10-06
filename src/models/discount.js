const { Schema, model } = require('mongoose');

const DiscountSchema = Schema(
    {
        deal: {
            type: Schema.Types.ObjectId, ref: 'deals',
            require: true,
        },
        product: {
            type: Schema.Types.ObjectId, ref: 'products',
            require: true,
        },
    }, { timestamps: true }
);

DiscountSchema.method('toJSON', function () {
    const { __v, _id, ...object } = this.toObject();
    object.uid = _id;
    return object;
});

module.exports = model('Discount', DiscountSchema);