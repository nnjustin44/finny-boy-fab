import { Link, Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import About from "./pages/About";
import CartPage from "./pages/CartPage";
import CheckoutSuccessPage from "./pages/CheckoutSuccessPage";
import Contact from "./pages/Contact";
import CustomInquiry from "./pages/CustomInquiry";
import Home from "./pages/Home";
import LearnMore from "./pages/LearnMore";
import { CookiePolicy, PrivacyPolicy, TermsOfUse } from "./pages/Legal";
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
        <Route path="/contact" element={<Contact />} />
        <Route path="/custom-inquiry" element={<CustomInquiry />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/cookies" element={<CookiePolicy />} />
        <Route path="/terms" element={<TermsOfUse />} />
        <Route path="/checkout/success" element={<CheckoutSuccessPage />} />
        <Route path="/products/:slug" element={<ProductPage />} />
        <Route
          path="*"
          element={
            <section className="section page-section">
              <p className="eyebrow">Page not found</p>
              <h1>That page is not in the shop.</h1>
              <p>The link may be out of date, or the page may have moved.</p>
              <Link className="button primary" to="/">
                Return home
              </Link>
            </section>
          }
        />
      </Routes>
    </Layout>
  );
}
