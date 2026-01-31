const productList = document.getElementById("product-list");
const cartItems = document.getElementById("cart-items");
const cartCount = document.getElementById("cart-count");
const cartTotal = document.getElementById("cart-total");

// Dynamically detect API URL
const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:4000'
  : `${window.location.protocol}//${window.location.hostname}${window.location.port ? ':' + window.location.port : ''}`;

let products = [];
let cart = [];

// Fetch products from database
async function fetchProducts() {
  try {
    const response = await fetch(`${API_URL}/api/v1/products/all`);
    const data = await response.json();
    
    if (response.ok && data.findProduct) {
      // Map database products to match our format
      products = data.findProduct.map(product => ({
        id: product._id,
        _id: product._id,
        name: product.title || product.name,
        title: product.title || product.name,
        price: product.price,
        img: product.img || product.image || 'https://images.unsplash.com/photo-1591047990366-ebc4de28526d?w=400&q=80'
      }));
      
      // Log products to console to see what's being fetched
      console.log('Products fetched:', products);
      
      displayProducts();
    } else {
      console.error('Failed to fetch products:', data);
      showCartNotification('❌ Failed to load products');
    }
  } catch (error) {
    console.error('Error fetching products:', error);
    showCartNotification('❌ Error loading products from database');
  }
}

// Load cart from localStorage
function loadCart() {
  const savedCart = localStorage.getItem('cart');
  if (savedCart) {
    try {
      cart = JSON.parse(savedCart);
    } catch (e) {
      cart = [];
    }
  }
  updateCart();
}

// Display products
function displayProducts() {
  productList.innerHTML = ''; // Clear existing products
  
  if (products.length === 0) {
    productList.innerHTML = '<p style="grid-column: 1/-1; text-align: center; padding: 20px;">Loading products...</p>';
    return;
  }
  
  products.forEach((product) => {
    const div = document.createElement("div");
    div.classList.add("product-item");
    div.innerHTML = `
      <img src="${product.img}" alt="${product.name}" style="width: 100%; height: 150px; object-fit: cover; margin-bottom: 10px; background: #4a4a4a;" onerror="this.style.background='#4a4a4a'; this.style.color='#d4af37'; this.textContent='✨';" />
      <h3>${product.name}</h3>
      <p>${product.name.substring(0, 40)}...</p>
      <div class="product-price">$${parseFloat(product.price).toFixed(2)}</div>
      <button onclick="addToCart('${product._id}')">Add to Cart</button>
    `;
    productList.appendChild(div);
  });
}

// Show notification
function showCartNotification(message) {
  const notification = document.createElement('div');
  
  // Determine color based on message
  let bgColor = '#1a1a1a';
  let textColor = '#d4af37';
  let borderColor = '#d4af37';
  
  if (message.includes('removed')) {
    bgColor = '#8b0000';
    textColor = '#ff4444';
    borderColor = '#ff4444';
  } else if (message.includes('added')) {
    bgColor = '#1a5d1a';
    textColor = '#4CAF50';
    borderColor = '#4CAF50';
  }
  
  notification.style.cssText = `
    position: fixed;
    top: 80px;
    right: 20px;
    background: ${bgColor};
    color: ${textColor};
    padding: 16px 24px;
    border-left: 4px solid ${borderColor};
    border-radius: 0;
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
    z-index: 1000;
    font-weight: 700;
    font-size: 13px;
    letter-spacing: 1px;
    text-transform: uppercase;
    animation: slideIn 0.3s ease-out;
  `;
  notification.textContent = message;
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.style.animation = 'slideOut 0.3s ease-out';
    setTimeout(() => notification.remove(), 300);
  }, 2000);
}

// Add to cart with proper formatting
function addToCart(id) {
  const product = products.find((p) => p._id === id || p.id === id);
  
  if (!product) {
    console.error('Product not found:', id);
    showCartNotification('❌ Product not found');
    return;
  }
  
  // Check if already in cart
  const existingItem = cart.find(item => (item._id === id || item.id === id));
  
  if (existingItem) {
    existingItem.quantity = (existingItem.quantity || 1) + 1;
  } else {
    cart.push({
      id: product._id || product.id,
      _id: product._id || product.id,
      title: product.name || product.title,
      price: product.price,
      img: product.img,
      quantity: 1
    });
  }
  
  // Save to localStorage
  localStorage.setItem('cart', JSON.stringify(cart));
  updateCart();
  
  // Show simple notification
  showCartNotification('✓ Item added to cart');
}

