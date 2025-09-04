import express, { Request, Response } from 'express';
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

export async function getUploadUrl(filename: string, contentType: string) {
  const command = new PutObjectCommand({
    Bucket: process.env.R2_BUCKET!,
    Key: filename,
    ContentType: contentType,
  });

  return getSignedUrl(s3, command, { expiresIn: 60 * 5 }); // 5 min expiry
}


// Validate required environment variables
const validateEnvVars = () => {
  const requiredVars = [
    'R2_ACCOUNT_ID',
    'R2_ACCESS_KEY_ID',
    'R2_SECRET_ACCESS_KEY',
    'R2_BUCKET',
    'R2_PUBLIC_DOMAIN'
  ];

  const missing = requiredVars.filter(varName => !process.env[varName]);

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
};

const router = express.Router();

// Route to get a signed URL for image upload
router.post('/upload-url', async (req: Request, res: Response) => {
  try {
    // Validate environment variables first
    validateEnvVars();

    const { filename, contentType } = req.body;

    // Validate input
    if (!filename) {
      return res.status(400).json({ error: 'Filename is required' });
    }

    if (!contentType) {
      return res.status(400).json({ error: 'Content type is required' });
    }

    // Validate content type for images
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(contentType)) {
      return res.status(400).json({
        error: 'Invalid content type. Only image files are allowed.',
        allowedTypes
      });
    }

    // Generate unique filename if needed (prevent overwrites)
    const uniqueFilename = `${Date.now()}-${filename}`;

    // Get signed URL
    const uploadUrl = await getUploadUrl(uniqueFilename, contentType);

    return res.json({
      uploadUrl,
      filename: uniqueFilename,
      expiresIn: 300, // 5 minutes in seconds
      publicUrl: `https://${process.env.R2_PUBLIC_DOMAIN}/${uniqueFilename}`
    });

  } catch (error: any) {
    console.error('Error generating upload URL:', error);
    return res.status(500).json({
      error: 'Failed to generate upload URL',
      message: error.message
    });
  }
});

// Route to handle direct image upload (alternative approach)
router.post('/upload', async (req: Request, res: Response) => {
  try {
    // This would require multer for handling multipart/form-data
    // For now, we'll focus on the signed URL approach
    return res.status(501).json({
      error: 'Direct upload not implemented. Use /upload-url endpoint instead.'
    });
  } catch (error: any) {
    console.error('Error uploading image:', error);
    return res.status(500).json({
      error: 'Failed to upload image',
      message: error.message
    });
  }
});


export default router;
