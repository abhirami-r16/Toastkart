import api from "./axios";

export const fetchStores = () => api.get('/stores');
export const fetchStoreOwners = () => api.get('/store-owners');
export const fetchUsers = () => api.get('/users');
export const toggleUserSubscriptionBypass = (userId, bypass) =>
    api.post(`/admin/users/${userId}/subscription-bypass`, { bypass });
export const fetchProducts = (ownerId) => ownerId ? api.get('/products', { params: { owner_id: ownerId } }) : api.get('/products');
export const fetchCategories = (ownerId) => ownerId ? api.get('/categories', { params: { owner_id: ownerId } }) : api.get('/categories');
export const fetchOrders = (storeId) => storeId ? api.get('/orders', { params: { store_id: storeId } }) : api.get('/orders');
export const fetchInventory = (ownerId) => ownerId ? api.get('/inventory', { params: { owner_id: ownerId } }) : api.get('/inventory');
