// Appwrite Server SDK - REST API helpers for Supabase Edge Functions
// Uses direct fetch calls with the server API key (Deno runtime)

const ENDPOINT = Deno.env.get('APPWRITE_ENDPOINT') || '';
const PROJECT_ID = Deno.env.get('APPWRITE_PROJECT_ID') || '';
const API_KEY = Deno.env.get('APPWRITE_API_KEY') || '';
const DB_ID = Deno.env.get('APPWRITE_DATABASE_ID') || '';

function getHeaders(): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    'X-Appwrite-Project': PROJECT_ID,
    'X-Appwrite-Key': API_KEY,
  };
}

/** Appwrite Query helpers - mirrors the node-appwrite Query API */
export const Query = {
  equal: (attr: string, value: unknown): string =>
    `equal("${attr}", ${JSON.stringify(Array.isArray(value) ? value : [value])})`,
  notEqual: (attr: string, value: unknown): string =>
    `notEqual("${attr}", ${JSON.stringify(Array.isArray(value) ? value : [value])})`,
  lessThan: (attr: string, value: unknown): string =>
    `lessThan("${attr}", ${JSON.stringify(value)})`,
  lessThanEqual: (attr: string, value: unknown): string =>
    `lessThanEqual("${attr}", ${JSON.stringify(value)})`,
  greaterThan: (attr: string, value: unknown): string =>
    `greaterThan("${attr}", ${JSON.stringify(value)})`,
  greaterThanEqual: (attr: string, value: unknown): string =>
    `greaterThanEqual("${attr}", ${JSON.stringify(value)})`,
  search: (attr: string, value: string): string =>
    `search("${attr}", "${value}")`,
  orderAsc: (attr: string): string =>
    `orderAsc("${attr}")`,
  orderDesc: (attr: string): string =>
    `orderDesc("${attr}")`,
  limit: (value: number): string =>
    `limit(${value})`,
  offset: (value: number): string =>
    `offset(${value})`,
  cursorAfter: (documentId: string): string =>
    `cursorAfter("${documentId}")`,
  cursorBefore: (documentId: string): string =>
    `cursorBefore("${documentId}")`,
};

/** Generate a unique ID (mimics Appwrite ID.unique) */
export function uniqueId(): string {
  return crypto.randomUUID().replace(/-/g, '');
}

/** Appwrite REST API helper */
export const appwriteRest = {
  async listDocuments(collectionId: string, queries: string[] = []) {
    const params = new URLSearchParams();
    queries.forEach((q) => params.append('queries[]', q));

    const res = await fetch(
      `${ENDPOINT}/databases/${DB_ID}/collections/${collectionId}/documents?${params.toString()}`,
      { headers: getHeaders() }
    );

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || `Failed to list documents from ${collectionId}`);
    }

    return res.json();
  },

  async getDocument(collectionId: string, documentId: string) {
    const res = await fetch(
      `${ENDPOINT}/databases/${DB_ID}/collections/${collectionId}/documents/${documentId}`,
      { headers: getHeaders() }
    );

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Failed to get document');
    }

    return res.json();
  },

  async createDocument(collectionId: string, documentId: string, data: Record<string, unknown>) {
    const res = await fetch(
      `${ENDPOINT}/databases/${DB_ID}/collections/${collectionId}/documents`,
      {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          documentId: documentId || uniqueId(),
          data,
        }),
      }
    );

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Failed to create document');
    }

    return res.json();
  },

  async updateDocument(collectionId: string, documentId: string, data: Record<string, unknown>) {
    const res = await fetch(
      `${ENDPOINT}/databases/${DB_ID}/collections/${collectionId}/documents/${documentId}`,
      {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({ data }),
      }
    );

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Failed to update document');
    }

    return res.json();
  },

  async deleteDocument(collectionId: string, documentId: string) {
    const res = await fetch(
      `${ENDPOINT}/databases/${DB_ID}/collections/${collectionId}/documents/${documentId}`,
      {
        method: 'DELETE',
        headers: getHeaders(),
      }
    );

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Failed to delete document');
    }

    return true;
  },

  async healthCheck() {
    try {
      const res = await fetch(`${ENDPOINT}/health`, {
        headers: {
          'X-Appwrite-Project': PROJECT_ID,
          'X-Appwrite-Key': API_KEY,
        },
      });
      return res.ok;
    } catch {
      return false;
    }
  },
};

/** Appwrite Auth REST helpers (for session management) */
export const appwriteAuth = {
  /** Create email session */
  async createEmailSession(email: string, password: string) {
    const res = await fetch(`${ENDPOINT}/account/sessions/email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Appwrite-Project': PROJECT_ID,
      },
      body: JSON.stringify({ email, password }),
    });
    return res;
  },

  /** Get account info using session cookie */
  async getAccount(sessionCookie: string) {
    const res = await fetch(`${ENDPOINT}/account`, {
      headers: {
        'X-Appwrite-Project': PROJECT_ID,
        'Cookie': `a_session_${PROJECT_ID}=${sessionCookie}`,
      },
    });
    return res;
  },

  /** Delete current session */
  async deleteSession(sessionCookie: string) {
    try {
      await fetch(`${ENDPOINT}/account/sessions/current`, {
        method: 'DELETE',
        headers: {
          'X-Appwrite-Project': PROJECT_ID,
          'Cookie': `a_session_${PROJECT_ID}=${sessionCookie}`,
        },
      });
    } catch {
      // Ignore errors during session cleanup
    }
  },
};

/** Export env vars for direct use */
export function getAppwriteConfig() {
  return { ENDPOINT, PROJECT_ID, API_KEY, DB_ID };
}
