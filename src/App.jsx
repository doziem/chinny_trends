import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Home from "./pages/Home";
import Shop from "./pages/Shop";
import ProductDetails from "./pages/ProductDetails";
import Login from "./pages/Login";
import Register from "./pages/Register";
import AdminLayout from "./pages/AdminLayout";
import Dashboard from "./pages/Dashboard";
import AdminProducts from "./pages/AdminProducts";
import ProductForm from "./pages/ProductForm";
import Collections from "./pages/Collections";
import CollectionDetails from "./pages/CollectionDetails";
import AdminCollections from "./pages/AdminCollections";
import CollectionForm from "./pages/CollectionForm";

function AdminIndex() {
  const { isOwner, loading } = useAuth();
  if (loading) return <div className="page-loader">Loading…</div>;
  return isOwner ? <Dashboard/> : <Navigate to="/" replace/>;
}

export default function App() {
  return <Routes>
    <Route path="/" element={<Home/>}/>
    <Route path="/shop" element={<Shop/>}/>
    <Route path="/collections" element={<Collections/>}/>
    <Route path="/collections/:slug" element={<CollectionDetails/>}/>
    <Route path="/design/:slug" element={<ProductDetails/>}/>
    <Route path="/login" element={<Login/>}/>
    <Route path="/register" element={<Register/>}/>
    <Route element={<ProtectedRoute ownerOnly/>}>
      <Route path="/admin" element={<AdminLayout/>}>
        <Route index element={<AdminIndex/>}/>
        <Route path="products" element={<AdminProducts/>}/>
        <Route path="products/new" element={<ProductForm/>}/>
        <Route path="products/:id/edit" element={<ProductForm/>}/>
        <Route path="collections" element={<AdminCollections/>}/>
        <Route path="collections/new" element={<CollectionForm/>}/>
        <Route path="collections/:id/edit" element={<CollectionForm/>}/>
      </Route>
    </Route>
    <Route path="*" element={<Navigate to="/" replace/>}/>
  </Routes>;
}
