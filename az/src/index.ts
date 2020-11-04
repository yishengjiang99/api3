import {
  BlobServiceClient,
  BlockBlobClient,
  ContainerClient,
} from "@azure/storage-blob";
import { getType } from "mime";
import { execSync } from "child_process";
import { basename, dirname } from "path";
import { AbortController } from "@azure/abort-controller";
import { readdir } from "fs";

const SigTrap = new AbortController();

process.on("SIGINT", function () {
  SigTrap.abort();
});

export async function listFiless(asset) {
  const wsclient= BlobServiceClient.fromConnectionString(
    process.env.AZURE_STORAGE_CONNECTION_STRING
  ).getContainerClient(asset);
  let marker=null;
  const iterator = wsclient.listBlobsFlat().byPage({ continuationToken: marker, maxPageSize: 10 });
  let i =0;
  for (const blob of wsclient.listBlobsFlat()) {
    console.log(`Blob ${i++}: ${blob.name}`);
  }
}
listFiless('cdn')
function getContainerClient() {
  return BlobServiceClient.fromConnectionString(
    process.env.AZURE_STORAGE_CONNECTION_STRING
  ).getContainerClient("cdn");
}


export async function uploadFile(path: string) {
  const client = getContainerClient();
  if (!client) throw Error("no ContainerClient");
  console.log(blobName + "..........");
  var blobName = path.split("/").join("-");

  var blockBlobClient: BlockBlobClient = client.getBlockBlobClient(blobName);
  while (await blockBlobClient.exists()) {
    let dot = blobName.lastIndexOf(".");
    blobName =
      dot > 0
        ? blobName.substring(0, dot) +
          Math.random() * 100 +
          blobName.substring(dot)
        : blobName.concat(Math.random() * 100 + "");
    blockBlobClient = client.getBlockBlobClient(blobName);
  }

  console.log("starting upload of " + path);
  try {
    const resp = await blockBlobClient.uploadFile(path, {
      onProgress: (event) => console.log(event),
      abortSignal: SigTrap.signal,
      concurrency: 5,
      blobHTTPHeaders: {
        blobContentType: getType(basename(path)),
        blobCacheControl: "public, max-age=7776000",
      },
    });
    return resp;
  } catch (e) {
    throw e;
  }
  return null;
}

export async function uploadCLI(argv2: any) {
  const filepath = process.argv[2] || argv2;
  if (!filepath) {
    console.info("Usage: upload [filepath]");
    return;
  }
  const client = getContainerClient();
  readdir(filepath,(err,files)=>{
    if(err) console.error(err);
    if(files)  files.every(f=>{
      console.log(f);
      uploadFile(f);
    });
  })
}
