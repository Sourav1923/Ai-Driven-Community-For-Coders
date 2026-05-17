import React from 'react';
import ProductCard from '../components/ProductCard';
import Footer from '../components/Footer';

const PRODUCTS = [
  { id: 1, name: 'Premium Wireless Headphones', price: 199.99, image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500' },
  { id: 2, name: 'Minimalist Watch', price: 149.50, image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500' },
  { id: 3, name: 'Smart Fitness Tracker', price: 89.00, image: 'https://images.unsplash.com/photo-1575311373937-040b8e1fd5b6?w=500' },
  { id: 4, name: 'Leather Laptop Bag', price: 120.00, image: 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=500' },
  { id: 5, name: 'Mechanical Keyboard', price: 159.99, image: 'https://images.unsplash.com/photo-1511467687858-23d96c32e4ae?w=500' },
  { id: 6, name: 'Ergonomic Mouse', price: 79.00, image: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=500' }
];

const Home = () => {
  return (
    <div>
      <h1 style={{ marginBottom: '2rem' }}>Featured Products</h1>
      <div style={styles.grid}>
        {PRODUCTS.map(product => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
      <div>
         <Footer/>
      </div>
    </div>
  );
};

const styles = {
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
    gap: '2rem'
  }
};

export default Home;