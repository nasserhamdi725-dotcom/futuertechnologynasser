document.addEventListener('DOMContentLoaded', () => {
    const addProductForm = document.getElementById('add-product-form');
    const adminProductListBody = document.getElementById('admin-product-list');

    let adminProducts = [
        { product_id: 1, name: "Laptop Pro 15", price: 1999.99, stock_quantity: 50, category_id: 1, category_name: "Laptops" },
        { product_id: 2, name: "Smartphone X", price: 999.99, stock_quantity: 120, category_id: 2, category_name: "Smart Devices" },
        { product_id: 3, name: "Noise Cancelling Headphones", price: 249.99, stock_quantity: 75, category_id: 3, category_name: "Audio" }
    ];
    let nextProductId = Math.max(...adminProducts.map(p => p.product_id)) + 1;

    const renderAdminProductList = () => {
        adminProductListBody.innerHTML = '';
        adminProducts.forEach(product => {
            const row = adminProductListBody.insertRow();
            row.innerHTML = `
                <td>${product.product_id}</td>
                <td>${product.name}</td>
                <td>$$${product.price.toFixed(2)}</td>
                <td>${product.stock_quantity}</td>
                <td>${product.category_name}</td>
                <td class="action-buttons">
                    <button class="edit-btn" data-id="${product.product_id}">Edit</button>
                    <button class="delete-btn" data-id="${product.product_id}">Delete</button>
                </td>
            `;
            row.querySelector('.edit-btn').addEventListener('click', () => editProduct(product.product_id));
            row.querySelector('.delete-btn').addEventListener('click', () => deleteProduct(product.product_id));
        });
    };

    const addProduct = async (productData) => {
        console.log("Adding product:", productData);
        productData.product_id = nextProductId++;
        productData.category_name = document.getElementById('product-category').options[document.getElementById('product-category').selectedIndex].text;
        adminProducts.push(productData);
        renderAdminProductList();
        alert('Product added successfully!');
        addProductForm.reset();
    };

    const editProduct = async (productId) => {
        alert(`Initiating edit for Product ID: ${productId}. (Not fully implemented in this snippet)`);
        console.log("Editing product with ID:", productId);
    };

    const deleteProduct = async (productId) => {
        if (confirm(`Are you sure you want to delete product ID: ${productId}?`)) {
            console.log("Deleting product with ID:", productId);
            adminProducts = adminProducts.filter(p => p.product_id !== productId);
            renderAdminProductList();
            alert('Product deleted successfully!');
        }
    };

    addProductForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const newProduct = {
            name: document.getElementById('product-name').value,
            description: document.getElementById('product-description').value,
            price: parseFloat(document.getElementById('product-price').value),
            stock_quantity: parseInt(document.getElementById('product-stock').value),
            category_id: parseInt(document.getElementById('product-category').value),
            image_url: document.getElementById('product-image-url').value || 'https://via.placeholder.com/250x180/cccccc/333333?text=No+Image'
        };
        addProduct(newProduct);
    });

    // Initial render of products in admin view
    renderAdminProductList();
});