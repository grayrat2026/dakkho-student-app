/**
 * Appwrite Server Stub — Legacy compatibility only
 * All data is now served from D1 via the Worker API.
 * This module provides stubs so old API routes don't break the build.
 * The actual routes are superseded by Worker routes and should not be called.
 */

// Stub exports for backward compatibility
export const databases = null as any;
export const dbId = '';
export const client = null as any;

// Stub Query class
export const Query = {
  equal: (_attr: string, _value: any) => '',
  notEqual: (_attr: string, _value: any) => '',
  greaterThan: (_attr: string, _value: any) => '',
  lessThan: (_attr: string, _value: any) => '',
  search: (_attr: string, _value: string) => '',
  orderDesc: (_attr: string) => '',
  orderAsc: (_attr: string) => '',
  limit: (_n: number) => '',
  offset: (_n: number) => '',
  cursorAfter: (_id: string) => '',
  cursorBefore: (_id: string) => '',
};

// Stub ID
export const ID = {
  unique: () => crypto.randomUUID(),
};

// Stub appwriteRest — all methods throw "use Worker API instead"
export const appwriteRest = {
  async listDocuments(_collectionId: string, _queries: string[] = []) {
    throw new Error('Appwrite is deprecated. Use Worker API instead.');
  },
  async getDocument(_collectionId: string, _documentId: string) {
    throw new Error('Appwrite is deprecated. Use Worker API instead.');
  },
  async createDocument(_collectionId: string, _documentId: string, _data: Record<string, unknown>) {
    throw new Error('Appwrite is deprecated. Use Worker API instead.');
  },
  async updateDocument(_collectionId: string, _documentId: string, _data: Record<string, unknown>) {
    throw new Error('Appwrite is deprecated. Use Worker API instead.');
  },
  async deleteDocument(_collectionId: string, _documentId: string) {
    throw new Error('Appwrite is deprecated. Use Worker API instead.');
  },
  async healthCheck() {
    return false;
  },
};
