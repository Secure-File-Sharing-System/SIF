import express from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import mongoose from 'mongoose';
import cron from 'node-cron';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import geoip from 'geoip-lite';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 4000;
const UPLOADS_DIR = path.join(__dirname, 'uploads');

if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR);

app.use(cors());
app.use(express.json());
app.use('/files', express.static(UPLOADS_DIR));

// Enhanced IP tracking middleware
app.use((req, res, next) => {
  const ip = req.ip || req.connection.remoteAddress || req.socket.remoteAddress;
  const geo = geoip.lookup(ip);
  req.userLocation = {
    ip,
    country: geo?.country || 'Unknown',
    region: geo?.region || 'Unknown',
    city: geo?.city || 'Unknown'
  };
  next();
});

// MongoDB connection
const MONGO_URI = 'mongodb+srv://chandratresaakshat:chandratresaakshat@cluster9.m4se8gg.mongodb.net/shareit?retryWrites=true&w=majority&appName=Cluster9';

mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => {
  console.log('Connected to MongoDB');
})
.catch((error) => {
  console.error('MongoDB connection error:', error);
});

// Add your remaining application code here (schemas, routes, etc.)

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// File schema with analytics support
const fileSchema = new mongoose.Schema({
  name: String,
  size: Number,
  path: String,
  createdAt: { type: Date, default: Date.now },
  expiresIn: { type: String, default: '24h' },
  expiresAt: Date,
  passwordProtected: { type: Boolean, default: false },
  passwordHash: String,
  downloads: { type: Number, default: 0 },
  maxDownloads: { type: Number, default: 50 },
  status: { type: String, default: 'active', enum: ['active', 'expired', 'disabled'] },
  fileType: String,
  uploadedBy: String,
  isPublic: { type: Boolean, default: true },
  downloadHistory: [{
    downloadedAt: { type: Date, default: Date.now },
    ip: String,
    country: String,
    userAgent: String
  }],
  shareStats: {
    totalViews: { type: Number, default: 0 },
    uniqueVisitors: { type: Number, default: 0 },
    peakDownloads: { type: Number, default: 0 }
  }
});

const analyticsSchema = new mongoose.Schema({
  date: { type: Date, default: Date.now },
  totalDownloads: { type: Number, default: 0 },
  filesShared: { type: Number, default: 0 },
  uniqueVisitors: { type: Number, default: 0 },
  avgDownloadsPerFile: { type: Number, default: 0 },
  fileTypes: [{ type: String, count: Number, percentage: Number }],
  topCountries: [{ country: String, downloads: Number, percentage: Number }],
  trafficPattern: [{ hour: Number, downloads: Number, uploads: Number }]
});

const userSettingsSchema = new mongoose.Schema({
  userId: { type: String, default: 'default' },
  profile: {
    fullName: String,
    email: String,
    bio: String
  },
  security: {
    twoFactorEnabled: { type: Boolean, default: false },
    autoDeleteExpired: { type: Boolean, default: true },
    defaultLinkExpiry: { type: String, default: '24h' }
  },
  notifications: {
    emailNotifications: { type: Boolean, default: true },
    pushNotifications: { type: Boolean, default: false }
  },
  preferences: {
    theme: { type: String, default: 'dark' },
    language: { type: String, default: 'en' },
    timezone: { type: String, default: 'UTC' }
  }
});

const File = mongoose.model('File', fileSchema);
const Analytics = mongoose.model('Analytics', analyticsSchema);
const UserSettings = mongoose.model('UserSettings', userSettingsSchema);

// Multer configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 },
  fileFilter: (req, file, cb) => cb(null, true)
});

// Helpers
const calculateExpirationDate = (expiresIn) => {
  const now = new Date();
  const timeUnits = {
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
    w: 7 * 24 * 60 * 60 * 1000,
    m: 30 * 24 * 60 * 60 * 1000,
  };

  const match = expiresIn.match(/(\d+)([hdwm])/);
  if (!match) return new Date(now.getTime() + 24 * 60 * 60 * 1000);

  const [, amount, unit] = match;
  return new Date(now.getTime() + parseInt(amount) * timeUnits[unit]);
};

