// server.js
const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const path = require('path');
const http = require('http');
const multer = require('multer');
const { Op } = require('sequelize');
const cors = require('cors');
//const students = []; // 📚 New array to save student profiles

const Student = require('./models/student');
const EventPhoto = require('./models/eventphoto');
const Resource = require('./models/resource');

const sequelize = require('./db');
const User = require('./models/user');
const Blog = require('./models/blog');
const BlogLike = require('./models/bloglike');
const PrivateChat = require('./models/privatechat');

const app = express();
const server = http.createServer(app);
const io = require('socket.io')(server);
const PORT = process.env.PORT || 3000;
const fs = require('fs');
const cloudinary = require('./cloudinaryConfig');


// CORS configuration
app.use(cors({
    origin: process.env.FRONTEND_URL || '*',
    credentials: true
}));

// New arrays for Event and Resources
//const eventPhotos = [];
//const resources = [];

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json()); // Needed for JSON body (resource links)
app.use(session({
  secret: 'secret-key',
  resave: false,
  saveUninitialized: true
}));
app.use(express.static(path.join(__dirname, 'public')));

// Middleware
function requireAuth(req, res, next) {
  if (req.session && req.session.user) next();
  else res.redirect('/');
}

// Routes
app.get('/', (req, res) => {
  if (req.session.user) return res.redirect('/home');
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/register', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'register.html'));
});

app.post('/register', async (req, res) => {
  const { username, email, password } = req.body;
  try {
    const existing = await User.findOne({ where: { username } });
    if (existing) return res.send("Username already exists.");
    const newUser = await User.create({ username, email, password });
    req.session.user = { id: newUser.id, username: newUser.username, email: newUser.email };
    res.redirect('/home');
  } catch (err) {
    console.error(err);
    res.send("Registration error.");
  }
});

app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await User.findOne({ where: { username, password } });
    if (user) {
      req.session.user = { id: user.id, username: user.username, email: user.email };
      res.redirect('/home');
    } else {
      res.send("Invalid credentials.");
    }
  } catch (err) {
    console.error(err);
    res.send("Login error.");
  }
});

app.get('/home', requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'home.html'));
});

app.get('/friend', requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'friend.html'));
});

app.get('/group', requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'group.html'));
});

app.get('/admin', requireAuth, async (req, res) => {
  const adminUser = await User.findOne({ order: [['id', 'ASC']] });
  if (req.session.user.username !== adminUser.username) return res.send("Access denied.");
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/');
});


// Upload student profile
// Save student
app.post('/api/students', async (req, res) => {
  try {
    const { photo, fullName, phone, email, linkedin, role, company } = req.body;
    if (!fullName || !email) {
      return res.status(400).json({ error: 'Full name and Email are required' });
    }
    await Student.create({ photo, fullName, phone, email, linkedin, role, company });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to save student' });
  }
});

// Fetch students
app.get('/api/students', async (req, res) => {
  try {
    const students = await Student.findAll();
    res.json(students);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch students' });
  }
});



// Admin APIs
app.get('/api/users', requireAuth, async (req, res) => {
  const users = await User.findAll();
  res.json(users);
});

