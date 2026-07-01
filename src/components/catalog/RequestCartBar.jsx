import React from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, ArrowRight } from 'lucide-react';
import { useRequestCart } from '../../contexts/RequestCartContext';

export default function RequestCartBar() {
  const { totalCount } = useRequestCart();

  return (
    <AnimatePresence>
      {totalCount > 0 && (
        <motion.div
          className="bundle-bar request-cart-bar"
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
        >
          <div className="bundle-bar__inner glass-panel">
            <div className="bundle-bar__info">
              <ShoppingCart size={22} />
              <span>
                <strong>{totalCount}</strong> request{totalCount !== 1 ? 's' : ''} in your cart
              </span>
            </div>
            <Link to="/cart" className="btn btn-primary">
              Open Request Cart <ArrowRight size={18} />
            </Link>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