const getFileType = (filename) => {
  const ext = path.extname(filename).toLowerCase();
  const typeMap = {
    '.pdf': 'PDF', '.doc': 'Document', '.docx': 'Document', '.txt': 'Text',
    '.jpg': 'Image', '.jpeg': 'Image', '.png': 'Image', '.gif': 'Image',
    '.mp4': 'Video', '.avi': 'Video', '.mkv': 'Video',
    '.mp3': 'Audio', '.wav': 'Audio',
    '.zip': 'Archive', '.rar': 'Archive', '.7z': 'Archive',
    '.js': 'Code', '.html': 'Code', '.css': 'Code', '.py': 'Code'
  };
  return typeMap[ext] || 'Other';
};

async function updateAnalytics(action) {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let analytics = await Analytics.findOne({ date: today });
    if (!analytics) analytics = new Analytics({ date: today });
    
    if (action === 'upload') analytics.filesShared++;
    else if (action === 'download') analytics.totalDownloads++;
    
    await analytics.save();
  } catch (error) {
    console.error('Analytics update failed:', error);
  }
}

function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

// === Upload Endpoint ===
app.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, error: 'No file uploaded' });

    const { expiresIn = '24h', password, isPublic = true } = req.body;
    let passwordHash = null;
    const passwordProtected = !!password;

    if (passwordProtected) {
      const salt = await bcrypt.genSalt(10);
      passwordHash = await bcrypt.hash(password, salt);
    }

    const fileType = getFileType(req.file.originalname);
    const expiresAt = calculateExpirationDate(expiresIn);

    const file = new File({
      name: req.file.originalname,
      size: req.file.size,
      path: req.file.filename,
      expiresIn,
      expiresAt,
      passwordProtected,
      passwordHash,
      fileType,
      isPublic: isPublic === 'true' || isPublic === true,
      uploadedBy: req.userLocation.ip || 'unknown'
    });

    await file.save();

    // Update analytics asynchronously
    updateAnalytics('upload').catch(console.error);

    return res.status(200).json({
      success: true,
      message: "File uploaded successfully",
      fileId: file._id,
      id: file._id,
      name: file.name,
      size: file.size,
      expiresAt: expiresAt.toISOString(),
      shareLink: `${req.protocol}://${req.get('host')}/share/${file._id}`,
      downloadLink: `${req.protocol}://${req.get('host')}/files/${file._id}/download`
    });

  } catch (error) {
    console.error('Upload error:', error);
    return res.status(500).json({ success: false, error: 'Upload failed: ' + error.message });
  }
});

