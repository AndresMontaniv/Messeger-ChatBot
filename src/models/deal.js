const { Schema, model } = require('mongoose');

const DealSchema = Schema(
    {
        name: {
            type: String,
            required: true,
            unique: true
        },
        from: {
            type: Date,
            required: true,
        },
        to: {
            type: Date,
            required: true,
        },
        discount: {
            type: Number,
            required: true,   
        }

    }, { timestamps: true }
);

DealSchema.method('toJSON', function () {
    const { __v, _id, ...object } = this.toObject();
    object.uid = _id;
    return object;
});

module.exports = model('Deal', DealSchema);