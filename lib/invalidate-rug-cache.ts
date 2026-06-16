import { revalidateTag } from "next/cache";
import { ODAMDA_GOR_CACHE_TAG, WIDGET_RUG_CACHE_TAG } from "@/lib/cache-tags";

export function invalidateRugPublicCache() {
  revalidateTag(WIDGET_RUG_CACHE_TAG, "seconds");
  revalidateTag(ODAMDA_GOR_CACHE_TAG, "seconds");
}
