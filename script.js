document.addEventListener('DOMContentLoaded', () => {
    const productListContainer = document.getElementById('product-list');
    const homepageProductsSection = document.getElementById('homepage-products');
    const productDetailView = document.getElementById('product-detail-view');
    const detailImage = document.getElementById('detail-image');
    const detailName = document.getElementById('detail-name');
    const detailDescription = document.getElementById('detail-description');
    const detailPrice = document.getElementById('detail-price');
    const detailStock = document.getElementById('detail-stock');
    const backToProductsBtn = document.getElementById('back-to-products-btn');

    const products = [
        {
            product_id: 1,
            name: "Tower RGB Headphone",
            description: "Stand Anti-slip Base Headset Holder Rack",
            price: 99.99,
            stock_quantity: 25,
            category_id: 1,
            image_url: "https://panda-mousepads.com/cdn/shop/products/tower-rgb-headphone-stand-9_360x.jpg?v=1624719834"
        },
        {
            product_id: 2,
            name: "Gaming Laptop",
            description: "nspired by cybernetic enhancements often seen in sci-fi media",
            price: 999.99,
            stock_quantity: 120,
            category_id: 2,
            image_url: "https://www.bhphotovideo.com/cdn-cgi/image/fit=scale-down,width=500,quality=95/https://www.bhphotovideo.com/images/images500x500/msi_cyborg_15_a13vf_1483us_15_6_cyborg_15_gaming_1725574523_1846213.jpg"
        },
        {
            product_id: 3,
            name: "Noise Cancelling Headphones",
            description: "Over-ear headphones with superior sound and active noise cancellation. Immerse yourself in your music without distractions.",
            price: 249.99,
            stock_quantity: 75,
            category_id: 3,
            image_url: "https://panda-mousepads.com/cdn/shop/products/H446d5556aac14107a5feacaaed0fe38c3_480x.jpg?v=1623332393"
        },
        {
            product_id: 4,
            name: "Zime Wireless Earbuds ",
            description: "Gaming Earbuds 65ms Low Latency TWS Bluetooth Earphones with Microphone.",
            price: 179.99,
            stock_quantity: 80,
            category_id: 2,
            image_url: "https://panda-mousepads.com/cdn/shop/products/wireless-bluetooth-gaming-earbuds-headset-with-charging-case_360x.jpg?v=1621192304"
        },
        {
            product_id: 5,
            name: "Gaming Mouse RGB",
            description: "Ergonomic gaming mouse with customizable RGB lighting and high-precision sensor. Designed for competitive gaming.",
            price: 59.99,
            stock_quantity: 150,
            category_id: 4,
            image_url:"https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSh83top1hStEbhVKrxbElbMGJazBFGjAKJoQ&s"   
        }
    ];

    const fetchProducts = async () => {
        renderProductList(products);
    };

    const renderProductList = (productsToRender) => {
        productListContainer.innerHTML = ''; 
        productsToRender.forEach(product => {
            const productCard = document.createElement('div');
            productCard.classList.add('product-card');
            productCard.innerHTML = `
                <img src="${product.image_url}" alt="${product.name}">
                <h3>${product.name}</h3>
                <p>$$${product.price.toFixed(2)}</p>
                <button data-product-id="${product.product_id}">View Details</button>
            `;
            productCard.querySelector('button').addEventListener('click', () => showProductDetails(product.product_id));
            productListContainer.appendChild(productCard);
        });
    };

    const showProductDetails = (productId) => {
        const product = products.find(p => p.product_id === productId); 
        if (product) {
            detailImage.src = product.image_url;
            detailImage.alt = product.name;
            detailName.textContent = product.name;
            detailDescription.textContent = product.description;
            detailPrice.textContent = `$${product.price.toFixed(2)}`;
            detailStock.textContent = product.stock_quantity > 0 ? `${product.stock_quantity} in stock` : 'Out of Stock';

            homepageProductsSection.style.display = 'none';
            productDetailView.style.display = 'flex'; 
        }
    };

    backToProductsBtn.addEventListener('click', () => {
        productDetailView.style.display = 'none';
        homepageProductsSection.style.display = 'block';
    });

    fetchProducts();
});