const { Schema, model } = require('mongoose');

const ClientSchema = Schema(
    {
        _id: Number,
        firstName: {
            type: String,
            trim: true
        },
        lastName: {
            type: String,
            trim: true
        },
        facebookId: {
            type: String,
            unique: true,
        },
        profilePic: String,
        phone: {
            type: String,
            trim: true
        },
        email: {
            type: String,
            trim: true
        },
        isClient: Boolean,
    }, { timestamps: true }
);

ClientSchema.method('toJSON', function () {
    const { __v, _id, ...object } = this.toObject();
    object.uid = _id;
    return object;
});

module.exports = model('Client', ClientSchema);