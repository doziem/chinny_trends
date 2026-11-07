import { supabase } from "./supabase";

const fields = "id, name, slug, description, cover_image_url, is_featured, is_active, created_at";
const bucket = "fashion-products";
const imageTypes = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };

function collectionImagePath(url) {
  if (!url) return null;
  const prefix = supabase.storage.from(bucket).getPublicUrl("collections/").data.publicUrl;
  if (!url.startsWith(prefix)) return null;
  const path = url.slice(prefix.length);
  return /^[a-f0-9-]+\/[a-f0-9-]+\.(jpg|png|webp)$/i.test(path) ? `collections/${path}` : null;
}

async function removeCollectionImage(url) {
  const path = collectionImagePath(url);
  if (!path) return null;
  try {
    const { error } = await supabase.storage.from(bucket).remove([path]);
    return error;
  } catch (error) {
    return error;
  }
}

export async function getCollections({ includeInactive = false } = {}) {
  let query = supabase.from("collections").select(fields).order("created_at", { ascending: false });
  if (!includeInactive) query = query.eq("is_active", true);
  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function getCollectionBySlug(slug) {
  const { data, error } = await supabase.from("collections").select(fields)
    .eq("slug", slug).eq("is_active", true).maybeSingle();
  if (error) throw error;
  return data;
}

export async function getCollectionById(id) {
  const { data, error } = await supabase.from("collections").select(fields).eq("id", id).single();
  if (error) throw error;
  return data;
}

export async function saveCollection(values, id = null, image = null, previousImageUrl = null) {
  const payload = {
    name: values.name.trim(),
    slug: values.slug.trim().toLowerCase(),
    description: values.description.trim() || null,
    cover_image_url: values.cover_image_url.trim() || null,
    is_featured: Boolean(values.is_featured),
    is_active: Boolean(values.is_active)
  };
  if (!payload.name || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(payload.slug)) {
    throw new Error("Enter a name and a slug containing lowercase letters, numbers and single hyphens.");
  }
  let uploadedUrl = null;
  if (image) {
    const extension = imageTypes[image.type];
    if (!extension) throw new Error("Choose a JPEG, PNG or WebP image.");
    if (image.size > 5 * 1024 * 1024) throw new Error("The cover image must be 5MB or less.");
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError) throw authError;
    if (!authData.user) throw new Error("Please sign in.");
    const path = `collections/${authData.user.id}/${crypto.randomUUID()}.${extension}`;
    const { error: uploadError } = await supabase.storage.from(bucket).upload(path, image, { contentType: image.type, upsert: false });
    if (uploadError) throw uploadError;
    uploadedUrl = supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
    payload.cover_image_url = uploadedUrl;
  }
  const query = id
    ? supabase.from("collections").update(payload).eq("id", id)
    : supabase.from("collections").insert(payload);
  let data;
  try {
    const result = await query.select(fields).single();
    if (result.error) throw result.error;
    data = result.data;
  } catch (error) {
    if (uploadedUrl) {
      const cleanupError = await removeCollectionImage(uploadedUrl);
      if (cleanupError) throw new Error(`${error.message} The uploaded image could not be removed: ${cleanupError.message}`);
    }
    throw error;
  }
  const cleanupError = previousImageUrl && previousImageUrl !== payload.cover_image_url
    ? await removeCollectionImage(previousImageUrl) : null;
  return { collection: data, cleanupError };
}

export async function deleteCollection(id) {
  const { data, error } = await supabase.from("collections").delete().eq("id", id).select("cover_image_url").single();
  if (error) throw error;
  const cleanupError = await removeCollectionImage(data.cover_image_url);
  return { cleanupError };
}
