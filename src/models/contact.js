const { Schema, model } = require('mongoose');

const ContactSchema = Schema(
    {
        score: Number,
        notes: {
            type: [String],
        },
        client: {
            type: Schema.Types.ObjectId, ref: 'clients',
            required: true,
        },
        user: {
            type: Schema.Types.ObjectId, ref: 'users'
        },
    }, { timestamps: true }
);

ContactSchema.method('toJSON', function () {
    const { __v, _id, ...object } = this.toObject();
    object.uid = _id;
    return object;
});

module.exports = model('Contact', ContactSchema);