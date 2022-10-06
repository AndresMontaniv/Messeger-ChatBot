const { Schema, model } = require('mongoose');

const ImageSchema = Schema(
    {
        name: {
            type: String,
            required: true
        },
        url: {
            type: String,
            required: true,
        },
        product: {
            type: Schema.Types.ObjectId, ref: 'products'
        },

    }, { timestamps: true }
);

ImageSchema.method('toJSON', function () {
    const { __v, _id, ...object } = this.toObject();
    object.uid = _id;
    return object;
});

module.exports = model('Image', ImageSchema);