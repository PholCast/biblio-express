import { BlobServiceClient } from '@azure/storage-blob';
import { DefaultAzureCredential } from '@azure/identity';
import "dotenv/config";

const accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME;
const containerName = process.env.AZURE_STORAGE_CONTAINER_NAME;

const credential = new DefaultAzureCredential();

const blobServiceClient = new BlobServiceClient(
  `https://${accountName}.blob.core.windows.net`,
  credential
);

const containerClient = blobServiceClient.getContainerClient(containerName);

export const uploadJson = async (blobName, data) => {
  const blockBlobClient = containerClient.getBlockBlobClient(blobName);

  const content = JSON.stringify(data, null, 2);

  await blockBlobClient.upload(content, Buffer.byteLength(content), {
    blobHTTPHeaders: {
      blobContentType: 'application/json',
    },
  });

  return blobName;
};

export const uploadFlowArtifact = async ({
  entity,
  id,
  traceId,
  otelTraceId,
  spanId,
  traceparent,
  request,
  response,
}) => {
  const data = {
    'x-trace-id': traceId,
    otelTraceId,
    spanId,
    traceparent,
    timestamp: new Date().toISOString(),
    request,
    response,
  };

  const blobName = `${entity}/${id}-${traceId}.json`;

  return uploadJson(blobName, data);
};