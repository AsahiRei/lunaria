import { File, Directory, Paths } from "expo-file-system";
import type { ReviewerData } from "../store/useReviewerStore";

const CACHE_DIR = new Directory(Paths.cache, "reviewer_cache");
const CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours

type CacheEntry = {
  data: ReviewerData;
  timestamp: number;
  textHash: string;
};

export function getTextHash(text: string): string {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return hash.toString(36);
}

function getCacheFile(hash: string): File {
  if (!CACHE_DIR.exists) {
    CACHE_DIR.create();
  }
  return new File(CACHE_DIR, `${hash}.json`);
}

export async function getCachedReviewer(
  text: string,
): Promise<ReviewerData | null> {
  try {
    const hash = getTextHash(text);
    const cacheFile = getCacheFile(hash);

    if (!cacheFile.exists) return null;

    const content = await cacheFile.text();
    const entry: CacheEntry = JSON.parse(content);

    if (Date.now() - entry.timestamp > CACHE_EXPIRY) {
      cacheFile.delete();
      return null;
    }

    console.log("[cache] Cache hit for hash:", hash);
    return entry.data;
  } catch {
    return null;
  }
}

export function setCachedReviewer(text: string, data: ReviewerData): void {
  try {
    const hash = getTextHash(text);
    const cacheFile = getCacheFile(hash);

    const entry: CacheEntry = {
      data,
      timestamp: Date.now(),
      textHash: hash,
    };

    cacheFile.write(JSON.stringify(entry, null, 2));
    console.log("[cache] Cached reviewer for hash:", hash);
  } catch (error) {
    console.log("[cache] Failed to cache:", error);
  }
}

// Deletes a single cache entry by its text hash (e.g. when the subject
// generated from that PDF text is deleted).
export function deleteCachedReviewerByHash(hash: string): void {
  try {
    const cacheFile = getCacheFile(hash);
    if (cacheFile.exists) {
      cacheFile.delete();
      console.log("[cache] Deleted cache entry for hash:", hash);
    }
  } catch (error) {
    console.log("[cache] Failed to delete cache entry:", error);
  }
}

export function clearCache(): void {
  try {
    if (CACHE_DIR.exists) {
      CACHE_DIR.delete();
      CACHE_DIR.create();
    }
  } catch (error) {
    console.log("[cache] Failed to clear cache:", error);
  }
}

export function getCacheSize(): number {
  try {
    if (!CACHE_DIR.exists) return 0;

    let size = 0;
    const files = CACHE_DIR.list(); // Directory.list() returns (File | Directory)[]
    for (const entry of files) {
      if (entry instanceof File) {
        size += entry.size ?? 0;
      }
    }
    return size;
  } catch {
    return 0;
  }
}