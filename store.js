/*
==================================================================
MyStore Global JavaScript (store.js)
This file contains all helper functions for cart and dataLayer.
==================================================================
*/

/* * =============================================
 * CART HELPER FUNCTIONS (using localStorage)
 * =============================================
 */

// Function to get the cart from localStorage
function getCart() {
    const cart = localStorage.getItem('myStoreCart');
    return cart ? JSON.parse(cart) : [];
}

// Function to save the cart to localStorage
function saveCart(cart) {
    localStorage.setItem('myStoreCart', JSON.stringify(cart));
    updateCartCount();
}

// Function to update the cart count in the nav bar
function updateCartCount() {
    const cart = getCart();
    let totalItems = 0;
    cart.forEach(item => {
        totalItems += item.quantity;
    });
    
    const countElement = document.getElementById('cartCount');
    if (countElement) {
        countElement.textContent = totalItems;
    }
}

// Function to add an item to the cart
function addItemToCart(productData) {
    const cart = getCart();
    
    // Check if item is already in cart
    const existingItemIndex = cart.findIndex(item => item.item_id === productData.item_id);

    if (existingItemIndex > -1) {
        // --- Item exists, update quantity ---
        cart[existingItemIndex].quantity += productData.quantity;
    } else {
        // --- Item is new, add it to cart ---
        cart.push(productData);
    }
    
    saveCart(cart); // Save new cart and update count

    // --- Push the 'add_to_cart' event to the dataLayer ---
    // We send *only* the item that was just added, not the whole cart
    console.log('add_to_cart event pushed to dataLayer:', productData);
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
        'event': 'add_to_cart',
        'ecommerce': {
            'currency': 'USD',
            'value': productData.price * productData.quantity,
            'items': [productData] // Send just the one item
        }
    });

    alert(productData.item_name + ' added to cart!');
}