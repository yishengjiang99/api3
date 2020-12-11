import {
  BlobItem,
  BlobServiceClient,
  BlockBlobClient,
  ContainerClient,
} from "@azure/storage-blob"
import { getType } from "mime-type"
import { execSync } from "child_process"
import { basename, dirname } from "path"
import { readdir } from "fs"
import { Readable } from "stream"

const SigTrap = new AbortController()

process.on("SIGINT", function () {
  SigTrap.abort()
})
export const wsclient = (azconn_str = ""): BlobServiceClient =>
  BlobServiceClient.fromConnectionString(
    azconn_str ||
      process.env.AZ_CONN_STR ||
      process.env.AZURE_STORAGE_CONNECTION_STRING
  )
export async function listFiles(asset): Promise<BlobItem[]> {
  const wsclient = BlobServiceClient.fromConnectionString(
    process.env.AZURE_STORAGE_CONNECTION_STRING
  ).getContainerClient(asset)
  let marker = null
  const iterator = wsclient
    .listBlobsFlat()
    .byPage({ continuationToken: marker, maxPageSize: 10 })
  const list = []
  for await (const item of iterator) {
    list.push(item)
  }
  return list
}

export const getContainerClient = () => {
  return BlobServiceClient.fromConnectionString(
    process.env.AZURE_STORAGE_CONNECTION_STRING
  ).getContainerClient("cdn")
}

export function listContainerFiles(container): Readable {
  return Readable.from(wsclient().getContainerClient(container).listBlobsFlat())
}
export function listFilesSync(container = "pcm") {
  try {
    const urls = []
    let str = execSync(
      `curl -s 'https://grep32bit.blob.core.windows.net/${container}?resttype=container&comp=list'`
    ).toString()
    while (str.length) {
      let m = str.match(/<Url>(.*?)<\/Url>/)
      if (!m) break
      urls.push(m[1])
      str = str.slice(m[0].length)
    }
    return urls
  } catch (error) {
    console.log(error.message);
    return [];
  }
}

