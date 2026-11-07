import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";

export default function ProductCard({ product }) {
  const image = product.product_images?.[0]?.image_url;
  return <Link to={`/design/${product.slug}`} className="product-card">
    <div className="product-image-wrap">
      {image ? <img src={image} alt={product.name} loading="lazy"/> : <div className="image-placeholder">ÀṢỌ</div>}
      {product.is_featured && <span className="image-tag">EDITOR'S PICK</span>}
      <span className="product-arrow"><ArrowUpRight size={18}/></span>
    </div>
    <div className="product-card-meta">
      <div><h3>{product.name}</h3><p>{product.categories?.name || "ÀṢỌ Collection"}</p></div>
      <strong>{new Intl.NumberFormat("en-NG", { style: "currency", currency: product.currency || "NGN", maximumFractionDigits: 0 }).format(product.price || 0)}</strong>
    </div>
  </Link>;
}
