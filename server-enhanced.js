const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcrypt');
const { Op } = require('sequelize');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const morgan = require('morgan');
const sharp = require('sharp');
const { v4: uuidv4 } = require('uuid');
const moment = require('moment');
const _ = require('lodash');
const { body, validationResult } = require('express-validator');
const nodemailer = require('nodemailer');

const sequelize = require('./database');
const User = require('./models/User');
const Book = require('./models/Books');
const Video = require('./models/Video');
const Game = require('./models/Game');
const Article = require('./models/Article');
const Newspaper = require('./models/Newspaper');
const Music = require('./models/music');
const Painting = require('./models/Painting');
const Playlist = require('./models/Playlist');
const PlaylistItem = require('./models/PlaylistItem');
const Notification = require('./models/Notification');
const Analytics = require('./models/Analytics');
const Comment = require('./models/Comment');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const port = process.env.PORT || 3000;

sequelize.sync({ alter: true })
    .then(() => console.log('Database and tables created!'))
    .catch(err => console.error('Unable to create tables: ', err));

app.use(helmet());
app.use(cors());
app.use(compression());
app.use(morgan('combined'));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP'
});
app.use('/api/', limiter);

app.use(express.urlencoded({ extended: true }));
app.use(express.json({ limit: '50mb' }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path.join(__dirname, 'uploads');
        if (!fs.existsSync(uploadDir)){
            fs.mkdirSync(uploadDir);
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueName = `${Date.now()}-${uuidv4()}${path.extname(file.originalname)}`;
        cb(null, uniqueName);
    }
});

const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 100 * 1024 * 1024
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif|webp|pdf|mp4|mp3|avi|mov|wmv|doc|docx|txt/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        
        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Invalid file type'));
        }
    }
});

const jwt = require('jsonwebtoken');
const SECRET_KEY = process.env.JWT_SECRET || 'your-secret-key';

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid token' });
        }
        req.user = user;
        next();
    });
};

const trackAnalytics = async (req, res, next) => {
    const originalSend = res.send;
    res.send = function(data) {
        if (req.user && req.path.includes('/api/')) {
            Analytics.create({
                id: uuidv4(),
                user_id: req.user.id,
                content_type: req.path.split('/')[2] || 'api',
                content_id: req.params.id || 'general',
                action: req.method.toLowerCase(),
                session_id: req.sessionID,
                ip_address: req.ip,
                user_agent: req.get('User-Agent'),
                metadata: JSON.stringify({
                    path: req.path,
                    method: req.method,
                    statusCode: res.statusCode
                })
            }).catch(err => console.error('Analytics error:', err));
        }
        originalSend.call(this, data);
    };
    next();
};

app.use(trackAnalytics);

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);
    
    socket.on('join', (userId) => {
        socket.join(`user_${userId}`);
    });
    
    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

const sendNotification = async (userId, title, message, type = 'info', actionUrl = null) => {
    try {
        const notification = await Notification.create({
            id: uuidv4(),
            user_id: userId,
            title,
            message,
            type,
            action_url: actionUrl
        });
        
        io.to(`user_${userId}`).emit('notification', notification);
        return notification;
    } catch (error) {
        console.error('Notification error:', error);
    }
};

