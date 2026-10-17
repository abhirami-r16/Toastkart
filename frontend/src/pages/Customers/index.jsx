const customers = [
  { name: "Sara Ahmed", email: "sara@example.com", orders: 5, spent: "₹320" },
  { name: "Imran Malik", email: "imran@example.com", orders: 2, spent: "₹90" },
  { name: "Zainab Noor", email: "zainab@example.com", orders: 8, spent: "₹640" },
];

function CustomersPage() {
  return (
    <div>
      <div className="page-header">
        <div>
          <p className="eyebrow">Customers</p>
          <h1>Keep your buyers engaged</h1>
        </div>
        <button className="btn btn-outline-primary">Export List</button>
      </div>

      <div className="row g-4 mt-2">
        {customers.map((customer) => (
          <div className="col-md-4" key={customer.email}>
            <div className="card shadow-sm h-100">
              <div className="card-body">
                <h5>{customer.name}</h5>
                <p className="text-muted mb-1">{customer.email}</p>
                <p className="mb-0">Orders: {customer.orders} · Spent: {customer.spent}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default CustomersPage;
