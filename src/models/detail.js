const { Schema, model } = require('mongoose');

const DetailSchema = Schema(
    {
        order: {
            type: Schema.Types.ObjectId, ref: 'orders',
            require: true,
        },
        product: {
            type: Schema.Types.ObjectId, ref: 'products',
            require: true,
        },
        cant: {
            type: Number,
            default: 1,
        },
    }, { timestamps: true }
);

DetailSchema.method('toJSON', function () {
    const { __v, _id, ...object } = this.toObject();
    object.uid = _id;
    return object;
});

module.exports = model('Detail', DetailSchema);