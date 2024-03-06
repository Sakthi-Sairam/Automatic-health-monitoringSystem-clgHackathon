const mongoose=require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema =new mongoose.Schema({
    username: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    isAdmin:{
        type:Boolean,
        default:false
    },
});

userSchema.pre("save", async function (next) {
    const user = this;
    // console.log("actual data ", this);
  
    if (!user.isModified) {
      return next();
    }
  
    try {
      const saltRound = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(user.password, saltRound);
      user.password = hashedPassword;
    } catch (error) {
      return console.error(error);
    }
});

userSchema.methods.comparePassword = async function (password) {
    return bcrypt.compare(password, this.password);
};

const User = new mongoose.model("User", userSchema);
module.exports = User;