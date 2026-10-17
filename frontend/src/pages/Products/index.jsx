const products = [
  { name: "Aurora Jacket", price: "₹89", stock: 24, status: "In Stock" },
  { name: "Nova Headphones", price: "₹149", stock: 10, status: "Low Stock" },
  { name: "Luma Lamp", price: "₹69", stock: 0, status: "Out of Stock" },
];

function ProductsPage() {
  return (
    <div>
      <div className="page-header">
        <div>
          <p className="eyebrow">Products</p>
          <h1>Manage inventory and variants</h1>
        </div>
        <button className="btn btn-primary">Add Product</button>
      </div>

      <div className="card shadow-sm mt-3">
        <div className="table-responsive">
          <table className="table table-hover mb-0">
            <thead>
              <tr>
                <th>Product</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.name}>
                  <td>{product.name}</td>
                  <td>{product.price}</td>
                  <td>{product.stock}</td>
                  <td>{product.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default ProductsPage;
