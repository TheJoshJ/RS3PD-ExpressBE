// CORS configuration
export const corsOptions = {
  origin: function (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    // Allow localhost origins (common development ports)
    const allowedOrigins = [
      'http://localhost:5173',  // Vite dev server
    ];

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    // For production, you might want to restrict this further
    if (process.env.NODE_ENV === 'production') {
      // Add your production domain here
      const productionOrigins = [
        'https://thersguide.com',
        'https://www.thersguide.com',
        'https://staging.thersguide.com',
      ];

      if (productionOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error('Not allowed by CORS'));
    }

    // In development, allow all origins
    return callback(null, true);
  },
  credentials: true,
  optionsSuccessStatus: 200, // Some legacy browsers choke on 204
};
