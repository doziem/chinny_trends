import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { getCollections } from "../services/collectionService";

export default function Collections() {
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    getCollections().then(data => { if (active) setCollections(data); })
      .catch(err => { if (active) setError(err.message || "Could not load collections."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  return <><Navbar/><main className="shop-page container">
    <div className="shop-intro"><span className="eyebrow">THE CURATED EDIT</span><h1>Explore our <em>collections.</em></h1><p>Discover designs brought together by a shared story.</p></div>
    {loading ? <p className="muted">Loading collections…</p> : error ? <p role="alert">Could not load collections: {error}</p> : collections.length ? <div className="collection-grid">{collections.map(collection =>
      <Link to={`/collections/${collection.slug}`} className="collection-card" key={collection.id}>
        <div className="collection-image">{collection.cover_image_url ? <img src={collection.cover_image_url} alt="" loading="lazy"/> : <div className="image-placeholder">CHINNY TRENDS</div>}{collection.is_featured && <span className="image-tag">FEATURED</span>}</div>
        <div className="collection-card-heading"><h2>{collection.name}</h2><ArrowUpRight size={20}/></div>
        {collection.description && <p>{collection.description}</p>}
      </Link>
    )}</div> : <div className="empty-state"><p>Our collections are being prepared.</p><Link to="/shop" className="under-link">Explore all designs</Link></div>}
  </main><Footer/></>;
}
