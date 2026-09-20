import React from "react";
import { Routes, Route } from "react-router-dom";
import StoreLayout from "./layouts/StoreLayout";
import Dashboard from "./pages/Dashboard";
import Stores from "./pages/Stores";
import Products from "./pages/Products";
import Inventory from "./pages/Inventory";
import Orders from "./pages/Orders";
import Customers from "./pages/Customers";
import Settings from "./pages/Settings";
import Plans from "./pages/Plans";

function App() {
  return (
    <Routes>
      <Route path="/plans" element={<Plans />} />
      <Route path="/" element={<StoreLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="stores" element={<Stores />} />
        <Route path="store/details" element={<Stores />} />
        <Route path="store/url" element={<Stores />} />
        <Route path="store/settings" element={<Stores />} />
        <Route path="products" element={<Products />} />
        <Route path="products/*" element={<Products />} />
        <Route path="inventory" element={<Inventory />} />
        <Route path="orders" element={<Orders />} />
        <Route path="customers" element={<Customers />} />
        <Route path="analytics" element={<Dashboard />} />
        <Route path="settings" element={<Settings />} />
      </Route>
    </Routes>
  );
}

export default App;