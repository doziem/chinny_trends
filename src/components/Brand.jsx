import { Link } from "react-router-dom";
// import logo from "../asset/logo.jpeg";
import logo from "../asset/logo1.jpeg";

export function Brand({ light = false }) {
  return (
    <Link className={`brand ${light ? "brand-light" : ""}`} to="/">
      <span className="brand-logo">
        <img src={logo} alt="Chinny Trends" />
      </span>
      <span className="brand-name">Chinny Trends</span>
    </Link>
  );
}
