import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import ProductCard from "../components/ProductCard";
import { getCollectionBySlug } from "../services/collectionService";
import { getProducts } from "../services/productService";

export default function CollectionDetails() {
  const { slug } = useParams();
  const [collection, setCollection] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    setCollection(null);
    setProducts([]);
    async function load() {
      try {
        const found = await getCollectionBySlug(slug);
        const designs = found ? await getProducts({ collection: found.id }) : [];
        if (active) { setCollection(found); setProducts(designs); }
      } catch (err) {
        if (active) setError(err.message || "Could not load collection.");
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => { active = false; };
  }, [slug]);

  return <><Navbar/><main className="shop-page container">
    <Link to="/collections" className="back-link"><ArrowLeft size={16}/> Back to collections</Link>
    {loading ? <p className="muted">Loading collection…</p> : error ? <p role="alert">Could not load collection: {error}</p> : !collection ? <div className="empty-state"><h1>Collection not found</h1><p>This collection may no longer be available.</p></div> : <>
      <div className="shop-intro"><span className="eyebrow">{collection.is_featured ? "FEATURED COLLECTION" : "COLLECTION"}</span><h1>{collection.name}</h1>{collection.description && <p>{collection.description}</p>}</div>
      {products.length ? <div className="product-grid">{products.map(product => <ProductCard key={product.id} product={product}/>)}</div> : <div className="empty-state"><p>There are no published designs in this collection yet.</p><Link to="/shop" className="under-link">Explore all designs</Link></div>}
    </>}
  </main><Footer/></>;
}
