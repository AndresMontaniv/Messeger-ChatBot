const { Schema, model } = require('mongoose');

const VisitSchema = Schema(
    {
        _id: Number,
        score: Number,
        name: {
            type: String,
            trim: true
        },
        email: {
            type: String,
            trim: true
        },
        phone: {
            type: String,
            trim: true
        },
        isClosed: {
            type: Boolean,
            default: false
        },
        client: {
            type: mongoose.Schema.Types.ObjectId, ref: 'clients'
        },
    }, { timestamps: true }
);

VisitSchema.method('toJSON', function () {
    const { __v, _id, ...object } = this.toObject();
    object.uid = _id;
    return object;
});

module.exports = model('Visit', VisitSchema);