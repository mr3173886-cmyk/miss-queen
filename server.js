const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.set('view engine', 'ejs');
app.use(session({
  secret: 'missqueenkey',
  resave: false,
  saveUninitialized: true
}));

const dbUri = "mongodb+srv://kingls0x889_db_user:7pntvFFsOIaUJzXz@cluster0.kl6yaql.mongodb.net/MyApiDb?retryWrites=true&w=majority";

mongoose.connect(dbUri)
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.log(err));

// User Schema
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, default: 'user' },
  active: { type: Boolean, default: true }
});

const User = mongoose.model('User', userSchema);

// Script Schema
const scriptSchema = new mongoose.Schema({
  name: { type: String, required: true },
  code: { type: String, required: true }
});

const Script = mongoose.model('Script', scriptSchema);

// Auto Create Main Admin
async function createAdmin() {
  const adminUsername = "𝔐𝔯.𝔎𝔦𝔫𝔤";
  const adminPassword = "monikaomydarling123@#009Error processing your request";
  const adminExists = await User.findOne({ username: adminUsername });
  if (!adminExists) {
    await User.create({
      username: adminUsername,
      password: adminPassword,
      role: 'admin',
      active: true
    });
    console.log('Default Admin Account Registered Successfully');
  }
}
createAdmin();

// Middleware for auth
function checkAuth(req, res, next) {
  if (req.session.user) {
    next();
  } else {
    res.redirect('/login');
  }
}

// Middleware for admin
function checkAdmin(req, res, next) {
  if (req.session.user && req.session.user.role === 'admin') {
    next();
  } else {
    res.status(403).send('Access Denied');
  }
}

// Routes
app.get('/', (req, res) => {
  res.redirect('/dashboard');
});

app.get('/login', (req, res) => {
  res.render('login', { error: null });
});

app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username, password });
  if (user) {
    if (!user.active) {
      return res.render('login', { error: 'Your account is deactivated/banned!' });
    }
    req.session.user = user;
    res.redirect('/dashboard');
  } else {
    res.render('login', { error: 'Invalid username or password' });
  }
});

app.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/login');
});

app.get('/dashboard', checkAuth, async (req, res) => {
  const scripts = await Script.find({});
  res.render('dashboard', { user: req.session.user, scripts });
});

app.get('/admin', checkAuth, checkAdmin, async (req, res) => {
  const users = await User.find({ role: 'user' });
  const scripts = await Script.find({});
  res.render('admin', { users, scripts });
});

app.post('/admin/user/add', checkAuth, checkAdmin, async (req, res) => {
  const { username, password } = req.body;
  try {
    await User.create({ username, password, role: 'user', active: true });
    res.redirect('/admin');
  } catch (err) {
    res.send('Error: ' + err.message);
  }
});

app.post('/admin/user/toggle/:id', checkAuth, checkAdmin, async (req, res) => {
  const user = await User.findById(req.params.id);
  if (user) {
    user.active = !user.active;
    await user.save();
  }
  res.redirect('/admin');
});

app.post('/admin/user/delete/:id', checkAuth, checkAdmin, async (req, res) => {
  await User.findByIdAndDelete(req.params.id);
  res.redirect('/admin');
});

app.post('/admin/script/add', checkAuth, checkAdmin, async (req, res) => {
  const { name, code } = req.body;
  await Script.create({ name, code });
  res.redirect('/admin');
});

app.post('/admin/script/delete/:id', checkAuth, checkAdmin, async (req, res) => {
  await Script.findByIdAndDelete(req.params.id);
  res.redirect('/admin');
});

// Route to execute uploaded anime script backend logic dynamically
app.get('/run-anime-api', async (req, res) => {
  const axios = require('axios');
  
  const tags = [
    "anime hindi song edit", "anime hindi lo-fi edit", "hindi sad anime edit",
    "anime aesthetic hindi song", "naruto hindi song edit", "anime attitude edit",
    "anime amv edit 4k", "hinata hyuga edit 4k", "anime attitude edit 4k",
    "anime sigma male edit", "badass anime moments edit", "anime cold moments edit",
    "anime villain attitude edit", "anime phonk edit badass", "anime savage moments",
    "anime walk attitude edit", "anime death stare edit", "anime dark aesthetic edit",
    "madara uchiha attitude edit", "gojo satoru badass edit", "eren yeager freedom edit",
    "itachi uchiha cold edit", "sukuna ryoamen attitude", "levi ackerman badass edit",
    "daiki aomine attitude", "ken kaneki centipede edit", "light yagami god complex edit",
    "mikey tokyo revengers edit", "johan liebert cold edit", "rimuru tempest badass mode",
    "Goku aura", "smoker", "anime typography attitude edit", "anime amv transformation edit",
    "anime egoist edit blue lock", "anime ruthless moments edit", "anime 4k 60fps attitude"
  ];

  try {
    const mul = (num, multiplier) => num / (1 / multiplier);
    const randomIndex = Math.floor(mul(Math.random(), tags.length));
    const randomTag = tags[randomIndex];

    const tikUrl = "https://www.tikwm.com/api/feed/search?keywords=" + encodeURIComponent(randomTag);
    const apiRes = await axios.get(tikUrl);
    const videos = apiRes.data?.data?.videos;

    if (!videos || videos.length === 0) {
      return res.json({ error: "No videos found" });
    }

    const randomVidIndex = Math.floor(mul(Math.random(), videos.length));
    const selectedVideo = videos[randomVidIndex];
    const finalUrl = selectedVideo.play || selectedVideo.hdplay;

    res.json({ videoUrl: finalUrl });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "API error" });
  }
});

app.listen(PORT, () => {
  console.log('Server is running on port: ' + PORT);
});
  
