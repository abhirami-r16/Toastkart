const orders = [
  { id: "#1001", customer: "Sara Ahmed", total: "₹180", status: "Paid" },
  { id: "#1002", customer: "Imran Malik", total: "₹96", status: "Processing" },
  { id: "#1003", customer: "Zainab Noor", total: "₹240", status: "Shipped" },
];

function OrdersPage() {
  return (
    <div>
      <div className="page-header">
        <div>
          <p className="eyebrow">Orders</p>
          <h1>Track and fulfill your sales</h1>
        </div>
      </div>

      <div className="card shadow-sm mt-3">
        <div className="table-responsive">
          <table className="table table-hover mb-0">
            <thead>
              <tr>
                <th>Order</th>
                <th>Customer</th>
                <th>Total</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id}>
                  <td>{order.id}</td>
                  <td>{order.customer}</td>
                  <td>{order.total}</td>
                  <td>{order.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default OrdersPage;
