import { supabase } from "./supabase";

const BUCKET = "fashion-products";

export async function getProducts({ search = "", category = "all", collection = null, featuredOnly = false, includeDrafts = false } = {}) {
  let query = supabase
    .from("products")
    .select(`
      id, name, slug, description, price, currency, fabric, fit, status,
      is_featured, category_id, collection_id, created_at,
      categories(name, slug),
      product_images(id, image_url, storage_path, alt_text, display_order, is_primary)
    `)
    .order("created_at", { ascending: false });

  if (!includeDrafts) query = query.eq("status", "published");
  if (category !== "all") query = query.eq("category_id", category);
  if (collection) query = query.eq("collection_id", collection);
  if (featuredOnly) query = query.eq("is_featured", true);
  if (search.trim()) query = query.ilike("name", `%${search.trim()}%`);

  const { data, error } = await query;
  if (error) throw error;

  return (data || []).map((p) => ({
    ...p,
    product_images: (p.product_images || []).sort((a, b) =>
      Number(b.is_primary) - Number(a.is_primary) || a.display_order - b.display_order
    )
  }));
}

export async function getProductBySlug(slug) {
  const { data, error } = await supabase
    .from("products")
    .select("*, categories(name), product_images(*)")
    .eq("slug", slug)
    .single();
  if (error) throw error;
  return data;
}

export async function getCategories() {
  const { data, error } = await supabase
    .from("categories")
    .select("id, name, slug")
    .eq("is_active", true)
    .order("name");
  if (error) throw error;
  return data || [];
}

function slugify(value) {
  return value.toLowerCase().trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function saveProduct({ values, files, existingId = null, existingImages = [] }) {
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData.user) throw new Error("Please sign in.");
  const user = authData.user;

  const payload = {
    name: values.name.trim(),
    slug: `${slugify(values.name)}-${Date.now().toString().slice(-6)}`,
    description: values.description || null,
    price: Number(values.price),
    currency: values.currency || "NGN",
    category_id: values.category_id || null,
    collection_id: values.collection_id || null,
    fabric: values.fabric || null,
    fit: values.fit || null,
    status: values.status || "draft",
    is_featured: Boolean(values.is_featured),
    created_by: user.id,
    updated_at: new Date().toISOString()
  };

  let product;
  if (existingId) {
    const { data, error } = await supabase.from("products")
      .update({ ...payload, slug: undefined })
      .eq("id", existingId).select().single();
    if (error) throw error;
    product = data;
  } else {
    const { data, error } = await supabase.from("products")
      .insert(payload).select().single();
    if (error) throw error;
    product = data;
  }

  const uploaded = [];
  try {
    for (const [index, file] of files.entries()) {
      if (!file.type.startsWith("image/")) throw new Error(`${file.name} is not an image.`);
      if (file.size > 5 * 1024 * 1024) throw new Error(`${file.name} exceeds 5MB.`);
      const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `${user.id}/${product.id}/${crypto.randomUUID()}.${extension}`;
      const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, file, {
        contentType: file.type,
        upsert: false
      });
      if (uploadError) throw uploadError;
      const { data: publicData } = supabase.storage.from(BUCKET).getPublicUrl(path);
      uploaded.push({
        product_id: product.id,
        image_url: publicData.publicUrl,
        storage_path: path,
        alt_text: `${product.name} image ${index + 1}`,
        display_order: existingImages.length + index,
        is_primary: existingImages.length === 0 && index === 0
      });
    }

    if (uploaded.length) {
      const { error: imageError } = await supabase.from("product_images").insert(uploaded);
      if (imageError) throw imageError;
    }
  } catch (error) {
    await Promise.all(uploaded.map((item) =>
      supabase.storage.from(BUCKET).remove([item.storage_path])
    ));
    throw error;
  }

  return product;
}

export async function replaceProductImage(image, file) {
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError) throw authError;
  if (!authData.user) throw new Error("Please sign in.");
  if (file.type !== "image/jpeg" || file.size > 5 * 1024 * 1024) throw new Error("The edited image must be a JPEG up to 5MB.");

  const path = `${authData.user.id}/${image.product_id}/${crypto.randomUUID()}.jpg`;
  const storage = supabase.storage.from(BUCKET);
  const { error: uploadError } = await storage.upload(path, file, { contentType: file.type, upsert: false });
  if (uploadError) throw uploadError;
  const imageUrl = storage.getPublicUrl(path).data.publicUrl;
  let updated;
  try {
    const { data, error } = await supabase.from("product_images").update({ image_url: imageUrl, storage_path: path })
      .eq("id", image.id).eq("product_id", image.product_id).select().single();
    if (error) throw error;
    updated = data;
  } catch (error) {
    try {
      const { error: cleanupError } = await storage.remove([path]);
      if (cleanupError) throw cleanupError;
    } catch (cleanupError) {
      throw new Error(`${error.message} The uploaded image could not be removed: ${cleanupError.message}`);
    }
    throw error;
  }
  let cleanupError = null;
  if (image.storage_path) {
    try {
      const result = await storage.remove([image.storage_path]);
      cleanupError = result.error;
    } catch (error) { cleanupError = error; }
  }
  return { image: updated, cleanupError };
}

export async function deleteProduct(product) {
  const { data: images, error: readError } = await supabase
    .from("product_images").select("storage_path").eq("product_id", product.id);
  if (readError) throw readError;

  const { error } = await supabase.from("products").delete().eq("id", product.id);
  if (error) throw error;

  const paths = (images || []).map((img) => img.storage_path).filter(Boolean);
  if (paths.length) {
    const { error: storageError } = await supabase.storage.from(BUCKET).remove(paths);
    if (storageError) console.error("Product deleted, but some image files could not be removed:", storageError);
  }
}
