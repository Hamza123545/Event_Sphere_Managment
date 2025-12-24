# Installation Notes

## Required Package Installation

Before running the backend, you need to install the `multer` package for file uploads:

```bash
cd backend
npm install multer @types/multer
```

This package is required for the file upload middleware (`backend/src/middleware/upload.ts`) that handles exhibitor logo and document uploads.

## Static File Serving

The backend now serves uploaded files from the `/uploads` directory. Make sure the `uploads` directory exists in the backend root:

- `uploads/logos/` - Company logos
- `uploads/documents/` - Exhibitor documents
- `uploads/general/` - Other uploads

Files are automatically organized into subdirectories when uploaded.

