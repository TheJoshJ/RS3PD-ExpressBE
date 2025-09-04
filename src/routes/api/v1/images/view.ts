import express, { Request, Response } from 'express';
import { S3Client, ListObjectsV2Command } from "@aws-sdk/client-s3";

const s3 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

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

export async function listImages(continuationToken?: string, maxKeys: number = 50, startAfter?: string) {
  const command = new ListObjectsV2Command({
    Bucket: process.env.R2_BUCKET!,
    ContinuationToken: continuationToken,
    MaxKeys: maxKeys,
    StartAfter: startAfter,
  });

  const response = await s3.send(command);

  // Filter for image files only
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp', '.tiff'];
  const images = (response.Contents || [])
    .filter(obj => {
      const key = obj.Key || '';
      const extension = key.toLowerCase().substring(key.lastIndexOf('.'));
      return imageExtensions.includes(extension);
    })
    .map(obj => ({
      key: obj.Key!,
      size: obj.Size!,
      lastModified: obj.LastModified!,
      publicUrl: `${process.env.R2_PUBLIC_DOMAIN!.startsWith('http') ? '' : 'https://'}${process.env.R2_PUBLIC_DOMAIN}/${obj.Key}`,
    }));

  return {
    images,
    continuationToken: response.NextContinuationToken,
    isTruncated: response.IsTruncated || false,
    totalKeys: response.KeyCount || 0,
    nextOffset: images.length > 0 ? images[images.length - 1].key : undefined,
  };
}

// Helper function to get all image keys for offset calculation
export async function getAllImageKeys(): Promise<string[]> {
  const command = new ListObjectsV2Command({
    Bucket: process.env.R2_BUCKET!,
  });

  const response = await s3.send(command);

  // Filter for image files only and return keys
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp', '.tiff'];
  return (response.Contents || [])
    .filter(obj => {
      const key = obj.Key || '';
      const extension = key.toLowerCase().substring(key.lastIndexOf('.'));
      return imageExtensions.includes(extension);
    })
    .map(obj => obj.Key!)
    .sort(); // Sort for consistent ordering
}

const router = express.Router();

/**
 * @swagger
 * /api/v1/images/view:
 *   get:
 *     summary: List images in the bucket with pagination
 *     tags: [Images]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 1000
 *           default: 50
 *         description: Number of images per page
 *       - in: query
 *         name: continuationToken
 *         schema:
 *           type: string
 *         description: Token for continuation token pagination (most efficient)
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           minimum: 0
 *         description: Number of images to skip (for offset-based pagination)
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Page number (for page-based pagination)
 *     responses:
 *       200:
 *         description: Images retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 images:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       key:
 *                         type: string
 *                         description: Image filename/key
 *                       size:
 *                         type: integer
 *                         description: File size in bytes
 *                       lastModified:
 *                         type: string
 *                         format: date-time
 *                         description: Last modified timestamp
 *                       publicUrl:
 *                         type: string
 *                         description: Public URL for the image
 *                 pagination:
 *                   oneOf:
 *                     - type: object
 *                       properties:
 *                         continuationToken:
 *                           type: string
 *                           description: Token for next page
 *                         hasMore:
 *                           type: boolean
 *                           description: Whether more images are available
 *                         totalInResponse:
 *                           type: integer
 *                           description: Number of images in this response
 *                     - type: object
 *                       properties:
 *                         offset:
 *                           type: integer
 *                           description: Current offset
 *                         limit:
 *                           type: integer
 *                           description: Page size
 *                         total:
 *                           type: integer
 *                           description: Total number of images
 *                         hasMore:
 *                           type: boolean
 *                           description: Whether more images are available
 *                         totalInResponse:
 *                           type: integer
 *                           description: Number of images in this response
 *                     - type: object
 *                       properties:
 *                         page:
 *                           type: integer
 *                           description: Current page number
 *                         limit:
 *                           type: integer
 *                           description: Page size
 *                         total:
 *                           type: integer
 *                           description: Total number of images
 *                         hasMore:
 *                           type: boolean
 *                           description: Whether more images are available
 *                         totalInResponse:
 *                           type: integer
 *                           description: Number of images in this response
 *       400:
 *         description: Invalid request parameters
 *       500:
 *         description: Server error
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    // Validate environment variables first
    validateEnvVars();

    const {
      continuationToken,
      limit = '50',
      offset,
      page
    } = req.query;

    // Validate and parse limit
    const maxKeys = Math.min(parseInt(limit as string, 10) || 50, 1000); // Max 1000 items per request

    if (maxKeys < 1) {
      return res.status(400).json({
        error: 'Limit must be a positive number'
      });
    }

    let result;
    let paginationInfo: any = {};

    // Handle offset-based pagination
    if (offset !== undefined) {
      const offsetNum = parseInt(offset as string, 10);

      if (offsetNum < 0) {
        return res.status(400).json({
          error: 'Offset must be a non-negative number'
        });
      }

      // For offset pagination, we need to get all keys first (this is less efficient)
      // In production, you might want to cache this or use a database
      const allKeys = await getAllImageKeys();

      if (offsetNum >= allKeys.length) {
        return res.json({
          images: [],
          pagination: {
            offset: offsetNum,
            limit: maxKeys,
            total: allKeys.length,
            hasMore: false,
            totalInResponse: 0,
          }
        });
      }

      const startAfterKey = allKeys[offsetNum - 1]; // Start after the previous item
      const endIndex = Math.min(offsetNum + maxKeys, allKeys.length);
      const keysToFetch = allKeys.slice(offsetNum, endIndex);

      result = await listImages(undefined, maxKeys, startAfterKey);

      // Filter to only include the keys we want (offset to offset+limit)
      const filteredImages = result.images.filter(img =>
        keysToFetch.includes(img.key)
      );

      paginationInfo = {
        offset: offsetNum,
        limit: maxKeys,
        total: allKeys.length,
        hasMore: endIndex < allKeys.length,
        totalInResponse: filteredImages.length,
      };

      result.images = filteredImages;
    }
    // Handle continuation token pagination (default)
    else {
      result = await listImages(continuationToken as string, maxKeys);

      paginationInfo = {
        continuationToken: result.continuationToken,
        hasMore: result.isTruncated,
        totalInResponse: result.totalKeys,
      };
    }

    // Handle page-based pagination (alternative to offset)
    if (page !== undefined && offset === undefined) {
      const pageNum = parseInt(page as string, 10);

      if (pageNum < 1) {
        return res.status(400).json({
          error: 'Page must be a positive number'
        });
      }

      const offsetFromPage = (pageNum - 1) * maxKeys;

      // Redirect to offset-based logic
      const allKeys = await getAllImageKeys();
      const startAfterKey = offsetFromPage > 0 ? allKeys[offsetFromPage - 1] : undefined;
      const endIndex = Math.min(offsetFromPage + maxKeys, allKeys.length);
      const keysToFetch = allKeys.slice(offsetFromPage, endIndex);

      result = await listImages(undefined, maxKeys, startAfterKey);

      const filteredImages = result.images.filter(img =>
        keysToFetch.includes(img.key)
      );

      paginationInfo = {
        page: pageNum,
        limit: maxKeys,
        total: allKeys.length,
        hasMore: endIndex < allKeys.length,
        totalInResponse: filteredImages.length,
      };

      result.images = filteredImages;
    }

    return res.json({
      images: result.images,
      pagination: paginationInfo
    });

  } catch (error: any) {
    console.error('Error listing images:', error);
    return res.status(500).json({
      error: 'Failed to list images',
      message: error.message
    });
  }
});

export default router;
