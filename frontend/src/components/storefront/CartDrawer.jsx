import { X, ShoppingCart, Trash2, Plus, Minus, ArrowRight } from 'lucide-react'
import { useSelector, useDispatch } from 'react-redux'
import { selectCartItems, selectCartTotal, updateCartItem, removeCartItem } from '../../store/cartSlice'
import { useNavigate } from 'react-router-dom'
import { useEffect } from 'react'

export default function CartDrawer({ isOpen, onClose, storeSlug, store }) {
  const items = useSelector(selectCartItems)
  const total = useSelector(selectCartTotal)
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const currency = store?.settings?.currencySymbol || '$'

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  const handleQuantity = (itemId, qty) => {
    if (qty < 1) return dispatch(removeCartItem({ storeSlug, itemId }))
    dispatch(updateCartItem({ storeSlug, itemId, quantity: qty }))
  }

  const goToCheckout = () => {
    onClose()
    navigate(`/store/${storeSlug}/checkout`)
  }

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50" onClick={onClose} />
      )}

      {/* Drawer */}
      <div className={`fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl z-50 flex flex-col transition-transform duration-300 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <ShoppingCart size={18} className="text-gray-700" />
            <h2 className="font-display font-bold text-gray-900">Your Cart</h2>
            {items.length > 0 && (
              <span className="bg-primary-100 text-primary-700 text-xs font-bold px-2 py-0.5 rounded-full">{items.length}</span>
            )}
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
            <X size={18} className="text-gray-500" />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 scrollbar-thin">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
                <ShoppingCart size={32} className="text-gray-400" />
              </div>
              <p className="font-display font-bold text-gray-700 text-lg">Your cart is empty</p>
              <p className="text-sm text-gray-500 mt-1">Add some products to get started</p>
              <button onClick={onClose} className="mt-6 btn-primary">Continue Shopping</button>
            </div>
          ) : (
            items.map((item) => (
              <div key={item._id} className="flex gap-3 bg-gray-50 rounded-2xl p-3">
                <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-white border border-gray-100">
                  {item.image ? (
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                      <ShoppingCart size={18} className="text-gray-400" />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">{item.name}</p>
                  {item.variantInfo && (
                    <p className="text-xs text-gray-500 mt-0.5">{item.variantInfo}</p>
                  )}
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-sm font-bold text-gray-900">
                      {currency}{(item.price * item.quantity).toFixed(2)}
                    </p>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleQuantity(item._id, item.quantity - 1)}
                        className="w-6 h-6 rounded-lg bg-white border border-gray-200 flex items-center justify-center hover:border-primary-400 transition-colors"
                      >
                        <Minus size={12} />
                      </button>
                      <span className="w-7 text-center text-sm font-semibold">{item.quantity}</span>
                      <button
                        onClick={() => handleQuantity(item._id, item.quantity + 1)}
                        className="w-6 h-6 rounded-lg bg-white border border-gray-200 flex items-center justify-center hover:border-primary-400 transition-colors"
                      >
                        <Plus size={12} />
                      </button>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => dispatch(removeCartItem({ storeSlug, itemId: item._id }))}
                  className="p-1.5 text-gray-300 hover:text-red-500 transition-colors self-start"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="p-5 border-t border-gray-100 space-y-3">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Subtotal</span>
              <span className="font-bold text-gray-900">{currency}{total.toFixed(2)}</span>
            </div>
            <p className="text-xs text-gray-400">Shipping & taxes calculated at checkout</p>
            <button onClick={goToCheckout} className="w-full btn-primary flex items-center justify-center gap-2 py-3">
              Checkout <ArrowRight size={16} />
            </button>
          </div>
        )}
      </div>
    </>
  )
}
