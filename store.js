/*
==================================================================
MyStore Global JavaScript (store.js)
This file contains the product "database" and all helper
functions for the shopping cart and dataLayer.
==================================================================
*/

/* * =============================================
 * OUR PRODUCT DATABASE
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
 * PUSH EXISTING USER DATA
 * (This runs immediately on script load)
 * =============================================
 */
function pushExistingUserData() {
    const userId = localStorage.getItem('loggedInUserId');
    const hashedEmail = localStorage.getItem('loggedInUserHashedEmail');

    if (userId && hashedEmail) {
        console.log('User is already logged in. Pushing user_id:', userId);
        window.dataLayer = window.dataLayer || [];
        window.dataLayer.push({
            'user_id': userId,
            'hashed_email': hashedEmail
        });
    }
}
// --- Run this immediately to make user_id available for the pageview ---
pushExistingUserData();


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
        // Update the value for the dataLayer push
        cartItem.quantity = cart[existingItemIndex].quantity; 
    } else {
        // --- Item is new, add it to cart ---
        cart.push(cartItem);
    }
    
    saveCart(cart); // Save new cart and update count

    // --- Push the 'add_to_cart' event to the dataLayer ---
    console.log('add_to_cart event pushed to dataLayer:', cartItem);
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
        'event': 'add_to_cart',
        'ecommerce': {
            'currency': 'USD',
            'value': cartItem.price, 
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
        itemToRemove = { ...cart[itemIndex] }; // Clone the item for the dataLayer
        
        if (cart[itemIndex].quantity > 1) {
            cart[itemIndex].quantity -= 1;
        } else {
            cart.splice(itemIndex, 1); // Remove the item from the array
        }
    }

    if (itemToRemove) {
        saveCart(cart); // Save the updated cart

        // --- Push the 'remove_from_cart' event ---
        itemToRemove.quantity = 1; 

        console.log('remove_from_cart event pushed:', itemToRemove);
        window.dataLayer = window.dataLayer || [];
        window.dataLayer.push({
            'event': 'remove_from_cart',
            'ecommerce': {
                'currency': 'USD',
                'value': itemToRemove.price, // Value of the single item removed
                'items': [itemToRemove] // Send just the one item (with quantity 1)
            }
        });
    }
}

/* * =============================================
 * (NEW) WISHLIST HELPER FUNCTIONS
 * =============================================
 */

// Function to get the wishlist from localStorage
function getWishlist() {
    const wishlist = localStorage.getItem('myStoreWishlist');
    return wishlist ? JSON.parse(wishlist) : [];
}

// Function to save the wishlist to localStorage
function saveWishlist(wishlist) {
    localStorage.setItem('myStoreWishlist', JSON.stringify(wishlist));
}

/**
 * Adds a full product object to the wishlist and dataLayer
 * @param {object} product - The full, rich product object from productDB
 */
function addItemToWishlist(product) {
    const wishlist = getWishlist();
    
    // Check if item is already in wishlist
    const existingItemIndex = wishlist.findIndex(item => item.item_id === product.item_id);

    if (existingItemIndex > -1) {
        // --- Item already exists ---
        alert('This item is already in your wishlist.');
    } else {
        // --- Item is new, add it to wishlist ---
        wishlist.push(product);
        saveWishlist(wishlist);
        alert('Item added to your wishlist!');

        // --- Push the 'add_to_wishlist' event to the dataLayer ---
        console.log('add_to_wishlist event pushed to dataLayer:', product);
        window.dataLayer = window.dataLayer || [];
        window.dataLayer.push({
            'event': 'add_to_wishlist',
            'ecommerce': {
                'currency': 'USD',
                'value': product.price,
                'items': [product] 
            }
        });
    }
}

/**
 * Removes an item from the wishlist by its ID
 * @param {string} itemId - The 'item_id' (e.g., 'GADGET-001')
 */
