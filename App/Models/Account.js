// Node Modules
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

// Helpers
const Unique = require('App/Helpers/Unique');
const Pagination = require('App/Helpers/Pagination');

const Schema = mongoose.Schema;

const Account = Schema(
{
    Purchase: [{ type: Schema.Types.ObjectId, ref: 'Course' }],
    Roles: [{ type: Schema.Types.ObjectId, ref: 'Role' }],
    Name: { type: String, required: true },
    Admin: { type: Boolean, default: false },
    Email: { type: String, unique: true, required: true },
    Password: { type: String, required: true },
    Remember: { type: String, default: null }
}, { timestamps: true, toJSON: { virtuals: true } });

Account.plugin(Pagination);

Account.virtual('Courses', { ref: 'Course', localField: '_id', foreignField: 'Account' });

Account.pre('save', function(Next)
{
    this.Password = bcrypt.hashSync(this.Password, bcrypt.genSaltSync(15));
    Next();
});

Account.pre('findOneAndUpdate', function(Next)
{
    this.getUpdate().$set.Password = bcrypt.hashSync(this.getUpdate().$set.Password, bcrypt.genSaltSync(15));
    Next();
});

Account.methods.ComparePassword = function(Password)
{
    return bcrypt.compareSync(Password, this.Password);
};

Account.methods.SetRemember = function(Response)
{
    const Token = Unique.String(30);

    Response.cookie('Remember', Token, { maxAge: 1000 * 60 * 60 * 24 * 30, httpOnly: true, signed: true });

    this.updateOne({ Remember: Token }, Error =>
    {
        if (Error)
            return Logger.Analyze('DBError', Error);
    });
};

Account.methods.IsVip = function()
{
    return true;
};

Account.methods.IsPurchased = function(ID)
{
    return this.Purchase.indexOf(ID) !== -1;
};

Account.methods.HasRole = function(Roles)
{
    let Result = Roles.filter(Role =>
    {
        return this.Roles.indexOf(Role) > -1;
    });

    return !!Result.length;
};

module.exports = mongoose.model('Account', Account);
