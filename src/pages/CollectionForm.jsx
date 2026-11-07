import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, UploadCloud } from "lucide-react";
import toast from "react-hot-toast";
import { getCollectionById, saveCollection } from "../services/collectionService";
import ImageEditor from "../components/ImageEditor";

const initial = { name: "", slug: "", description: "", cover_image_url: "", is_featured: false, is_active: true };

export default function CollectionForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [values, setValues] = useState(initial);
  const [loading, setLoading] = useState(Boolean(id));
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState("");
  const [originalImageUrl, setOriginalImageUrl] = useState("");
  const [editingImage, setEditingImage] = useState(false);
  const fileInput = useRef(null);

  useEffect(() => {
    let active = true;
    setValues(initial);
    setImage(null);
    setOriginalImageUrl("");
    setError("");
    setLoading(Boolean(id));
    if (id) getCollectionById(id).then(data => {
      if (active) {
        setValues({ ...initial, ...data, description: data.description || "", cover_image_url: data.cover_image_url || "" });
        setOriginalImageUrl(data.cover_image_url || "");
      }
    }).catch(err => { if (active) setError(err.message || "Could not load collection."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id]);

  useEffect(() => {
    if (!image) { setPreview(""); return; }
    const url = URL.createObjectURL(image);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [image]);

  function change(e) {
    const { name, value, type, checked } = e.target;
    setValues(current => ({ ...current, [name]: type === "checkbox" ? checked : value }));
  }

  function chooseImage(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 5 * 1024 * 1024) {
      toast.error("Choose a JPEG, PNG or WebP image up to 5MB.");
      e.target.value = "";
      return;
    }
    setImage(file);
  }

  function removeImage() {
    setImage(null);
    setValues(current => ({ ...current, cover_image_url: "" }));
    if (fileInput.current) fileInput.current.value = "";
  }

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    try {
      const { cleanupError } = await saveCollection(values, id, image, originalImageUrl);
      toast.success(id ? "Collection updated." : "Collection created.");
      if (cleanupError) toast.error(`Collection saved, but the old cover image could not be removed: ${cleanupError.message}`);
      navigate("/admin/collections");
    } catch (err) { toast.error(err.message || "Could not save collection."); }
    finally { setBusy(false); }
  }

  return <div className="admin-content"><Link to="/admin/collections" className="back-link"><ArrowLeft size={16}/> Back to collections</Link><div className="admin-topline form-heading"><div><span className="eyebrow">CATALOGUE MANAGEMENT</span><h1>{id ? "Edit collection" : "Add a collection"}</h1><p>Give your collection a name and a story.</p></div></div>
    {loading ? <p className="muted">Loading collection…</p> : error ? <p role="alert">{error}</p> : <form className="product-form admin-panel" onSubmit={submit}>
      <div className="form-section"><h2>Collection information</h2><div className="form-grid collection-info-grid">
        <label>Collection name<input name="name" value={values.name} onChange={change} required maxLength="120"/></label>
        <label>URL slug<input name="slug" value={values.slug} onChange={change} required pattern="[a-z0-9]+(-[a-z0-9]+)*" placeholder="e.g. heritage-edit"/><small>Lowercase letters, numbers and hyphens. Changing it changes the collection link.</small></label>
        <label className="field-wide">Description<textarea name="description" value={values.description} onChange={change} rows="5"/></label>
      </div></div>
      <div className="form-section"><h2>Cover image</h2><p className="muted">JPEG, PNG or WebP. Maximum 5MB.</p>
        {(preview || values.cover_image_url) && <div className="collection-cover-preview"><img src={preview || values.cover_image_url} alt="Collection cover preview"/><button type="button" className="button button-outline" onClick={() => setEditingImage(true)} disabled={busy}>Edit image</button><button type="button" className="button button-outline" onClick={removeImage} disabled={busy}>Remove cover image</button></div>}
        <label className="upload-zone"><UploadCloud size={25}/><strong>Choose a cover image</strong><span>Select an image from your device</span><input ref={fileInput} type="file" accept="image/jpeg,image/png,image/webp" onChange={chooseImage} disabled={busy}/></label>
      </div>
      <div className="form-section"><h2>Visibility</h2><div className="form-grid">
        <label className="check-field"><input type="checkbox" name="is_active" checked={values.is_active} onChange={change}/> Show this collection on the website</label>
        <label className="check-field"><input type="checkbox" name="is_featured" checked={values.is_featured} onChange={change}/> Mark this collection as featured</label>
      </div></div>
      <div className="form-actions"><Link className="button button-outline" to="/admin/collections">Cancel</Link><button className="button button-dark" disabled={busy}>{busy ? "Saving…" : id ? "Save changes" : "Create collection"}</button></div>
    </form>}
    {editingImage && <ImageEditor source={preview || values.cover_image_url} onCancel={() => setEditingImage(false)} onApply={file => { setImage(file); setEditingImage(false); }}/>}
  </div>;
}
