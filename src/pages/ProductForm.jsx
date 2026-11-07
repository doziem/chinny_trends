import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, UploadCloud } from "lucide-react";
import toast from "react-hot-toast";
import { supabase } from "../services/supabase";
import { replaceProductImage, saveProduct } from "../services/productService";
import { getCollections } from "../services/collectionService";
import ImageEditor from "../components/ImageEditor";

const initial = { name: "", description: "", price: "", currency: "NGN", category_id: "", collection_id: "", fabric: "", fit: "", care_instructions: "", status: "draft", is_featured: false };

function ProductImagePreview({ file, url, label, onEdit, onRemove, busy }) {
  const [preview, setPreview] = useState("");
  useEffect(() => {
    if (!file) { setPreview(""); return; }
    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);
  const source = file ? preview : url;
  return <div className="product-image-preview">
    {source && <img src={source} alt={label}/>}
    <div><button type="button" disabled={!source || busy} onClick={() => onEdit(source)}>Edit</button><button type="button" disabled={busy} onClick={onRemove}>Remove</button></div>
  </div>;
}

export default function ProductForm() {
  const { id } = useParams();
  const editing = Boolean(id);
  const navigate = useNavigate();
  const [values, setValues] = useState(initial);
  const [categories, setCategories] = useState([]);
  const [collections, setCollections] = useState([]);
  const [files, setFiles] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [replacements, setReplacements] = useState({});
  const [imageEditor, setImageEditor] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    getCollections({ includeInactive: true }).then(setCollections).catch(err => toast.error(err.message));
    supabase.from("categories").select("id,name").eq("is_active", true).order("name").then(({ data, error }) => {
      if (error) toast.error(error.message); else setCategories(data || []);
    });
    if (editing) {
      supabase.from("products").select("*, product_images(*)").eq("id", id).single().then(({ data, error }) => {
        if (error) return toast.error(error.message);
        setValues({ ...initial, ...data, price: String(data.price), category_id: data.category_id || "", collection_id: data.collection_id || "" });
        setExistingImages(data.product_images || []);
      });
    }
  }, [id, editing]);

  function change(e) {
    const { name, value, type, checked } = e.target;
    setValues(v => ({ ...v, [name]: type === "checkbox" ? checked : value }));
  }

  async function submit(e) {
    e.preventDefault();
    if (!editing && files.length === 0) return toast.error("Add at least one product image.");
    setBusy(true);
    try {
      await saveProduct({ values, files, existingId: id, existingImages });
      setFiles([]);
      for (const image of existingImages) {
        if (!replacements[image.id]) continue;
        const result = await replaceProductImage(image, replacements[image.id]);
        setExistingImages(items => items.map(item => item.id === image.id ? result.image : item));
        setReplacements(current => { const next = { ...current }; delete next[image.id]; return next; });
        if (result.cleanupError) toast.error(`Image updated, but the old file could not be removed: ${result.cleanupError.message}`);
      }
      toast.success(editing ? "Design updated." : "Design created.");
      navigate("/admin/products");
    } catch (err) { toast.error(err.message || "Could not save design."); }
    finally { setBusy(false); }
  }

  async function removeImage(image) {
    if (!window.confirm("Remove this image?")) return;
    try {
      const { error } = await supabase.from("product_images").delete().eq("id", image.id);
      if (error) throw error;
      if (image.storage_path) {
        const { error: storageError } = await supabase.storage.from("fashion-products").remove([image.storage_path]);
        if (storageError) console.warn(storageError.message);
      }
      setExistingImages(items => items.filter(i => i.id !== image.id));
      setReplacements(current => { const next = { ...current }; delete next[image.id]; return next; });
    } catch (err) { toast.error(err.message); }
  }

  return <div className="admin-content"><Link to="/admin/products" className="back-link"><ArrowLeft size={16}/> Back to products</Link><div className="admin-topline form-heading"><div><span className="eyebrow">CATALOGUE MANAGEMENT</span><h1>{editing ? "Edit design" : "Add a new design"}</h1><p>Share the details that make this piece special.</p></div></div>
    <form className="product-form admin-panel" onSubmit={submit}>
      <div className="form-section"><h2>Design information</h2><div className="form-grid">
        <label className="field-wide">Design name<input name="name" value={values.name} onChange={change} required maxLength="120" placeholder="e.g. Adire Heritage Set"/></label>
        <label>Price (NGN)<input name="price" type="number" min="0" step="0.01" value={values.price} onChange={change} required/></label>
        <label>Category<select name="category_id" value={values.category_id} onChange={change}><option value="">Choose a category</option>{categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
        <label>Collection<select name="collection_id" value={values.collection_id} onChange={change}><option value="">No collection</option>{collections.map(c => <option key={c.id} value={c.id}>{c.name}{c.is_active ? "" : " (inactive)"}</option>)}</select></label>
        <label className="field-wide">Description<textarea name="description" value={values.description || ""} onChange={change} rows="5" placeholder="Tell customers about the design, inspiration and details."/></label>
        <label>Fabric<input name="fabric" value={values.fabric || ""} onChange={change} placeholder="e.g. Hand-dyed Adire"/></label>
        <label>Fit<input name="fit" value={values.fit || ""} onChange={change} placeholder="e.g. Relaxed fit"/></label>
        <label className="field-wide">Care instructions<input name="care_instructions" value={values.care_instructions || ""} onChange={change} placeholder="e.g. Gentle hand wash"/></label>
      </div></div>
      <div className="form-section"><h2>Product imagery</h2><p className="muted">JPEG, PNG or WebP. Maximum 5MB per image.</p>
        {(existingImages.length > 0 || files.length > 0) && <div className="image-preview-grid">
          {existingImages.map(img => <ProductImagePreview key={img.id} file={replacements[img.id]} url={img.image_url} label="Existing product image" busy={busy} onEdit={source => setImageEditor({ source, id: img.id })} onRemove={() => removeImage(img)}/>)}
          {files.map((file, index) => <ProductImagePreview key={`${index}-${file.name}`} file={file} label={`New product image ${index + 1}`} busy={busy} onEdit={source => setImageEditor({ source, index })} onRemove={() => setFiles(current => current.filter((_, i) => i !== index))}/>)}
        </div>}
        <label className="upload-zone"><UploadCloud size={25}/><strong>Select product images</strong><span>Choose one or more images from your device</span><input type="file" accept="image/jpeg,image/png,image/webp" multiple disabled={busy} onChange={e => { setFiles(Array.from(e.target.files || [])); e.target.value = ""; }}/></label>
      </div>
      <div className="form-section"><h2>Publishing</h2><div className="form-grid">
        <label>Status<select name="status" value={values.status} onChange={change}><option value="draft">Save as draft</option><option value="published">Publish on website</option><option value="archived">Archive</option></select></label>
        <label className="check-field"><input type="checkbox" name="is_featured" checked={Boolean(values.is_featured)} onChange={change}/> Feature this design on homepage</label>
      </div></div>
      <div className="form-actions"><Link className="button button-outline" to="/admin/products">Cancel</Link><button className="button button-dark" disabled={busy}>{busy ? "Saving…" : editing ? "Save changes" : "Create design"}</button></div>
    </form>
    {imageEditor && <ImageEditor source={imageEditor.source} onCancel={() => setImageEditor(null)} onApply={file => {
      if (imageEditor.id) setReplacements(current => ({ ...current, [imageEditor.id]: file }));
      else setFiles(current => current.map((item, index) => index === imageEditor.index ? file : item));
      setImageEditor(null);
    }}/>}
  </div>;
}
