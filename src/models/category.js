const { Schema, model } = require('mongoose');

const CategorySchema = Schema(
    {
        name: {
            type: String,
            unique: true,
        },
    }, { timestamps: true }
);

CategorySchema.method('toJSON', function () {
    const { __v, _id, ...object } = this.toObject();
    object.uid = _id;
    return object;
});

module.exports = model('Category', CategorySchema);