// Update cart display
function updateCart() {
  cartItems.innerHTML = "";
  let total = 0;

  if (cart.length === 0) {
    cartItems.innerHTML = '<li style="text-align: center; padding: 20px; color: #999;">Your cart is empty</li>';
  } else {
    // Add table header
    const headerLi = document.createElement("li");
    headerLi.innerHTML = `
      <div style="display: grid; grid-template-columns: 1fr 0.8fr 1.2fr 0.9fr 0.7fr; gap: 20px; padding: 12px 15px; background: #333; color: white; font-weight: bold; border-radius: 4px 4px 0 0; margin-bottom: 5px; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">
        <div style="padding-left: 5px;">Product</div>
        <div style="text-align: center;">Price</div>
        <div style="text-align: center;">Quantity</div>
        <div style="text-align: right; padding-right: 10px;">Subtotal</div>
        <div style="text-align: center;">Action</div>
      </div>
    `;
    cartItems.appendChild(headerLi);

    cart.forEach((item, index) => {
      const itemTotal = (item.price || 0) * (item.quantity || 1);
      total += itemTotal;
      const li = document.createElement("li");
      li.innerHTML = `
        <div style="display: grid; grid-template-columns: 1fr 0.8fr 1.2fr 0.9fr 0.7fr; gap: 20px; padding: 15px 15px; align-items: center; border-bottom: 1px solid #ddd; background: #fafafa; font-size: 14px;">
          <div style="font-weight: 500; color: #333; padding-left: 5px;">
            ${item.title || item.name}
          </div>
          <div style="text-align: center; color: #555;">
            $${(item.price || 0).toFixed(2)}
          </div>
          <div style="display: flex; align-items: center; justify-content: center; gap: 8px; background: white; padding: 6px 8px; border-radius: 4px; border: 1px solid #ddd;">
            <button onclick="decreaseQuantity(${index})" style="width: 28px; height: 28px; padding: 0; cursor: pointer; font-size: 20px; font-weight: bold; border: 1px solid #ccc; background: #f5f5f5; border-radius: 3px; transition: all 0.2s; color: #333;" title="Decrease">−</button>
            <span style="width: 35px; text-align: center; font-weight: bold; font-size: 16px;">${item.quantity || 1}</span>
            <button onclick="increaseQuantity(${index})" style="width: 28px; height: 28px; padding: 0; cursor: pointer; font-size: 20px; font-weight: bold; border: 1px solid #ccc; background: #f5f5f5; border-radius: 3px; transition: all 0.2s; color: #333;" title="Increase">+</button>
          </div>
          <div style="text-align: right; font-weight: bold; font-size: 15px; color: #222; padding-right: 10px;">
            $${itemTotal.toFixed(2)}
          </div>
          <div style="text-align: center;">
            <button onclick="removeFromCart(${index})" style="background: #ff4444; color: white; padding: 7px 12px; cursor: pointer; border: none; border-radius: 3px; font-size: 12px; font-weight: bold; transition: all 0.2s; width: 100%;" onmouseover="this.style.background='#cc0000'" onmouseout="this.style.background='#ff4444'">Remove</button>
          </div>
        </div>
      `;
      cartItems.appendChild(li);
    });
  }

  cartTotal.textContent = `Total: $${total.toFixed(2)}`;
  cartCount.textContent = cart.length;
}

// Remove item from cart
function removeFromCart(index) {
  cart.splice(index, 1);
  localStorage.setItem('cart', JSON.stringify(cart));
  updateCart();
  showCartNotification('✓ Item removed from cart');
}

// Increase quantity
function increaseQuantity(index) {
  if (cart[index]) {
    cart[index].quantity = (cart[index].quantity || 1) + 1;
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCart();
    showCartNotification('✓ Quantity updated');
  }
}

// Decrease quantity
function decreaseQuantity(index) {
  if (cart[index]) {
    if (cart[index].quantity > 1) {
      cart[index].quantity -= 1;
      localStorage.setItem('cart', JSON.stringify(cart));
      updateCart();
      showCartNotification('✓ Quantity updated');
    } else {
      removeFromCart(index);
    }
  }
}

// Slider
let slides = Array.from(document.querySelectorAll(".slide"));
let slideIndex = 0;

function showSlide(index) {
  slides.forEach((slide, i) => {
    slide.classList.toggle("active", i === index);
  });
}

function nextSlide() {
  slideIndex = (slideIndex + 1) % slides.length;
  showSlide(slideIndex);
}

function prevSlide() {
  slideIndex = (slideIndex - 1 + slides.length) % slides.length;
  showSlide(slideIndex);
}

//Auto slide
setInterval(nextSlide, 2000);

// Redirect to checkout to process Stripe payment
function redirectToCheckout() {
  // Check if cart is empty
  if (!cart || cart.length === 0) {
    showCartNotification("❌ Your cart is empty!");
    return;
  }

  // Check if user is logged in
  const token = localStorage.getItem('token');
  if (!token) {
    showCartNotification("❌ Please log in to checkout");
    setTimeout(() => {
      window.location.href = "/login.html";
    }, 500);
    return;
  }

  // Save cart to localStorage and redirect to checkout page for Stripe payment
  localStorage.setItem('cart', JSON.stringify(cart));
  window.location.href = '/checkout.html';
}

// Scroll to cart
function scrollToCart() {
  const cartSection = document.getElementById('cart');
  if (cartSection) {
    cartSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

// Logout function
function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('userId');
  // Keep cart - don't remove it
  window.location.href = 'login.html';
}

// Initialize page
window.addEventListener('DOMContentLoaded', () => {
  loadCart();
  fetchProducts();
  showSlide(slideIndex);
  
  // Add logout event listener
  const logoutBtn = document.getElementById('logout');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', logout);
  }
});