app.post('/register', [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
    body('username').isLength({ min: 3 }),
    body('fullName').notEmpty()
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const { fullName, email, username, password, role, securityQuestion, securityAnswer } = req.body;
        
        const existingEmail = await User.findOne({ where: { email } });
        if (existingEmail) {
            return res.status(400).json({ error: 'Email already in use' });
        }
        
        const existingUsername = await User.findOne({ where: { username } });
        if (existingUsername) {
            return res.status(400).json({ error: 'Username already taken' });
        }
        
        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(password, saltRounds);
        
        const newUser = await User.create({
            id: uuidv4(),
            full_name: fullName,
            email: email,
            username: username,
            password_hash: passwordHash,
            role: role || 'client',
            security_question: securityQuestion,
            security_answer: securityAnswer
        });
        
        const token = jwt.sign(
            { 
                id: newUser.id, 
                username: newUser.username, 
                role: newUser.role 
            },
            SECRET_KEY,
            { expiresIn: '24h' }
        );
        
        await sendNotification(newUser.id, 'Welcome!', 'Your account has been created successfully.', 'success');
        
        res.status(201).json({ 
            message: 'User registered successfully',
            token,
            user: {
                id: newUser.id,
                name: newUser.full_name,
                username: newUser.username,
                email: newUser.email,
                role: newUser.role
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Registration failed. Please try again.' });
    }
});

app.post('/api/login', async (req, res) => {
    try {
        const { identifier, password } = req.body;

        const user = await User.findOne({
            where: {
                [Op.or]: [
                    { email: identifier },
                    { username: identifier }
                ]
            }
        });

        if (!user) {
            return res.status(401).json({ success: false, error: 'Invalid credentials' });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password_hash);
        if (!isPasswordValid) {
            return res.status(401).json({ success: false, error: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { 
                id: user.id, 
                username: user.username, 
                role: user.role || 'client'
            },
            SECRET_KEY,
            { expiresIn: '24h' }
        );

        await sendNotification(user.id, 'Login Successful', 'Welcome back!', 'success');

        res.json({
            success: true,
            token,
            user: {
                id: user.id,
                name: user.full_name,
                username: user.username,
                role: user.role || 'client'
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ success: false, error: 'Login failed. Please try again.' });
    }
});

app.get('/api/search', async (req, res) => {
    try {
        const { q, type, limit = 20, offset = 0 } = req.query;
        
        if (!q || q.length < 2) {
            return res.status(400).json({ error: 'Search query must be at least 2 characters' });
        }

        const searchQuery = {
            [Op.or]: [
                { title: { [Op.like]: `%${q}%` } },
                { description: { [Op.like]: `%${q}%` } },
                { author: { [Op.like]: `%${q}%` } },
                { genre: { [Op.like]: `%${q}%` } }
            ]
        };

        let results = [];
        const searchTypes = type ? [type] : ['books', 'videos', 'music', 'paintings', 'articles', 'newspapers'];

        for (const contentType of searchTypes) {
            let model;
            switch (contentType) {
                case 'books':
                    model = Book;
                    break;
                case 'videos':
                    model = Video;
                    break;
                case 'music':
                    model = Music;
                    break;
                case 'paintings':
                    model = Painting;
                    break;
                case 'articles':
                    model = Article;
                    break;
                case 'newspapers':
                    model = Newspaper;
                    break;
                default:
                    continue;
            }

            const items = await model.findAll({
                where: searchQuery,
                limit: parseInt(limit),
                offset: parseInt(offset),
                order: [['createdAt', 'DESC']]
            });

            results.push(...items.map(item => ({
                ...item.toJSON(),
                content_type: contentType
            })));
        }

        res.json({
            success: true,
            results: _.orderBy(results, ['createdAt'], ['desc']).slice(0, limit),
            total: results.length
        });
    } catch (error) {
        console.error('Search error:', error);
        res.status(500).json({ error: 'Search failed' });
    }
});

app.get('/api/playlists', authenticateToken, async (req, res) => {
    try {
        const playlists = await Playlist.findAll({
            where: {
                [Op.or]: [
                    { user_id: req.user.id },
                    { is_public: true }
                ]
            },
            include: [{
                model: PlaylistItem,
                as: 'items',
                include: ['books', 'videos', 'music', 'paintings', 'articles', 'newspapers']
            }],
            order: [['createdAt', 'DESC']]
        });

        res.json({ success: true, playlists });
    } catch (error) {
        console.error('Playlists error:', error);
        res.status(500).json({ error: 'Failed to fetch playlists' });
    }
});

app.post('/api/playlists', authenticateToken, async (req, res) => {
    try {
        const { name, description, is_public = false, cover_image } = req.body;

        const playlist = await Playlist.create({
            id: uuidv4(),
            name,
            description,
            user_id: req.user.id,
            is_public,
            cover_image
        });

        res.status(201).json({ success: true, playlist });
    } catch (error) {
        console.error('Create playlist error:', error);
        res.status(500).json({ error: 'Failed to create playlist' });
    }
});

app.post('/api/playlists/:id/items', authenticateToken, async (req, res) => {
    try {
        const { playlist_id } = req.params;
        const { content_type, content_id } = req.body;

        const playlist = await Playlist.findOne({
            where: { id: playlist_id, user_id: req.user.id }
        });

        if (!playlist) {
            return res.status(404).json({ error: 'Playlist not found' });
        }

        const maxPosition = await PlaylistItem.max('position', {
            where: { playlist_id }
        });

        const playlistItem = await PlaylistItem.create({
            id: uuidv4(),
            playlist_id,
            content_type,
            content_id,
            position: (maxPosition || 0) + 1
        });

        await playlist.update({
            total_items: playlist.total_items + 1
        });

        res.status(201).json({ success: true, playlistItem });
    } catch (error) {
        console.error('Add to playlist error:', error);
        res.status(500).json({ error: 'Failed to add item to playlist' });
    }
});

app.get('/api/notifications', authenticateToken, async (req, res) => {
    try {
        const notifications = await Notification.findAll({
            where: { user_id: req.user.id },
            order: [['createdAt', 'DESC']],
            limit: 50
        });

        res.json({ success: true, notifications });
    } catch (error) {
        console.error('Notifications error:', error);
        res.status(500).json({ error: 'Failed to fetch notifications' });
    }
});

app.put('/api/notifications/:id/read', authenticateToken, async (req, res) => {
    try {
        const notification = await Notification.findOne({
            where: { id: req.params.id, user_id: req.user.id }
        });

        if (!notification) {
            return res.status(404).json({ error: 'Notification not found' });
        }

        await notification.update({ is_read: true });
        res.json({ success: true });
    } catch (error) {
        console.error('Mark notification read error:', error);
        res.status(500).json({ error: 'Failed to mark notification as read' });
    }
});

app.post('/api/comments', authenticateToken, async (req, res) => {
    try {
        const { content_type, content_id, text, rating, parent_id } = req.body;

        const comment = await Comment.create({
            id: uuidv4(),
            user_id: req.user.id,
            content_type,
            content_id,
            text,
            rating,
            parent_id
        });

        res.status(201).json({ success: true, comment });
    } catch (error) {
        console.error('Create comment error:', error);
        res.status(500).json({ error: 'Failed to create comment' });
    }
});

app.get('/api/comments/:content_type/:content_id', async (req, res) => {
    try {
        const { content_type, content_id } = req.params;

        const comments = await Comment.findAll({
            where: { content_type, content_id },
            include: [{
                model: User,
                as: 'user',
                attributes: ['id', 'username', 'full_name']
            }],
            order: [['createdAt', 'DESC']]
        });

        res.json({ success: true, comments });
    } catch (error) {
        console.error('Comments error:', error);
        res.status(500).json({ error: 'Failed to fetch comments' });
    }
});

app.get('/api/analytics/dashboard', authenticateToken, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Admin access required' });
        }

        const totalUsers = await User.count();
        const totalContent = await Promise.all([
            Book.count(),
            Video.count(),
            Music.count(),
            Painting.count(),
            Article.count(),
            Newspaper.count()
        ]);

        const recentActivity = await Analytics.findAll({
            include: [{
                model: User,
                as: 'user',
                attributes: ['username']
            }],
            order: [['createdAt', 'DESC']],
            limit: 20
        });

        const topContent = await Analytics.findAll({
            attributes: [
                'content_type',
                'content_id',
                [sequelize.fn('COUNT', sequelize.col('id')), 'views']
            ],
            group: ['content_type', 'content_id'],
            order: [[sequelize.fn('COUNT', sequelize.col('id')), 'DESC']],
            limit: 10
        });

        res.json({
            success: true,
            dashboard: {
                totalUsers,
                totalContent: totalContent.reduce((a, b) => a + b, 0),
                contentBreakdown: {
                    books: totalContent[0],
                    videos: totalContent[1],
                    music: totalContent[2],
                    paintings: totalContent[3],
                    articles: totalContent[4],
                    newspapers: totalContent[5]
                },
                recentActivity,
                topContent
            }
        });
    } catch (error) {
        console.error('Dashboard error:', error);
        res.status(500).json({ error: 'Failed to fetch dashboard data' });
    }
});

const generateContentPage = (contentType, data) => {
    const template = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${data.title || 'Content Details'}</title>
        <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css" rel="stylesheet">
        <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
        <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
            .content-header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; }
            .content-body { background: #f8f9fa; }
            .media-player { background: #000; border-radius: 10px; }
            .comment-section { background: white; border-radius: 10px; }
        </style>
    </head>
    <body>
        <nav class="navbar navbar-expand-lg navbar-dark bg-dark">
            <div class="container">
                <a class="navbar-brand" href="/">Multimedia Store</a>
                <div class="navbar-nav ms-auto">
                    <a class="nav-link" href="/">Home</a>
                    <a class="nav-link" href="/login.html">Login</a>
                </div>
            </div>
        </nav>

        <div class="content-header py-5">
            <div class="container">
                <h1 class="display-4">${data.title || 'Content Title'}</h1>
                <p class="lead">${data.description || 'Content description'}</p>
            </div>
        </div>

        <div class="content-body py-5">
            <div class="container">
                <div class="row">
                    <div class="col-lg-8">
                        <div class="card mb-4">
                            <div class="card-body">
                                ${contentType === 'video' ? `
                                    <div class="media-player p-3">
                                        <video controls class="w-100" style="max-height: 400px;">
                                            <source src="/uploads/${data.file_path}" type="video/mp4">
                                            Your browser does not support the video tag.
                                        </video>
                                    </div>
                                ` : contentType === 'music' ? `
                                    <div class="media-player p-3 text-center">
                                        <audio controls class="w-100">
                                            <source src="/uploads/${data.file_path}" type="audio/mpeg">
                                            Your browser does not support the audio tag.
                                        </audio>
                                    </div>
                                ` : `
                                    <img src="/uploads/${data.image_path}" class="img-fluid rounded" alt="${data.title}">
                                `}
                                
                                <div class="mt-4">
                                    <h3>Details</h3>
                                    <p><strong>Author:</strong> ${data.author || 'Unknown'}</p>
                                    <p><strong>Genre:</strong> ${data.genre || 'Not specified'}</p>
                                    <p><strong>Added:</strong> ${new Date(data.createdAt).toLocaleDateString()}</p>
                                </div>
                            </div>
                        </div>

                        <div class="comment-section p-4">
                            <h4>Comments</h4>
                            <div id="comments-container">
                                <p class="text-muted">Loading comments...</p>
                            </div>
                            
                            <div class="mt-4">
                                <h5>Add Comment</h5>
                                <form id="comment-form">
                                    <div class="mb-3">
                                        <textarea class="form-control" id="comment-text" rows="3" placeholder="Write your comment..."></textarea>
                                    </div>
                                    <div class="mb-3">
                                        <label class="form-label">Rating (optional)</label>
                                        <select class="form-select" id="comment-rating">
                                            <option value="">No rating</option>
                                            <option value="5">5 stars</option>
                                            <option value="4">4 stars</option>
                                            <option value="3">3 stars</option>
                                            <option value="2">2 stars</option>
                                            <option value="1">1 star</option>
                                        </select>
                                    </div>
                                    <button type="submit" class="btn btn-primary">Post Comment</button>
                                </form>
                            </div>
                        </div>
                    </div>

                    <div class="col-lg-4">
                        <div class="card">
                            <div class="card-header">
                                <h5>Related Content</h5>
                            </div>
                            <div class="card-body">
                                <p class="text-muted">More content coming soon...</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/js/bootstrap.bundle.min.js"></script>
        <script>
            const contentId = '${data.id}';
            const contentType = '${contentType}';
            
            async function loadComments() {
                try {
                    const response = await fetch(\`/api/comments/\${contentType}/\${contentId}\`);
                    const data = await response.json();
                    
                    if (data.success) {
                        const container = document.getElementById('comments-container');
                        if (data.comments.length === 0) {
                            container.innerHTML = '<p class="text-muted">No comments yet. Be the first to comment!</p>';
                        } else {
                            container.innerHTML = data.comments.map(comment => \`
                                <div class="border-bottom pb-3 mb-3">
                                    <div class="d-flex justify-content-between">
                                        <strong>\${comment.user?.username || 'Anonymous'}</strong>
                                        <small class="text-muted">\${new Date(comment.createdAt).toLocaleDateString()}</small>
                                    </div>
                                    <p class="mb-1">\${comment.text}</p>
                                    \${comment.rating ? \`<div class="text-warning">\${'★'.repeat(comment.rating)}\${'☆'.repeat(5-comment.rating)}</div>\` : ''}
                                </div>
                            \`).join('');
                        }
                    }
                } catch (error) {
                    console.error('Error loading comments:', error);
                }
            }
            
            document.getElementById('comment-form').addEventListener('submit', async (e) => {
                e.preventDefault();
                
                const text = document.getElementById('comment-text').value;
                const rating = document.getElementById('comment-rating').value;
                
                if (!text.trim()) {
                    alert('Please enter a comment');
                    return;
                }
                
                try {
                    const response = await fetch('/api/comments', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': \`Bearer \${localStorage.getItem('token')}\`
                        },
                        body: JSON.stringify({
                            content_type: contentType,
                            content_id: contentId,
                            text,
                            rating: rating ? parseInt(rating) : null
                        })
                    });
                    
                    if (response.ok) {
                        document.getElementById('comment-text').value = '';
                        document.getElementById('comment-rating').value = '';
                        loadComments();
                    } else {
                        alert('Failed to post comment. Please login first.');
                    }
                } catch (error) {
                    console.error('Error posting comment:', error);
                    alert('Failed to post comment');
                }
            });
            
            loadComments();
        </script>
    </body>
    </html>
    `;
    
    return template;
};

app.get('/content/:type/:id', async (req, res) => {
    try {
        const { type, id } = req.params;
        let model;
        
        switch (type) {
            case 'book':
                model = Book;
                break;
            case 'video':
                model = Video;
                break;
            case 'music':
                model = Music;
                break;
            case 'painting':
                model = Painting;
                break;
            case 'article':
                model = Article;
                break;
            case 'newspaper':
                model = Newspaper;
                break;
            default:
                return res.status(404).json({ error: 'Content type not found' });
        }
        
        const content = await model.findByPk(id);
        if (!content) {
            return res.status(404).json({ error: 'Content not found' });
        }
        
        const html = generateContentPage(type, content.toJSON());
        res.send(html);
    } catch (error) {
        console.error('Content page error:', error);
        res.status(500).json({ error: 'Failed to generate content page' });
    }
});

server.listen(port, () => {
    console.log(`Enhanced Multimedia Store server running on port ${port}`);
    console.log('Features enabled:');
    console.log('- Real-time notifications');
    console.log('- Advanced search functionality');
    console.log('- Playlist management');
    console.log('- User comments and ratings');
    console.log('- Analytics dashboard');
    console.log('- Enhanced security');
    console.log('- File upload optimization');
}); 