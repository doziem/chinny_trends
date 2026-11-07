import { useEffect, useRef, useState } from "react";

export default function ImageEditor({ source, onApply, onCancel }) {
  const dialog = useRef(null);
  const canvas = useRef(null);
  const [image, setImage] = useState(null);
  const [rotation, setRotation] = useState(0);
  const [edges, setEdges] = useState({ left: 0, right: 0, top: 0, bottom: 0 });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const element = dialog.current;
    element.showModal();
    return () => element.close();
  }, []);

  useEffect(() => {
    const element = new Image();
    let active = true;
    element.crossOrigin = "anonymous";
    element.onload = () => { if (active) setImage(element); };
    element.onerror = () => { if (active) setError("Could not load this image for editing. The image host must allow cross-origin access."); };
    element.src = source;
    return () => { active = false; };
  }, [source]);

  useEffect(() => {
    if (!image) return;
    const target = canvas.current;
    const sideways = rotation % 180 !== 0;
    target.width = sideways ? image.naturalHeight : image.naturalWidth;
    target.height = sideways ? image.naturalWidth : image.naturalHeight;
    const context = target.getContext("2d");
    context.translate(target.width / 2, target.height / 2);
    context.rotate(rotation * Math.PI / 180);
    context.drawImage(image, -image.naturalWidth / 2, -image.naturalHeight / 2);
  }, [image, rotation]);

  async function apply() {
    setSaving(true);
    setError("");
    try {
      const sourceCanvas = canvas.current;
      const x = Math.floor(sourceCanvas.width * edges.left / 100);
      const y = Math.floor(sourceCanvas.height * edges.top / 100);
      const width = Math.max(1, Math.floor(sourceCanvas.width * (100 - edges.right) / 100) - x);
      const height = Math.max(1, Math.floor(sourceCanvas.height * (100 - edges.bottom) / 100) - y);
      const output = document.createElement("canvas");
      output.width = width;
      output.height = height;
      output.getContext("2d").drawImage(sourceCanvas, x, y, width, height, 0, 0, width, height);
      const blob = await new Promise((resolve, reject) => {
        try { output.toBlob(result => result ? resolve(result) : reject(new Error("Could not create the edited image.")), "image/jpeg", 0.9); }
        catch (err) { reject(err); }
      });
      if (blob.size > 5 * 1024 * 1024) throw new Error("The edited image exceeds 5MB. Crop it further before applying.");
      onApply(new File([blob], "edited-image.jpg", { type: "image/jpeg" }));
    } catch (err) {
      setError(err.name === "SecurityError" ? "This image cannot be edited because its host does not allow cross-origin access." : err.message || "Could not edit this image.");
    } finally { setSaving(false); }
  }

  return <dialog ref={dialog} className="image-editor" onCancel={e => { e.preventDefault(); if (!saving) onCancel(); }} aria-labelledby="image-editor-title">
    <h2 id="image-editor-title">Edit image</h2>
    <p className="muted">Rotate the image, then adjust each edge to crop. The highlighted area will be kept.</p>
    <div className="editor-preview" style={image ? { width: `min(100%, ${40 * (rotation % 180 ? image.naturalHeight / image.naturalWidth : image.naturalWidth / image.naturalHeight)}vh)` } : undefined}>
      <canvas ref={canvas} aria-label="Image preview"/>
      {image && <div className="editor-crop" style={{ left: `${edges.left}%`, right: `${edges.right}%`, top: `${edges.top}%`, bottom: `${edges.bottom}%` }}/>}
    </div>
    {error && <p role="alert">{error}</p>}
    <div className="editor-controls">
      {["left", "right", "top", "bottom"].map(edge => <label key={edge}>Crop {edge}: {edges[edge]}%
        <input type="range" min="0" max={edge === "left" ? 99 - edges.right : edge === "right" ? 99 - edges.left : edge === "top" ? 99 - edges.bottom : 99 - edges.top} value={edges[edge]} onChange={e => setEdges(current => ({ ...current, [edge]: Number(e.target.value) }))}/>
      </label>)}
    </div>
    <div className="editor-actions"><button type="button" className="button button-outline" disabled={!image || saving} onClick={() => { setRotation(value => (value + 90) % 360); setEdges({ left: 0, right: 0, top: 0, bottom: 0 }); }}>Rotate 90°</button><button type="button" className="button button-outline" disabled={saving} onClick={onCancel}>Cancel</button><button type="button" className="button button-dark" disabled={!image || saving} onClick={apply}>{saving ? "Applying…" : "Apply changes"}</button></div>
  </dialog>;
}
