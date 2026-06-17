import { Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import About from "./pages/About";
import CartPage from "./pages/CartPage";
import Home from "./pages/Home";
import LearnMore from "./pages/LearnMore";
import ProductPage from "./pages/ProductPage";
import Shop from "./pages/Shop";

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/home" element={<Home />} />
        <Route path="/shop" element={<Shop />} />
        <Route path="/about" element={<About />} />
        <Route path="/learn" element={<LearnMore />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/products/:slug" element={<ProductPage />} />
      </Routes>
    </Layout>
  );
}
