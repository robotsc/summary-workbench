const mongoose = require("mongoose");
const mongooseValidator = require("mongoose-validator");
const bcrypt = require("bcryptjs");
const {
  createAccessToken,
  createRefreshToken,
  sendAccessToken,
  sendRefreshToken,
} = require("../tokens");
const Visualization = require("./visualization");

const UserSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, "username is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "email is required"],
      unique: true,
      lowercase: true,
      validate: mongooseValidator({
        validator: "isEmail",
        message: "email must be valid E-mail address",
      }),
    },
    password: {
      type: String,
      required: [true, "password is required"],
      minLength: [7, "password has to have at least length 7"],
    },
    visualizations: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Visualization",
      },
    ],
  },
  { versionKey: false }
);

UserSchema.pre("save", function (next) {
  const user = this;
  if (!user.isModified("password")) {
    return next();
  }
  const salt = bcrypt.genSaltSync(10);
  const hashedPassword = bcrypt.hashSync(user.password, salt);
  user.password = hashedPassword;
  next();
});

UserSchema.methods.generateTokens = async function () {
  const user = this;
  const accessToken = createAccessToken(user._id);
  const refreshToken = createRefreshToken(user._id);
  return { accessToken, refreshToken };
};

UserSchema.methods.sendNewTokens = async function (res) {
  const user = this;
  const { accessToken, refreshToken } = await user.generateTokens();
  sendRefreshToken(res, refreshToken);
  return sendAccessToken(res, accessToken);
};

UserSchema.methods.addVisualization = async function (visualizationJson) {
  const user = this;
  const visualization = await Visualization.create(visualizationJson);
  await visualization.save();
  user.visualizations.push(visualization);
  await user.save();
};

UserSchema.methods.getVisualizations = async function () {
  const user = await this.populate("visualizations", ["_id", "name", "length", "models.name", "annotationTemplate"]).execPopulate();
  return user.visualizations.reverse();
};

UserSchema.methods.getVisualization = async function (id) {
  const user = await this.populate({path: "visualizations", match: { _id: id }}).execPopulate();
  const visualizations = user.visualizations;
  if (visualizations && visualizations.length) {
    return visualizations[0];
  }
  throw new Error("visualization not found");
};

UserSchema.methods.deleteVisualization = async function (id) {
  const user = this
  const visualizations = user.visualizations;
  await visualizations.pull(id);
  await user.save()
};

UserSchema.statics.findByCredentials = async function (email, password) {
  const user = await this.findOne({ email });
  if (!user) throw new Error("invalid login credentials");
  const isPasswordMatch = bcrypt.compareSync(password, user.password);
  if (!isPasswordMatch) throw new Error("invalid login credentials");
  return user;
};

UserSchema.statics.createUser = async function ({ username, email, password }) {
  const user = await this.create({ username, email, password });
  await user.save();
  return user;
};

const User = mongoose.model("User", UserSchema);

module.exports = User;
