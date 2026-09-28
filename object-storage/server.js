import 'dotenv/config';

const { default: app } = await import('./src/app.js');

const port = process.env.PORT || 3001;

app.listen(port, () => {
  console.log(`Object Storage service running on PORT: ${port}`);
});