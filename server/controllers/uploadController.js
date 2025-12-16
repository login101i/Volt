const multer = require('multer');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');

// Configure storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Save to frontend/public/pictures/electricComponents
    const uploadPath = path.join(__dirname, '..', '..', 'frontend', 'public', 'pictures', 'electricComponents');
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    // Try to get componentId from body, query, or use a temporary name
    // Note: req.body might not be parsed yet when filename is called
    // We'll handle the actual renaming in the upload handler
    const ext = path.extname(file.originalname);
    // Use a temporary filename with timestamp, we'll rename it later
    cb(null, `temp_${Date.now()}${ext}`);
  }
});

// File filter - only allow images
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new Error('Only image files are allowed (jpeg, jpg, png, gif, webp)'));
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: fileFilter
});

// Upload handler
const uploadComponentImage = (req, res) => {
  // Use any() to capture all fields including text fields
  upload.any()(req, res, (err) => {
    if (err) {
      console.error('Upload error:', err);
      return res.status(400).json({ 
        success: false, 
        error: err.message || 'Error uploading file' 
      });
    }

    // Find the image file
    const file = req.files && req.files.length > 0 
      ? req.files.find(f => f.fieldname === 'image') 
      : null;
    
    if (!file) {
      return res.status(400).json({ 
        success: false, 
        error: 'No file uploaded' 
      });
    }

    // Get componentId from body (parsed by multer when using any())
    // Multer parses text fields into req.body
    let componentId = req.body.componentId || req.query.componentId;
    
    // If componentId is not in body, check if it was sent as a file field (shouldn't happen, but be safe)
    if (!componentId && req.files) {
      const componentIdFile = req.files.find(f => f.fieldname === 'componentId');
      if (componentIdFile && componentIdFile.buffer) {
        componentId = componentIdFile.buffer.toString('utf8');
      }
    }
    
    // Debug logging
    console.log('Request body:', req.body);
    console.log('Request files:', req.files?.map(f => ({ fieldname: f.fieldname, originalname: f.originalname })));
    console.log('ComponentId:', componentId);
    
    if (!componentId) {
      // Delete the uploaded file if componentId is missing
      if (file.path) {
        try {
          fs.unlinkSync(file.path);
        } catch (delErr) {
          console.error('Error deleting file:', delErr);
        }
      }
      return res.status(400).json({ 
        success: false, 
        error: 'Component ID is required' 
      });
    }

    // Convert image to JPG and save with componentId
    const uploadDir = path.dirname(file.path);
    const newFilename = `${componentId}.jpg`;
    const newPath = path.join(uploadDir, newFilename);
    
    // Delete old files if they exist (could be .jpg or .jpeg)
    const oldJpgPath = path.join(uploadDir, `${componentId}.jpg`);
    const oldJpegPath = path.join(uploadDir, `${componentId}.jpeg`);
    try {
      if (fs.existsSync(oldJpgPath) && oldJpgPath !== newPath) {
        fs.unlinkSync(oldJpgPath);
      }
      if (fs.existsSync(oldJpegPath)) {
        fs.unlinkSync(oldJpegPath);
      }
    } catch (delErr) {
      console.error('Error deleting old file:', delErr);
    }
    
    // Convert and save image as JPG
    sharp(file.path)
      .jpeg({ quality: 90 }) // Convert to JPEG with 90% quality
      .toFile(newPath)
      .then(() => {
        // Delete temp file after successful conversion
        try {
          if (fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
          }
        } catch (delErr) {
          console.error('Error deleting temp file:', delErr);
        }

        const filePath = `/pictures/electricComponents/${newFilename}`;

        res.json({
          success: true,
          message: 'Image uploaded and converted to JPG successfully',
          filePath: filePath,
          componentId: componentId,
          filename: newFilename
        });
      })
      .catch((convertErr) => {
        console.error('Error converting image:', convertErr);
        // Try to delete temp file
        try {
          if (fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
          }
        } catch (delErr) {
          console.error('Error deleting temp file:', delErr);
        }
        return res.status(500).json({ 
          success: false, 
          error: 'Error converting image to JPG: ' + convertErr.message 
        });
      });
  });
};

module.exports = {
  uploadComponentImage,
  upload
};