app.delete('/api/users/:id', requireAuth, async (req, res) => {
  try {
    await User.destroy({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
// Delete Event Photo
app.delete('/api/events/:id', requireAuth, async (req, res) => {
  try {
    const event = await EventPhoto.findByPk(req.params.id);
    if (event) {
      // Delete the associated media file
      const filePath = path.join(__dirname, 'public', event.url);
      fs.unlink(filePath, (err) => {
        if (err) {
          console.error('Error deleting the file:', err);
        }
      });
      
      // Delete the record from the database
      await EventPhoto.destroy({ where: { id: req.params.id } });
      res.json({ success: true });
    } else {
      res.status(404).json({ error: 'Event not found' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete Resource
app.delete('/api/resources/:id', requireAuth, async (req, res) => {
  try {
    const resource = await Resource.findByPk(req.params.id);
    if (resource) {
      // If the resource is a file, delete the associated media file
      if (resource.type === 'file') {
        const filePath = path.join(__dirname, 'public', resource.data);
        fs.unlink(filePath, (err) => {
          if (err) {
            console.error('Error deleting the file:', err);
          }
        });
      }
      
      // Delete the record from the database
      await Resource.destroy({ where: { id: req.params.id } });
      res.json({ success: true });
    } else {
      res.status(404).json({ error: 'Resource not found' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete Student Profile
app.delete('/api/students/:id', requireAuth, async (req, res) => {
  try {
    const student = await Student.findByPk(req.params.id);
    if (student) {
      // Delete the associated student photo file
      const filePath = path.join(__dirname, 'public', student.photo);
      fs.unlink(filePath, (err) => {
        if (err) {
          console.error('Error deleting the file:', err);
        }
      });
      
      // Delete the record from the database
      await Student.destroy({ where: { id: req.params.id } });
      res.json({ success: true });
    } else {
      res.status(404).json({ error: 'Student not found' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.get('/api/blogs', requireAuth, async (req, res) => {
  const blogs = await Blog.findAll({ order: [['id', 'DESC']] });
  res.json(blogs);
});

app.delete('/api/blogs/:id', requireAuth, async (req, res) => {
  try {
    await Blog.destroy({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => { cb(null, 'public/uploads/'); },
  filename: (req, file, cb) => { cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname)); }
});
const upload = multer({ storage });

// Upload blog image



app.post('/upload', upload.single('blogImage'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: 'blog_images'
    });

    fs.unlinkSync(req.file.path);
    res.json({ url: result.secure_url });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Upload failed' });
  }
});





// Search users
app.get('/search/users', requireAuth, async (req, res) => {
  const q = req.query.q;
  try {
    const results = await User.findAll({ where: { username: { [Op.like]: `%${q}%` } } });
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Event and Resources APIs
app.get('/api/events', async (req, res) => {
  try {
    const photos = await EventPhoto.findAll({ order: [['id', 'DESC']] });
    res.json(photos);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch event photos' });
  }
});


// Save event photo



app.post('/upload-event', upload.single('eventPhoto'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const category = req.body.category || 'all';


  

const result = await cloudinary.uploader.upload(req.file.path, {
  folder: 'event_photos'
});

fs.unlinkSync(req.file.path);
await EventPhoto.create({ url: result.secure_url, category });
res.json({ url: result.secure_url });


  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to save event photo' });
  }
});

// Fetch event photos
app.get('/api/events', async (req, res) => {
  try {
    const photos = await EventPhoto.findAll();
    res.json(photos);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch event photos' });
  }
});


// Upload file resource
app.post('/upload-resource', upload.single('resourceFile'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const { title, type } = req.body;


const result = await cloudinary.uploader.upload(req.file.path, {
  folder: 'resources'
});
await Resource.create({ title, type, data: result.secure_url });
fs.unlinkSync(req.file.path);
res.json({ url: result.secure_url });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to save resource' });
  }
});

// Upload link resource
app.post('/upload-resource-link', async (req, res) => {
  try {
    const { title, link } = req.body;
    if (!link) return res.status(400).json({ error: 'No link provided' });
    await Resource.create({ title, type: 'link', data: link });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to save link resource' });
  }
});

// Fetch resources
app.get('/api/resources', async (req, res) => {
  try {
    const resources = await Resource.findAll();
    res.json(resources);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch resources' });
  }
});


// Socket.IO
const onlineUsers = {};
io.on('connection', (socket) => {
  console.log("Socket connected: " + socket.id);

  socket.on('register user', (data) => {
    onlineUsers[data.username] = socket.id;
  });

  socket.on('disconnect', () => {
    for (const [username, id] of Object.entries(onlineUsers)) {
      if (id === socket.id) {
        delete onlineUsers[username];
        break;
      }
    }
    console.log("Socket disconnected: " + socket.id);
  });

  // Private chat
  socket.on('private message', async (data) => {
    await PrivateChat.create({ sender: data.from, receiver: data.to, message: data.message });
    const targetSocket = onlineUsers[data.to];
    if (targetSocket) io.to(targetSocket).emit('private message', data);
    socket.emit('private message', data);
  });

  // Create blog
  socket.on('create blog', async (data) => {
    const newBlog = await Blog.create({ username: data.username, content: data.content, image: data.image });
    io.emit('new blog', newBlog);
  });

  // Blog like toggle
  socket.on('blog like', async (data) => {
    const existing = await BlogLike.findOne({ where: { blogId: data.blogId, username: data.username } });
    if (existing) {
      await existing.destroy();
    } else {
      await BlogLike.create({ blogId: data.blogId, username: data.username });
    }
    const count = await BlogLike.count({ where: { blogId: data.blogId } });
    const blog = await Blog.findByPk(data.blogId);
    blog.likes = count;
    await blog.save();
    io.emit('blog updated', blog);
  });

  // Other socket events can be added here...
});

// Get private chat history between two users
app.get('/api/privatechats', async (req, res) => {
  const { user1, user2 } = req.query;
  if (!user1 || !user2) return res.status(400).json({ error: 'Missing users' });
  const chats = await PrivateChat.findAll({
    where: {
      [Op.or]: [
        { sender: user1, receiver: user2 },
        { sender: user2, receiver: user1 }
      ]
    },
    order: [['id', 'ASC']]
  });
  res.json(chats);
});

// Start server
sequelize.sync({ force: false })
  .then(() => {
    server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch(err => console.error("DB sync error:", err));
