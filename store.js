/*
==================================================================
MyStore Global JavaScript (store.js)
This file contains the product "database" and all helper
functions for the shopping cart and dataLayer.
==================================================================
*/

/* * =============================================
 * OUR PRODUCT DATABASE
 * (Based on the rich GA4/Google documentation)
 * =============================================
 */
const productDB = {
    "GADGET-001": {
        item_id: "GADGET-001",
        item_name: "The Classic Gadget",
        affiliation: "MyStore Online",
        coupon: "WINTERSALE",
        discount: 5.00,
        item_brand: "MyStore",
        item_category: "Audio",
        item_category2: "Headphones",
        item_category3: "On-Ear",
        item_variant: "Black",
        price: 99.99
    },
    "GADGET-PRO": {
        item_id: "GADGET-PRO",
        item_name: "The Gadget Pro",
        affiliation: "MyStore Online",
        coupon: "WINTERSALE",
        discount: 10.00,
        item_brand: "MyStore",
        item_category: "Audio",
        item_category2: "Headphones",
        item_category3: "Over-Ear",
        item_variant: "White",
        price: 149.99
    },
    "GADGET-MINI": {
        item_id: "GADGET-MINI",
        item_name: "The Gadget Mini",
        affiliation: "MyStore Online",
        coupon: "",
        discount: 0,
        item_brand: "MyStore",
        item_category: "Audio",
        item_category2: "Portable",
        item_category3: "Speaker",
        item_variant: "Blue",
        price: 49.99
    }
};

const promotionsDB = {
    "PROMO-SUMMER": {
        creative_name: "Summer Kick-off Banner",
        creative_slot: "homepage_hero_1",
        promotion_id: "PROMO-SUMMER",
        promotion_name: "Summer Kick-off"
    }
};

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

/**
 * Adds a full product object to the cart and dataLayer
 * @param {object} product - The full, rich product object from productDB
 * @param {string} listId - The 'item_list_id' (e.g., 'homepage_grid')
 * @param {string} listName - The 'item_list_name' (e.g., 'Homepage Product Grid')
 * @param {number} index - The 'index' of the item in that list
 */
function addItemToCart(product, listId, listName, index) {
    const cart = getCart();
    
    // Create the full item object for the cart/dataLayer
    const cartItem = {
        ...product, // Spreads in all keys from productDB
        item_list_id: listId,
        item_list_name: listName,
        index: index,
        quantity: 1 // Default quantity
    };

    // Check if item is already in cart
    const existingItemIndex = cart.findIndex(item => item.item_id === cartItem.item_id);

    if (existingItemIndex > -1) {
        // --- Item exists, update quantity ---
        cart[existingItemIndex].quantity += 1;
    } else {
        // --- Item is new, add it to cart ---
        cart.push(cartItem);
    }
    
    saveCart(cart); // Save new cart and update count

    // --- Push the 'add_to_cart' event to the dataLayer ---
    // We send *only* the item that was just added, not the whole cart
    console.log('add_to_cart event pushed to dataLayer:', cartItem);
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
        'event': 'add_to_cart',
        'ecommerce': {
            'currency': 'USD',
            'value': cartItem.price * cartItem.quantity,
            'items': [cartItem] // Send just the one item in the GA4 format
        }
    });

}

/**
 * Removes an item from the cart by its ID and fires the 'remove_from_cart' event
 * @param {string} itemId - The 'item_id' (e.g., 'GADGET-001')
 */
function removeItemFromCart(itemId) {
    let cart = getCart();
    let itemToRemove = null;

    // Find the item and get its data before removing
    const itemIndex = cart.findIndex(item => item.item_id === itemId);
    
    if (itemIndex > -1) {
        itemToRemove = cart[itemIndex]; // Get the item for the dataLayer
        
        // If quantity > 1, just decrease quantity. Otherwise, remove item.
        if (itemToRemove.quantity > 1) {
            cart[itemIndex].quantity -= 1;
        } else {
            cart.splice(itemIndex, 1); // Remove the item from the array
        }
    }

    if (itemToRemove) {
        saveCart(cart); // Save the updated cart

        // --- Push the 'remove_from_cart' event ---
        console.log('remove_from_cart event pushed:', itemToRemove);
        window.dataLayer = window.dataLayer || [];
        window.dataLayer.push({
            'event': 'remove_from_cart',
            'ecommerce': {
                'currency': 'USD',
                'value': itemToRemove.price, // Value of the single item removed
                'items': [{
                    item_id: itemToRemove.item_id,
                    item_name: itemToRemove.item_name,
                    item_brand: itemToRemove.item_brand,
                    item_category: itemToRemove.item_category,
                    item_variant: itemToRemove.item_variant,
                    price: itemToRemove.price,
                    quantity: 1 // We're removing 1 at a time
                }]
            }
        });
    }
}