// === Share Page Endpoint ===
app.get('/share/:id', async (req, res) => {
  try {
    const file = await File.findById(req.params.id);
    
    if (!file) {
      return res.status(404).send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>File Not Found</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              background: linear-gradient(135deg, #1f2937 0%, #111827 100%);
              color: white;
              margin: 0;
              padding: 20px;
              min-height: 100vh;
              display: flex;
              align-items: center;
              justify-content: center;
            }
            .container {
              text-align: center;
              max-width: 500px;
              padding: 40px;
              background: rgba(31, 41, 55, 0.8);
              border-radius: 20px;
              border: 1px solid #374151;
            }
            h1 { color: #ef4444; margin-bottom: 20px; }
            p { color: #d1d5db; margin-bottom: 30px; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>File Not Found</h1>
            <p>The file you're looking for doesn't exist or has been removed.</p>
          </div>
        </body>
        </html>
      `);
    }

    if (file.expiresAt && new Date() > file.expiresAt) {
      file.status = 'expired';
      await file.save();
      return res.status(403).send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>File Expired</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              background: linear-gradient(135deg, #1f2937 0%, #111827 100%);
              color: white;
              margin: 0;
              padding: 20px;
              min-height: 100vh;
              display: flex;
              align-items: center;
              justify-content: center;
            }
            .container {
              text-align: center;
              max-width: 500px;
              padding: 40px;
              background: rgba(31, 41, 55, 0.8);
              border-radius: 20px;
              border: 1px solid #374151;
            }
            h1 { color: #f59e0b; margin-bottom: 20px; }
            p { color: #d1d5db; margin-bottom: 30px; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>File Expired</h1>
            <p>This file has expired and is no longer available for download.</p>
          </div>
        </body>
        </html>
      `);
    }

    // Increment view count
    file.shareStats.totalViews++;
    await file.save();

    const downloadPage = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Download ${file.name}</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
            background: linear-gradient(135deg, #1f2937 0%, #111827 50%, #065f46 100%);
            color: white;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
          }
          
          .container {
            background: rgba(31, 41, 55, 0.95);
            backdrop-filter: blur(10px);
            border-radius: 24px;
            padding: 40px;
            max-width: 500px;
            width: 100%;
            border: 1px solid #374151;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
          }
          
          .header {
            text-align: center;
            margin-bottom: 30px;
          }
          
          .icon {
            width: 80px;
            height: 80px;
            background: linear-gradient(135deg, #10b981, #065f46);
            border-radius: 20px;
            margin: 0 auto 20px;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          
          h1 {
            font-size: 28px;
            font-weight: 700;
            margin-bottom: 10px;
            background: linear-gradient(135deg, #10b981, #34d399);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
          }
          
          .subtitle {
            color: #9ca3af;
            font-size: 16px;
          }
          
          .file-info {
            background: #374151;
            border-radius: 16px;
            padding: 24px;
            margin: 24px 0;
          }
          
          .file-name {
            font-size: 18px;
            font-weight: 600;
            margin-bottom: 8px;
            word-break: break-all;
          }
          
          .file-details {
            display: flex;
            justify-content: space-between;
            align-items: center;
            color: #9ca3af;
            font-size: 14px;
            margin-bottom: 16px;
          }
          
          .password-section {
            margin: 20px 0;
            ${!file.passwordProtected ? 'display: none;' : ''}
          }
          
          .password-input {
            width: 100%;
            padding: 12px 16px;
            background: #4b5563;
            border: 2px solid #6b7280;
            border-radius: 12px;
            color: white;
            font-size: 16px;
            margin-bottom: 16px;
            transition: all 0.3s ease;
          }
          
          .password-input:focus {
            outline: none;
            border-color: #10b981;
            box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
          }
          
          .download-btn {
            width: 100%;
            background: linear-gradient(135deg, #10b981, #059669);
            color: white;
            border: none;
            padding: 16px;
            border-radius: 12px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
          }
          
          .download-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(16, 185, 129, 0.4);
          }
          
          .download-btn:disabled {
            background: #6b7280;
            cursor: not-allowed;
            transform: none;
            box-shadow: none;
          }
          
          .error-message {
            background: rgba(239, 68, 68, 0.1);
            border: 1px solid #ef4444;
            color: #fca5a5;
            padding: 12px 16px;
            border-radius: 8px;
            margin: 16px 0;
            display: none;
          }
          
          .success-message {
            background: rgba(16, 185, 129, 0.1);
            border: 1px solid #10b981;
            color: #6ee7b7;
            padding: 12px 16px;
            border-radius: 8px;
            margin: 16px 0;
            display: none;
          }
          
          .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #374151;
            color: #6b7280;
            font-size: 14px;
          }
          
          @media (max-width: 480px) {
            .container {
              padding: 24px;
              margin: 10px;
            }
            
            h1 {
              font-size: 24px;
            }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="icon">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7,10 12,15 17,10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
            </div>
            <h1>Download File</h1>
            <p class="subtitle">Click below to download your file</p>
          </div>
          
          <div class="file-info">
            <div class="file-name">${file.name}</div>
            <div class="file-details">
              <span>${formatBytes(file.size)}</span>
              <span>${file.downloads} downloads</span>
            </div>
            ${file.passwordProtected ? '<div style="color: #fbbf24; font-size: 14px;">🔒 Password protected</div>' : ''}
          </div>
          
          <div class="password-section">
            <input
              type="password"
              id="passwordInput"
              class="password-input"
              placeholder="Enter password to download"
            />
          </div>
          
          <button class="download-btn" onclick="downloadFile()">
            Download ${file.name}
          </button>
          
          <div id="errorMessage" class="error-message"></div>
          <div id="successMessage" class="success-message"></div>
          
          <div class="footer">
            <p>This link will expire on ${new Date(file.expiresAt).toLocaleDateString()}</p>
          </div>
        </div>
        
        <script>
          async function downloadFile() {
            const button = document.querySelector('.download-btn');
            const errorDiv = document.getElementById('errorMessage');
            const successDiv = document.getElementById('successMessage');
            const passwordInput = document.getElementById('passwordInput');
            
            button.disabled = true;
            button.textContent = 'Downloading...';
            errorDiv.style.display = 'none';
            successDiv.style.display = 'none';
            
            try {
              const password = passwordInput ? passwordInput.value : '';
              
              const response = await fetch('/files/${file._id}/download', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ password })
              });
              
              if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.style.display = 'none';
                a.href = url;
                a.download = '${file.name}';
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
                
                successDiv.textContent = 'Download started successfully!';
                successDiv.style.display = 'block';
              } else {
                const error = await response.json();
                throw new Error(error.error || 'Download failed');
              }
            } catch (error) {
              errorDiv.textContent = error.message;
              errorDiv.style.display = 'block';
            } finally {
              button.disabled = false;
              button.textContent = 'Download ${file.name}';
            }
          }
          
          // Allow Enter key to trigger download
          document.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
              downloadFile();
            }
          });
        </script>
      </body>
      </html>
    `;

    res.send(downloadPage);

  } catch (error) {
    console.error('Share page error:', error);
    res.status(500).send('Internal server error');
  }
});

// === Download Endpoint ===
app.post('/files/:id/download', async (req, res) => {
  try {
    const { password } = req.body;
    const file = await File.findById(req.params.id);

    if (!file) return res.status(404).json({ error: 'File not found' });

    if (file.expiresAt && new Date() > file.expiresAt) {
      file.status = 'expired';
      await file.save();
      return res.status(403).json({ error: 'File has expired' });
    }

    if (file.status !== 'active') return res.status(403).json({ error: 'File expired or inactive' });

    if (file.downloads >= file.maxDownloads) {
      file.status = 'expired';
      await file.save();
      return res.status(403).json({ error: 'Download limit reached' });
    }

    if (file.passwordProtected) {
      if (!password || !(await bcrypt.compare(password, file.passwordHash))) {
        return res.status(401).json({ error: 'Invalid password' });
      }
    }

    const userAgent = req.headers['user-agent'] || 'unknown';
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';

    file.downloads++;
    file.downloadHistory.push({
      downloadedAt: new Date(),
      ip,
      country: req.userLocation.country,
      userAgent
    });

    file.shareStats.totalViews++;
    if (file.downloads > file.shareStats.peakDownloads) file.shareStats.peakDownloads = file.downloads;

    await file.save();
    await updateAnalytics('download').catch(console.error);

    const filePath = path.join(UPLOADS_DIR, file.path);
    if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'File missing on disk' });

    res.download(filePath, file.name);

  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({ error: 'Download failed' });
  }
});

// === All other endpoints remain the same ===
// (Include all the remaining endpoints from your original file: metadata, file info, analytics, settings, admin, etc.)

// === Scheduled Cleanup ===
cron.schedule('0 * * * *', async () => {
  try {
    const now = new Date();
    const expiredFiles = await File.find({
      status: 'active',
      expiresAt: { $lte: now }
    });

    for (const file of expiredFiles) {
      file.status = 'expired';
      await file.save();

      try {
        const settings = await UserSettings.findOne({ userId: 'default' });
        if (settings?.security?.autoDeleteExpired) {
          const filePath = path.join(UPLOADS_DIR, file.path);
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            console.log(`Deleted expired file: ${file.path}`);
          }
        }
      } catch (err) {
        console.error(`Failed to delete expired file: ${file.path}`, err);
      }
    }

    console.log(`Expired files processed: ${expiredFiles.length}`);
  } catch (error) {
    console.error('Scheduled cleanup error:', error);
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start server
const server = app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is busy. Trying port ${PORT + 1}...`);
    const newServer = app.listen(PORT + 1, () => {
      console.log(`Server running on http://localhost:${PORT + 1}`);
    });
  } else {
    console.error('Server error:', err);
  }
});