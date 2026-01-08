import { Client, Account, Databases, Storage, ID, Query } from 'appwrite';

const client = new Client()
    .setEndpoint("https://nyc.cloud.appwrite.io/v1")
    .setProject("694d56ba001bf2665bdb");

export const account = new Account(client);
export const db = new Databases(client);
export const storage = new Storage(client);
export { client, ID, Query };