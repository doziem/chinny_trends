import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, MessageCircle } from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { getProductBySlug } from "../services/productService";

export default function ProductDetails() {
  const { slug } = useParams();
  const [product, setProduct] = useState(null);
  const [selected, setSelected] = useState(0);
  const [error, setError] = useState("");

  useEffect(() => { getProductBySlug(slug).then(setProduct).catch(() => setError("This design could not be found.")); }, [slug]);

  if (error) return <><Navbar/><main className="container shop-page"><p>{error}</p><Link to="/shop" className="under-link">Back to designs</Link></main><Footer/></>;
  if (!product) return <><Navbar/><div className="page-loader">Loading design…</div><Footer/></>;

  const images = product.product_images || [];
  const phone = import.meta.env.VITE_WHATSAPP_NUMBER || "";
  const message = encodeURIComponent(`Hello, I am interested in ${product.name}. Please share more details.`);
  const waLink = phone ? `https://wa.me/${phone}?text=${message}` : `mailto:hello@asoatelier.com?subject=${encodeURIComponent("Enquiry: " + product.name)}&body=${message}`;

  return <><Navbar/><main className="container detail-page">
    <Link to="/shop" className="back-link"><ArrowLeft size={16}/> Back to collection</Link>
    <div className="detail-grid">
      <div className="detail-gallery"><div className="detail-main-image">{images[selected] ? <img src={images[selected].image_url} alt={images[selected].alt_text || product.name}/> : <div className="image-placeholder">ÀṢỌ</div>}</div>
        {images.length > 1 && <div className="detail-thumbs">{images.map((img, i) => <button key={img.id} className={selected === i ? "selected" : ""} onClick={() => setSelected(i)}><img src={img.image_url} alt={img.alt_text || `${product.name} ${i + 1}`}/></button>)}</div>}
      </div>
      <div className="detail-info"><span className="eyebrow">{product.categories?.name || "ÀṢỌ COLLECTION"}</span><h1>{product.name}</h1><strong className="detail-price">{new Intl.NumberFormat("en-NG", { style: "currency", currency: product.currency || "NGN", maximumFractionDigits: 0 }).format(product.price)}</strong><p className="detail-description">{product.description || "A considered design from the ÀṢỌ collection."}</p>
        <div className="detail-specs">{product.fabric && <div><span>FABRIC</span><strong>{product.fabric}</strong></div>}{product.fit && <div><span>FIT</span><strong>{product.fit}</strong></div>}{product.care_instructions && <div><span>CARE</span><strong>{product.care_instructions}</strong></div>}</div>
        <a className="button button-dark detail-contact" href={waLink} target={phone ? "_blank" : undefined} rel="noreferrer"><MessageCircle size={17}/> Enquire about this design</a><p className="detail-note">Contact our team for availability, sizing and ordering information.</p>
      </div>
    </div>
  </main><Footer/></>;
}
