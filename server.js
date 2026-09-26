import 'dotenv/config';

await import('./src/observability/telemetry.js');

const { default: app } = await import('./src/app.js');

const PORT = process.env.PORT;

app.listen(PORT, () => {
  console.log(`Server running on PORT: ${PORT}`);
});