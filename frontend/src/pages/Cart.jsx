import React, { useState } from "react";
import Navbar from '../components/Navbar';
import CateNavbar from '../components/CategoryNavbar';
import Footer from '../components/Footer';







export default function Cart() {
  // Sample cart items (replace with data from backend or state management)
  const [cartItems, setCartItems] = useState([
    {
      id: 1,
      name: "Nike Air Zoom Pegasus 40",
      price: 120,
      quantity: 1,
      image:
        "https://static.nike.com/a/images/t_prod/w_960,c_limit,f_auto,q_auto/6d60e6d0-0e7a-4cc7-b601-c61f31f27e3b/air-zoom-pegasus-40-road-running-shoes.png",
    },
    {
      id: 2,
      name: "Nike Sportswear Club Hoodie",
      price: 65,
      quantity: 2,
      image:
        "https://static.nike.com/a/images/t_prod/w_960,c_limit,f_auto,q_auto/93bfbf2c-d432-4189-9d91-d9c6e246b9b4/sportswear-club-fleece-pullover-hoodie.png",
    },
  ]);

  // Update quantity
  const updateQuantity = (id, change) => {
    setCartItems((items) =>
      items.map((item) =>
        item.id === id
          ? { ...item, quantity: Math.max(1, item.quantity + change) }
          : item
      )
    );
  };

  // Remove item
  const removeItem = (id) => {
    setCartItems((items) => items.filter((item) => item.id !== id));
  };

  // Calculate total
  const totalPrice = cartItems.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );

  return (
     <>
      <Navbar />
      <CateNavbar/>
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-6">
      <div className="bg-white w-full max-w-4xl p-8 rounded-2xl shadow-md">
        {/* Nike-style Heading */}
        <h2 className="text-3xl font-extrabold text-center mb-8 tracking-tight">
          Shopping Cart
        </h2>

        {cartItems.length === 0 ? (
          <p className="text-center text-gray-600 text-lg">
            Your cart is empty.
          </p>
        ) : (
          <div className="space-y-6">
            {/* Cart Items */}
            {cartItems.map((item) => (
              <div
                key={item.id}
                className="flex flex-col md:flex-row items-center justify-between border-b pb-6"
              >
                <div className="flex items-center space-x-4">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-28 h-28 object-contain"
                  />
                  <div>
                    <h3 className="text-lg font-semibold">{item.name}</h3>
                    <p className="text-gray-600">${item.price.toFixed(2)}</p>
                  </div>
                </div>

                {/* Quantity & Remove */}
                <div className="flex items-center mt-4 md:mt-0 space-x-6">
                  <div className="flex items-center border rounded-md">
                    <button
                      onClick={() => updateQuantity(item.id, -1)}
                      className="px-3 py-1 text-lg hover:bg-gray-200"
                    >
                      -
                    </button>
                    <span className="px-4">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.id, 1)}
                      className="px-3 py-1 text-lg hover:bg-gray-200"
                    >
                      +
                    </button>
                  </div>
                  <button
                    onClick={() => removeItem(item.id)}
                    className="text-red-500 hover:text-red-700 font-medium"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}

            {/* Total Price */}
            <div className="flex justify-between items-center pt-6 border-t">
              <h3 className="text-xl font-semibold">Total</h3>
              <p className="text-xl font-bold">${totalPrice.toFixed(2)}</p>
            </div>

            {/* Checkout Button */}
            <button className="w-full mt-6 bg-black hover:bg-gray-900 text-white font-semibold py-4 rounded-md transition-colors duration-300">
              Checkout
            </button>
          </div>
        )}
      </div>
    </div>
      <Footer />
   </>
  );
}
