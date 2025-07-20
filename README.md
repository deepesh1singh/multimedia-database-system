# Enhanced Multimedia Database System

A comprehensive multimedia content management system with advanced features for storing, organizing, and sharing various types of digital content.

## 🚀 New Features in Version 2.0

### 🔐 Enhanced Security
- **JWT Authentication**: Secure token-based authentication
- **Rate Limiting**: Protection against brute force attacks
- **Input Validation**: Comprehensive data validation
- **Helmet Security**: Enhanced HTTP headers security
- **CORS Protection**: Cross-origin resource sharing protection

### 📊 Real-time Analytics Dashboard
- **User Behavior Tracking**: Monitor content views, plays, downloads
- **Performance Metrics**: Track popular content and user engagement
- **Admin Dashboard**: Comprehensive analytics for administrators
- **Session Tracking**: Detailed user session analysis

### 🎵 Playlist Management
- **Create Playlists**: Organize content into custom playlists
- **Public/Private Playlists**: Share or keep playlists private
- **Drag & Drop**: Easy playlist item management
- **Playlist Analytics**: Track playlist performance

### 🔔 Real-time Notifications
- **Socket.IO Integration**: Instant notifications
- **Multiple Types**: Info, success, warning, error notifications
- **Action URLs**: Clickable notifications with actions
- **Notification Center**: Centralized notification management

### 🔍 Advanced Search
- **Multi-content Search**: Search across all content types
- **Type Filtering**: Filter by specific content types
- **Real-time Results**: Instant search results
- **Search Analytics**: Track popular search terms

### 💬 Social Features
- **Comments System**: User comments on content
- **Rating System**: 5-star rating system
- **Nested Comments**: Reply to comments
- **Moderation**: Admin comment approval system

### 📱 Enhanced UI/UX
- **Modern Design**: Bootstrap 5 with custom styling
- **Responsive Layout**: Mobile-friendly interface
- **Dark Mode**: Optional dark theme
- **Loading States**: Smooth loading animations

### 🎨 Content Management
- **Multiple Formats**: Support for images, videos, audio, documents
- **File Optimization**: Automatic image compression
- **Metadata Extraction**: Automatic content metadata
- **Bulk Operations**: Mass content management

## 📋 Supported Content Types

- **Books**: PDFs, e-books, documents
- **Videos**: MP4, AVI, MOV, WMV
- **Music**: MP3, WAV, FLAC
- **Paintings**: Images, digital art
- **Articles**: Text content, blogs
- **Newspapers**: Digital publications
- **Games**: Game files and metadata

## 🛠️ Technology Stack

### Backend
- **Node.js**: Runtime environment
- **Express.js**: Web framework
- **Sequelize**: ORM for database management
- **SQLite**: Lightweight database
- **Socket.IO**: Real-time communication
- **JWT**: Authentication tokens
- **Multer**: File upload handling
- **Sharp**: Image processing
- **Nodemailer**: Email functionality

### Frontend
- **Bootstrap 5**: UI framework
- **Font Awesome**: Icons
- **Socket.IO Client**: Real-time features
- **Vanilla JavaScript**: No heavy frameworks

### Security
- **bcrypt**: Password hashing
- **Helmet**: Security headers
- **CORS**: Cross-origin protection
- **Rate Limiting**: Request throttling
- **Input Validation**: Data sanitization

## 🚀 Installation & Setup

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Installation Steps

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd multimedia-database-system-main
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Database Setup**
   ```bash
   npm run db:setup
   ```

5. **Start the server**
   ```bash
   npm start
   # or for development
   npm run dev
   ```

6. **Access the application**
   ```
   http://localhost:3000
   ```

## 📁 Project Structure

```
multimedia-database-system-main/
├── models/                 # Database models
│   ├── User.js
│   ├── Book.js
│   ├── Video.js
│   ├── Music.js
│   ├── Painting.js
│   ├── Article.js
│   ├── Newspaper.js
│   ├── Playlist.js
│   ├── PlaylistItem.js
│   ├── Notification.js
│   ├── Analytics.js
│   └── Comment.js
├── public/                 # Frontend files
│   ├── index.html
│   ├── dashboard.html
│   ├── login.html
│   ├── register.html
│   └── assets/
├── uploads/               # File uploads
├── server.js             # Main server file
├── server-enhanced.js    # Enhanced server with new features
├── database.js           # Database configuration
└── package.json
```

## 🔧 API Endpoints

### Authentication
- `POST /register` - User registration
- `POST /api/login` - User login
- `POST /api/forgot-password/*` - Password recovery

### Content Management
- `GET /api/search` - Advanced search
- `POST /api/content/:type` - Upload content
- `GET /api/content/:type/:id` - Get content details
- `PUT /api/content/:type/:id` - Update content
- `DELETE /api/content/:type/:id` - Delete content

### Playlists
- `GET /api/playlists` - Get user playlists
- `POST /api/playlists` - Create playlist
- `POST /api/playlists/:id/items` - Add item to playlist
- `DELETE /api/playlists/:id` - Delete playlist

### Social Features
- `GET /api/comments/:type/:id` - Get comments
- `POST /api/comments` - Add comment
- `PUT /api/comments/:id` - Update comment
- `DELETE /api/comments/:id` - Delete comment

### Notifications
- `GET /api/notifications` - Get user notifications
- `PUT /api/notifications/:id/read` - Mark as read
- `DELETE /api/notifications/:id` - Delete notification

### Analytics (Admin)
- `GET /api/analytics/dashboard` - Dashboard data
- `GET /api/analytics/content/:type` - Content analytics
- `GET /api/analytics/users` - User analytics

## 🎯 Key Features

### For Users
- **Personal Dashboard**: Customizable user dashboard
- **Content Discovery**: Advanced search and recommendations
- **Playlist Creation**: Organize favorite content
- **Social Interaction**: Comments and ratings
- **Real-time Updates**: Live notifications and updates

### For Administrators
- **Analytics Dashboard**: Comprehensive usage statistics
- **Content Moderation**: Approve/reject user content
- **User Management**: Manage user accounts and permissions
- **System Monitoring**: Real-time system health monitoring

## 🔒 Security Features

- **JWT Authentication**: Secure token-based sessions
- **Password Hashing**: bcrypt for secure password storage
- **Input Validation**: Comprehensive data validation
- **Rate Limiting**: Protection against abuse
- **File Upload Security**: Secure file handling
- **SQL Injection Protection**: Parameterized queries
- **XSS Protection**: Content sanitization

## 📈 Performance Optimizations

- **Image Compression**: Automatic image optimization
- **Caching**: Redis caching for frequently accessed data
- **CDN Integration**: Content delivery network support
- **Database Indexing**: Optimized database queries
- **Lazy Loading**: Progressive content loading

## 🧪 Testing

```bash
# Run tests
npm test

# Run with coverage
npm run test:coverage

# Run specific tests
npm test -- --grep "search"
```