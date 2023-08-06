require("dotenv").config();
const express = require("express");
const cors = require("cors");
const app = express();
const axios = require("axios");
const mongoose = require("mongoose");
const SHA256 = require("crypto-js/sha256");
const base64 = require("crypto-js/enc-base64");
const uid2 = require("uid2");

app.use(express.json());
app.use(cors());
mongoose.connect(process.env.MONGODB_IP);
const myApi = process.env.MARVEL_APIKEY;
app.get("/characters", async (req, res) => {
  try {
    const { page, name } = req.query;
    let filters = "";
    if (page) {
      const skip = (page - 1) * 100;
      filters += `&skip=${skip}`;
    }

    if (name) {
      filters += `&name=${name}`;
    }

    const response = await axios.get(
      `https://lereacteur-marvel-api.herokuapp.com/characters?apiKey=${myApi}${filters}`
    );
    return res.status(200).json(response.data);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
});

app.get("/comics", async (req, res) => {
  try {
    const { page, title } = req.query;
    let filters = "";

    if (page) {
      const skip = (page - 1) * 100;
      filters += `&skip=${skip}`;
    }

    if (title) {
      filters += `&title=${title}`;
    }

    const response = await axios.get(
      ` https://lereacteur-marvel-api.herokuapp.com/comics?apiKey=${myApi}${filters}`
    );

    return res.status(200).json(response.data);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
});

app.get("/comics/:characterId", async (req, res) => {
  try {
    const response = await axios.get(
      ` https://lereacteur-marvel-api.herokuapp.com/comics/${req.params.characterId}?apiKey=${myApi}`
    );

    return res.status(200).json(response.data);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
});
//------------------------Mongose requestes-----------------------------//
const isAuthenticated = require("./middlewares/isAuthenticated");
const User = require("./Models/User");

const Favorite = require("./Models/Favorite");

app.post("/signup", async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (username && email && password) {
      const isUserExist = await User.findOne({ email });
      if (!isUserExist) {
        const salt = uid2(12);
        const token = uid2(16);
        const hash = SHA256(password + salt).toString(base64);
        const newUser = new User({
          email,
          username,
          token,
          hash,
          salt,
        });
        await newUser.save();

        return res.status(200).json({ _id: newUser._id, token: newUser.token });
      } else {
        return res.status(409).json({ message: "This email is alredy exists" });
      }
    } else {
      return res.status(400).json({ message: "Missing parameters" });
    }
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
});

app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const userFound = await User.findOne({ email: email });
    console.log(userFound);

    if (userFound) {
      const newHash = SHA256(password + userFound.salt).toString(base64);

      if (userFound.hash === newHash) {
        return res.status(200).json({
          _id: userFound._id,
          token: userFound.token,
          username: userFound.username,
        });
      } else {
        return res.status(400).json({ message: "email or password incorrect" });
      }
    } else {
      return res.status(400).json({ message: "email or password incorrect" });
    }
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
});

app.post("/favorite/add", isAuthenticated, async (req, res) => {
  try {
    const { id, name, description, path } = req.body;

    const isFavoriteExist = await Favorite.findOne({
      favId: id,
      favOf: req.user._id,
    });
    if (!isFavoriteExist) {
      const newFavorite = new Favorite({
        favId: id,
        favName: name,
        favDescription: description,
        favPath: path,
        favOf: req.user,
      });

      await newFavorite.save();
      return res.status(201).json(newFavorite);
    } else {
      return res
        .status(409)
        .json({ message: "Favorite with the same name already exist" });
    }
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
});

app.get("/favorites", async (req, res) => {
  try {
    const { id } = req.query;
    console.log(req.query);

    const UserFavorites = await Favorite.find({ favOf: id });

    return res.status(201).json(UserFavorites);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
});

// **Delete**
app.delete("/favorite/delete", isAuthenticated, async (req, res) => {
  try {
    const { userId, id } = req.body;
    if (userId && id) {
      // si l'id a bien été transmis

      // On recherche le "student" à modifier à partir de son id et on le supprime :
      await Favorite.findOneAndDelete({ favId: id, favOf: req.user._id });

      // On répond au client :
      res.json({ message: "Favorite removed" });
    } else {
      // si aucun id n'a été transmis :
      res.status(400).json({ messsage: "Missing id" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.all("*", (req, res) => {
  try {
    return res.status(404).json("Not found");
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
});

const PORT = process.env.PORT;
app.listen(PORT, () => {
  console.log("Server is running on port: " + PORT);
});
