const { Schema, model } = require('mongoose');

const OrderSchema = Schema(
    {
        subtotal: Number,
        discount: Number,
        total: Number,
        client: {
            type: Schema.Types.ObjectId, ref: 'clients'
        },
    }, { timestamps: true }
);

OrderSchema.method('toJSON', function () {
    const { __v, _id, ...object } = this.toObject();
    object.uid = _id;
    return object;
});

module.exports = model('Order', OrderSchema);