document.addEventListener('DOMContentLoaded', () => {
    const cartItemsContainer = document.getElementById('cart-items-container');
    const cartSubtotalElement = document.getElementById('cart-subtotal');
    const cartSummaryElement = document.getElementById('cart-summary');
    const emptyCartMessage = document.getElementById('empty-cart-message');
    const cartCountHeader = document.getElementById('cart-count'); 

    const getCart = () => {
        return JSON.parse(localStorage.getItem('cart')) || [];
    };

    const saveCart = (cart) => {
        localStorage.setItem('cart', JSON.stringify(cart));
        updateCartCountHeader();
    };

    const updateCartCountHeader = () => {
        const cart = getCart();
        if (cartCountHeader) {
            cartCountHeader.textContent = cart.length;
        }
    };

    const renderCart = () => {
        const cart = getCart();
        cartItemsContainer.innerHTML = ''; 

        if (cart.length === 0) {
            emptyCartMessage.style.display = 'block';
            cartSummaryElement.style.display = 'none';
            cartSubtotalElement.textContent = '$0.00';
            return;
        } else {
            emptyCartMessage.style.display = 'none';
            cartSummaryElement.style.display = 'block';
        }

        cart.forEach(item => {
            const cartItemDiv = document.createElement('div');
            cartItemDiv.classList.add('cart-item');
            cartItemDiv.dataset.productId = item.product_id; 

            cartItemDiv.innerHTML = `
                <img src="${item.image_url}" alt="${item.name}">
                <div class="cart-item-details">
                    <h4>${item.name}</h4>
                    <p>Price: $$${item.price.toFixed(2)}</p>
                </div>
                <div class="cart-item-quantity">
                    <button class="decrease-quantity">-</button>
                    <input type="number" value="${item.quantity}" min="1" readonly>
                    <button class="increase-quantity">+</button>
                </div>
                <div class="cart-item-remove">
                    <button class="remove-item">Remove</button>
                </div>
            `;
            cartItemsContainer.appendChild(cartItemDiv);
        });
        calculateCartTotal();
        addCartEventListeners();
    };

    const calculateCartTotal = () => {
        const cart = getCart();
        const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        cartSubtotalElement.textContent = `$$${total.toFixed(2)}`;
    };

    const addCartEventListeners = () => {
        cartItemsContainer.querySelectorAll('.increase-quantity').forEach(button => {
            button.addEventListener('click', (e) => {
                const productId = e.target.closest('.cart-item').dataset.productId;
                updateQuantity(productId, 1);
            });
        });

        cartItemsContainer.querySelectorAll('.decrease-quantity').forEach(button => {
            button.addEventListener('click', (e) => {
                const productId = e.target.closest('.cart-item').dataset.productId;
                updateQuantity(productId, -1);
            });
        });

        cartItemsContainer.querySelectorAll('.remove-item').forEach(button => {
            button.addEventListener('click', (e) => {
                const productId = e.target.closest('.cart-item').dataset.productId;
                removeItem(productId);
            });
        });
    };

    const updateQuantity = (productId, change) => {
        let cart = getCart();
        const itemIndex = cart.findIndex(item => item.product_id == productId);

        if (itemIndex > -1) {
            cart[itemIndex].quantity += change;
            if (cart[itemIndex].quantity <= 0) {
                removeItem(productId);
            } else {
                saveCart(cart);
                renderCart();
            }
        }
    };

    const removeItem = (productId) => {
        let cart = getCart();
        cart = cart.filter(item => item.product_id != productId);
        saveCart(cart);
        renderCart();
    };

    const addProductToCart = (product) => {
        let cart = getCart();
        const existingItemIndex = cart.findIndex(item => item.product_id === product.product_id);

        if (existingItemIndex > -1) {
            cart[existingItemIndex].quantity += 1;
        } else {
            cart.push({
                product_id: product.product_id,
                name: product.name,
                price: product.price,
                image_url: product.image_url,
                quantity: 1
            });
        }
        saveCart(cart);
        alert(`${product.name} added to cart!`);
        updateCartCountHeader();
    };

    updateCartCountHeader();

    renderCart();

    document.getElementById('proceed-to-checkout-btn').addEventListener('click', () => {
        const cart = getCart();
        if (cart.length > 0) {
            alert('Proceeding to checkout! (This would redirect to a checkout page in a real app)');
        } else {
            alert('Your cart is empty!');
        }
    });

    window.addProductToCart = addProductToCart;
});