function removeItemFromWishlist(itemId) {
    let wishlist = getWishlist();
    const itemIndex = wishlist.findIndex(item => item.item_id === itemId);
    
    if (itemIndex > -1) {
        const itemToRemove = wishlist[itemIndex];
        wishlist.splice(itemIndex, 1); // Remove the item
        saveWishlist(wishlist); // Save the updated wishlist

        // (Optional but good practice) Push a 'remove_from_wishlist' event
        console.log('remove_from_wishlist event pushed:', itemToRemove);
        window.dataLayer = window.dataLayer || [];
        window.dataLayer.push({
            'event': 'remove_from_wishlist',
            'ecommerce': {
                'currency': 'USD',
                'value': itemToRemove.price,
                'items': [itemToRemove]
            }
        });
    }
}

/* * =============================================
 * (IMPROVED) GLOBAL EVENT LISTENERS
 * =============================================
 */

// --- NEW: Mock User Database for Login Simulation ---
// Moved outside the listener so it can be accessed by loginUser
const mockUsers = [
    { 
        email: 'jane.doe@example.com', 
        userId: 'cust_jd_1001', 
        hashedEmail: '8b7f8d6b8f8d6b8f8d6b8f8d6b8f8d6b8f8d6b8f8d6b8f8d6b8f8d6b8f8d'
    },
    { 
        email: 'mark.smith@gmail.com', 
        userId: 'cust_ms_1002', 
        hashedEmail: 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6'
    },
    { 
        email: 'tech_guru@yahoo.com', 
        userId: 'cust_tg_1003', 
        hashedEmail: 'f0e1d2c3b4a5f0e1d2c3b4a5f0e1d2c3b4a5f0e1d2c3b4a5f0e1d2c3b4a5'
    },
    { 
        email: 'new_buyer_25@outlook.com', 
        userId: 'cust_nb_1004', 
        hashedEmail: '1234567890abcdef1234567890abcdef1234567890abcdef1234567890'
    },
    { 
        email: 'commerce_fan@mystore.com', 
        userId: 'cust_cf_1005', 
        hashedEmail: 'fedcba0987654321fedcba0987654321fedcba0987654321fedcba098765'
    }
];

// --- NEW: Login Function ---
function loginUser() {
    const randomUser = mockUsers[Math.floor(Math.random() * mockUsers.length)];
    
    console.log(`Login button clicked! Simulating login for: ${randomUser.email}`);
    
    localStorage.setItem('loggedInUserId', randomUser.userId);
    localStorage.setItem('loggedInUserHashedEmail', randomUser.hashedEmail);

    window.dataLayer.push({ 
        'event': 'login', 
        'login_method': 'Email',
        'user_id': randomUser.userId,
        'hashed_email': randomUser.hashedEmail
    });
    
    // Reload the page to update the button text
    window.location.reload();
}

// --- NEW: Logout Function ---
function logoutUser() {
    console.log('Logout button clicked! Clearing user data.');
    
    localStorage.removeItem('loggedInUserId');
    localStorage.removeItem('loggedInUserHashedEmail');
    
    window.dataLayer.push({ 'event': 'logout' });
    
    // Reload the page to update the button text
    window.location.reload();
}

// --- NEW: Check Login State Function ---
function checkLoginState() {
    const loginButton = document.getElementById('loginBtn');
    const wishlistLink = document.getElementById('wishlistLink'); // Get the new link
    
    if (!loginButton) return; // Do nothing if no login button on page

    const userId = localStorage.getItem('loggedInUserId');
    
    if (userId) {
        // --- User IS logged in ---
        loginButton.textContent = 'Logout';
        loginButton.addEventListener('click', logoutUser);
        
        // --- (NEW) Show wishlist link ---
        if (wishlistLink) {
            wishlistLink.style.display = 'inline-block';
        }

    } else {
        // --- User IS NOT logged in ---
        loginButton.textContent = 'Login';
        loginButton.addEventListener('click', loginUser);
        
        // --- (NEW) Hide wishlist link ---
        if (wishlistLink) {
            wishlistLink.style.display = 'none';
        }
    }
}


// --- MODIFIED: Wait for DOM to be ready, then check state ---
document.addEventListener('DOMContentLoaded', function() {
    // This single function now handles all login/logout logic
    checkLoginState();
});