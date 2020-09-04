import { BlobServiceClient, ContainerClient } from "@azure/storage-blob";
export declare const getServiceClient: () => Promise<BlobServiceClient>;
export declare const getContainerClient: (containerName?: string) => Promise<ContainerClient>;
export declare function uploadFile(path: string): Promise<import("@azure/storage-blob").BlobUploadCommonResponse>;
export declare function main(argv2: any): Promise<void>;
