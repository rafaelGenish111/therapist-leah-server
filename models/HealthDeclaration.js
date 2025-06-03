const mongoose = require('mongoose');
const { validate } = require('./User');

const healthDeclarationSchema = new mongoose.Schema({
    fullName: {
        type: String,
        required: true,
        trim: true,
        maxLength: 100
    },
    idNumber: {
        type: String,
        required: true,
        trim: true,
        match: /^\d{9}$/,
        index: true
    },
    phoneNumber: {
        type: String,
        required: true,
        trim: true,
        match: /^0\d{1,2}-?\d{7}$/
    },
    healthConditions: {
        skinDiseases: {
            type: Boolean,
            default: false
        },
        heartDiseases: {
            type: Boolean,
            default: false
        },
        diabetes: {
            type: Boolean,
            default: false
        },
        bloodPressure: {
            type: Boolean,
            default: false
        },
        spineProblems: {
            type: Boolean,
            default: false
        },
        fracturesOrSprains: {
            type: Boolean,
            default: false
        },
        fluFeverInflammation: {
            type: Boolean,
            default: false
        },
        epilepsy: {
            type: Boolean,
            default: false
        },
        surgeries: {
            type: Boolean,
            default: false,
            details: {
                type: String,
                default: '', 
                maxLength: 500
            }
        },
        chronicMedications: {
            type: Boolean,
            default: false
        },
        pregnancy: {
            type: Boolean,
            default: false
        },
        otherMedicalIssues: {
            type: Boolean,
            default: false,
            details: {
                type: String,
                default: '',
                maxLength: 500
            }
        }
    },
    declarationConfirmed: {
        type: Boolean,
        required: true,
        validate: {
            validator: function (v) {
                return v === true;
            },
            message: 'The statement must be confirmed'
        }
    },
    signature: {
        type: String,
        required: true
    },
    ipAddress: {
        type: String
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

healthDeclarationSchema.index({ createdAt: - 1 });
healthDeclarationSchema.index({ idNumber: 1, createdAt: -1 });

module.exports = mongoose.model('healthDeclaration', healthDeclarationSchema);