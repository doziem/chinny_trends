import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import ProductCard from "../components/ProductCard";
import { getCategories, getProducts } from "../services/productService";
import { Search } from "lucide-react";

export default function Shop() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [category, setCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => { getCategories().then(setCategories).catch(console.error); }, []);
  useEffect(() => {
    setLoading(true);
    getProducts({ category, search }).then(setProducts).catch(console.error).finally(() => setLoading(false));
  }, [category, search]);

  return <><Navbar/><main className="shop-page container">
    <div className="shop-intro"><span className="eyebrow">THE CHINNY TREADS FASHION WORLD COLLECTION</span><h1>Find your <em>signature.</em></h1><p>Explore considered pieces inspired by the colour, craft and character of Africa.</p></div>
    <div className="shop-toolbar">
      <div className="category-pills"><button className={category === "all" ? "active" : ""} onClick={() => setCategory("all")}>All designs</button>{categories.map(c => <button key={c.id} className={category === c.id ? "active" : ""} onClick={() => setCategory(c.id)}>{c.name}</button>)}</div>
      <label className="search-box"><Search size={17}/><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search designs…"/></label>
    </div>
    {loading ? <p className="muted">Loading designs…</p> : products.length ? <div className="product-grid">{products.map(p => <ProductCard key={p.id} product={p}/>)}</div> : <div className="empty-state"><h3>No designs found</h3><p>Try another search or category.</p><button className="button button-dark" onClick={() => {setCategory("all");setSearch("");}}>Clear filters</button></div>}
  </main><Footer/></>;
}
