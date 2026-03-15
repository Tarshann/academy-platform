import app from "../dist/serverless.js";
export default app;

// Disable Vercel's built-in body parser so Express middlewares (express.json
// for JSON and multer for multipart uploads) can handle parsing directly.
export const config = {
  api: {
    bodyParser: false,
  },
};
