const API_VERSIONS = {
  '/api/v4': '4.0.0',
  '/api/v3': '3.0.0',
  '/api/v2': '2.0.0',
  '/api': '1.0.0',
};

export const apiMetadata = (req, res, next) => {
  const path = req.originalUrl.split('?')[0];

  const apiPrefix = Object.keys(API_VERSIONS).find(
    (prefix) =>
      path === prefix || path.startsWith(`${prefix}/`),
  );

  if (!apiPrefix) {
    return next();
  }

  const apiVersion = API_VERSIONS[apiPrefix];
  const appVersion = process.env.APP_VERSION || 'unknown';
  const track = process.env.APP_TRACK || 'unknown';

  const metadata = {
    apiVersion,
    appVersion,
    track,
  };

  res.setHeader('X-API-Version', apiVersion);
  res.setHeader('X-App-Version', appVersion);
  res.setHeader('X-App-Track', track);

  const originalJson = res.json.bind(res);

  res.json = (body) => {
    if (Array.isArray(body)) {
      body = {
        ...metadata,
        data: body,
      };
    } else if (body !== null && typeof body === 'object') {
      body = {
        ...metadata,
        ...body,
      };
    } else {
      body = {
        ...metadata,
        data: body,
      };
    }

    return originalJson(body);
  };

  next();
};