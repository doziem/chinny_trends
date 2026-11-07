import { useEffect, useState } from "react";
import { ArrowDown, ArrowRight, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import ProductCard from "../components/ProductCard";
import { getProducts } from "../services/productService";
import homeImg from "../asset/p-3.jpeg";

export default function Home() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getProducts({ featuredOnly: true }).then(setProducts)
      .catch(console.error).finally(() => setLoading(false));
  }, []);

  return <>
    <Navbar/>
    <main>
      <section className="hero">
        <div className="hero-pattern"></div>
        <div className="container hero-content">
          <div className="hero-copy">
            <span className="eyebrow eyebrow-light"><Sparkles size={14}/> ROOTED IN CULTURE. MADE FOR NOW.</span>
            <h1>Wear your story.<br/><em>Own your</em> presence.</h1>
            <p>Contemporary African fashion, thoughtfully crafted to honour where we come from and express where we're going.</p>
            <div className="hero-actions"><Link className="button button-cream" to="/shop">Explore the collection <ArrowRight size={17}/></Link><a className="text-link-light" href="#story">Discover our story <ArrowDown size={15}/></a></div>
          </div>
          <div className="hero-art">
            <div className="hero-art-frame">
              {/* <img src="https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=1000&q=85" alt="Contemporary fashion editorial"/> */}
              <img src={homeImg} alt="Contemporary fashion editorial"/>
            </div>

            <div className="hero-stamp"><span>AFRICAN</span><strong>BY<br/>DESIGN</strong><span>EST. WITH PURPOSE</span></div>
            <span className="hero-side-note">CULTURE IN EVERY THREAD — 01 / 04</span>
          </div>
        </div>
        <div className="hero-bottom container"><span>CRAFTED WITH CULTURE</span><span>DESIGNED TO BE REMEMBERED</span><span>ENUGU · NIGERIA</span></div>
      </section>

      <section className="section container">
        <div className="section-heading"><div><span className="eyebrow">THE CURATED EDIT</span><h2>Pieces with <em>presence.</em></h2></div><Link className="under-link" to="/shop">View all designs <ArrowRight size={16}/></Link></div>
        {loading ? <p className="muted">Loading the collection…</p> : products.length ? <div className="product-grid">{products.slice(0, 4).map(p => <ProductCard key={p.id} product={p}/>)}</div> : <div className="empty-state"><p>Our next collection is being prepared.</p><Link to="/shop" className="under-link">Explore all designs <ArrowRight size={16}/></Link></div>}
      </section>

      <section className="story-section" id="story">
        <div className="container story-grid">
          <div className="story-image"><img src="https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=1000&q=85" alt="African-inspired fashion editorial"/><span>THE ART OF EXPRESSION</span></div>
          <div className="story-copy"><span className="eyebrow">MORE THAN WHAT YOU WEAR</span><h2>Culture is not a trend.<br/><em>It's our foundation.</em></h2>
            <p>At Chinny Trends Fashion World, we believe what you wear can tell a story. Inspired by the richness of African textiles and the confidence of modern silhouettes, our designs bring heritage and personal style together.</p>
            <p>From meaningful details to statement-making looks, each piece is an invitation to celebrate where you come from and express who you are today.</p>
            <Link className="button button-dark" to="/shop">Find your expression <ArrowRight size={16}/></Link></div>
        </div>
        <div className="container story-values" aria-label="Our values">
          <article><span>01</span><h3>Rooted in culture</h3><p>We celebrate the colours, textures and traditions that inspire African fashion.</p></article>
          <article><span>02</span><h3>Made with intention</h3><p>We value considered details and designs that feel as meaningful as they look.</p></article>
          <article><span>03</span><h3>Personal expression</h3><p>We believe style is yours to define, with pieces that help you show up confidently.</p></article>
        </div>
      </section>
      <section className="closing-cta"><div className="container"><span className="eyebrow eyebrow-light">YOUR NEXT STATEMENT STARTS HERE</span><h2>Make room for <em>remarkable.</em></h2><Link className="button button-cream" to="/shop">Discover the designs <ArrowRight size={16}/></Link></div></section>
    </main>
    <Footer/>
  </>;
}
