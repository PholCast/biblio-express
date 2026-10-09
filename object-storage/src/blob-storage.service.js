import { BlobServiceClient } from '@azure/storage-blob';
import { DefaultAzureCredential } from '@azure/identity';
import 'dotenv/config';

const accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME;
const containerName = process.env.AZURE_STORAGE_CONTAINER_NAME;

let containerClient;

const getContainerClient = () => {
  if (containerClient) {
    return containerClient;
  }

  if (!accountName || !containerName) {
    throw new Error(
      'AZURE_STORAGE_ACCOUNT_NAME and AZURE_STORAGE_CONTAINER_NAME are required'
    );
  }

  const credential = new DefaultAzureCredential();
  const blobServiceClient = new BlobServiceClient(
    `https://${accountName}.blob.core.windows.net`,
    credential
  );

  containerClient = blobServiceClient.getContainerClient(containerName);

  return containerClient;
};

export const uploadJson = async (blobName, data) => {
  const blockBlobClient = getContainerClient().getBlockBlobClient(blobName);
  const content = JSON.stringify(data, null, 2);

  await blockBlobClient.upload(content, Buffer.byteLength(content), {
    blobHTTPHeaders: {
      blobContentType: 'application/json',
    },
  });

  return blobName;
};

export const uploadFlowArtifact = async ({
  version,
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
    ...(version && { version }),
    'x-trace-id': traceId,
    otelTraceId,
    spanId,
    traceparent,
    timestamp: new Date().toISOString(),
    request,
    response,
  };

  const prefix = version ? `${version}/` : '';
  const blobName = `${prefix}${entity}/${id}-${traceId}.json`;

  return uploadJson(blobName, data);
};