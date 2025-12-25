import { Client, Account, Databases, Storage, ID, Query } from 'appwrite';

const client = new Client()
    .setEndpoint("https://nyc.cloud.appwrite.io/v1")
    .setProject("694d56ba001bf2665bdb");

const account = new Account(client);
const databases = new Databases(client);

export { client, account, databases, ID, Query };
export const auth = new Account(client);
export const db = new Databases(client);
export const storage = new Storage(client);
