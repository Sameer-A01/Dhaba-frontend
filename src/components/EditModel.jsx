import React, { useState, useRef } from 'react';
import { 
  X, 
  Search, 
  Plus, 
  Trash2, 
  Eye, 
  Package, 
  Calculator, 
  FileText, 
  Receipt, 
  Tag, 
  Save 
} from 'lucide-react';

const EditOrderModal = ({ 
  isEditModalOpen, 
  setIsEditModalOpen, 
  editingOrder, 
  editForm, 
  setEditForm,
  products,
  productSearch,
  setProductSearch,
  filteredProducts,
  handleEditFormChange,
  handleDiscountChange,
  handleNotesChange,
  addProductToEditForm,
  removeProductFromEditForm,
  saveOrderChanges,
  formatRupee
}) => {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const modalRef = useRef(null);
  const searchInputRef = useRef(null);

  // Calculate totals
  const subtotal = editForm.products.reduce((sum, item) => {
    const product = products.find(p => p._id === item.productId);
    return sum + (product ? product.price * item.quantity : 0);
  }, 0);

  const discountAmount = editForm.discount?.type === 'percentage' 
    ? (subtotal * (editForm.discount.value || 0)) / 100
    : editForm.discount?.value || 0;

  const total = Math.max(0, subtotal - discountAmount);

  if (!isEditModalOpen) return null;

  return (
    <>
      {/* Main Edit Modal */}
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-2">
        <div 
          ref={modalRef}
          className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="bg-gray-800 p-4 text-white">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <Receipt className="w-5 h-5 text-blue-300" />
                <div>
                  <h2 className="text-lg font-semibold">
                    Edit Order #{editingOrder?._id.slice(-6).toUpperCase()}
                  </h2>
                </div>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-gray-300 hover:text-white transition-colors"
                aria-label="Close modal"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="p-4 flex flex-col lg:flex-row gap-4 overflow-y-auto bg-gray-50">
            {/* Left: Product Selection */}
            <div className="flex-1 min-w-0">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                {/* Section Header */}
                <div className="bg-gray-100 p-3 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Package className="w-4 h-4 text-gray-600" />
                      <h3 className="text-sm font-medium text-gray-800">Order Items</h3>
                    </div>
                    <button
                      onClick={addProductToEditForm}
                      className="flex items-center gap-1 px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
                      aria-label="Add new item"
                    >
                      <Plus size={14} />
                      Add Item
                    </button>
                  </div>
                </div>

                <div className="p-3">
                  {/* Product Search */}
                  <div className="relative mb-3">
                    <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                      <Search className="text-gray-400" size={16} />
                    </div>
                    <input
                      ref={searchInputRef}
                      type="text"
                      placeholder="Search products..."
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      aria-label="Search products"
                    />
                    {productSearch.length > 0 && filteredProducts.length > 0 && (
                      <div className="absolute z-20 w-full mt-1 bg-white rounded shadow-lg border border-gray-200 max-h-48 overflow-y-auto text-xs">
                        {filteredProducts.map(product => (
                          <button
                            key={product._id}
                            className="w-full text-left px-3 py-2 text-gray-700 hover:bg-blue-50 flex justify-between items-center border-b border-gray-100 last:border-b-0"
                            onClick={() => {
                              setProductSearch('');
                              setEditForm({
                                ...editForm,
                                products: [...editForm.products, {
                                  productId: product._id,
                                  quantity: 1,
                                  price: product.price
                                }]
                              });
                            }}
                          >
                            <div>
                              <span className="font-medium">{product.name}</span>
                              <span className="text-gray-500 block">
                                {product.category?.name || 'N/A'}
                              </span>
                            </div>
                            <div className="text-right">
                              <span className="text-green-600 font-semibold">{formatRupee(product.price)}</span>
                              <span className="text-gray-400 block">{product.stock} in stock</span>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Product List */}
                  <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                    {editForm.products.length > 0 ? (
                      editForm.products.map((item, index) => {
                        const product = products.find(p => p._id === item.productId);
                        return (
                          <div
                            key={index}
                            className="bg-white border border-gray-200 rounded p-2 hover:border-blue-300"
                          >
                            <div className="flex items-center gap-2">
                              <div className="flex-1">
                                <select
                                  value={item.productId}
                                  onChange={(e) => handleEditFormChange(index, 'productId', e.target.value)}
                                  className="w-full p-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                                  aria-label={`Select product ${index + 1}`}
                                >
                                  <option value="">Select Product</option>
                                  {products.map(p => (
                                    <option key={p._id} value={p._id} disabled={p.stock === 0}>
                                      {p.name} ({formatRupee(p.price)})
                                    </option>
                                  ))}
                                </select>
                              </div>
                              <div className="flex items-center gap-1">
                                <input
                                  type="number"
                                  min="1"
                                  max={product ? product.stock : 999}
                                  value={item.quantity}
                                  onChange={(e) => handleEditFormChange(index, 'quantity', parseInt(e.target.value))}
                                  className="w-14 p-1.5 text-sm border border-gray-300 rounded text-center focus:ring-1 focus:ring-blue-500"
                                  aria-label={`Quantity for product ${index + 1}`}
                                />
                                <div className="text-right min-w-[60px]">
                                  <span className="text-xs font-semibold text-green-600">
                                    {product ? formatRupee(product.price * item.quantity) : 'N/A'}
                                  </span>
                                </div>
                                <button
                                  onClick={() => removeProductFromEditForm(index)}
                                  className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded"
                                  aria-label={`Remove product ${index + 1}`}
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-center py-4">
                        <Package className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                        <p className="text-gray-500 text-sm">No items added yet</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Discount, Notes, and Summary */}
            <div className="w-full lg:w-64 flex flex-col gap-3">
              {/* Discount Section */}
              <div className="bg-white rounded shadow-sm border border-gray-200 overflow-hidden">
                <div className="bg-gray-100 p-3 border-b border-gray-200">
                  <div className="flex items-center gap-2">
                    <Tag className="w-4 h-4 text-gray-600" />
                    <h3 className="text-sm font-medium text-gray-800">Discount</h3>
                  </div>
                </div>
                <div className="p-3 space-y-2">
                  <select
                    value={editForm.discount?.type || ''}
                    onChange={(e) => handleDiscountChange('type', e.target.value)}
                    className="w-full p-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                    aria-label="Discount type"
                  >
                    <option value="">No Discount</option>
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount</option>
                  </select>
                  <input
                    type="number"
                    placeholder="Discount value"
                    value={editForm.discount?.value || ''}
                    onChange={(e) => handleDiscountChange('value', parseFloat(e.target.value))}
                    className="w-full p-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100"
                    disabled={!editForm.discount?.type}
                    aria-label="Discount value"
                  />
                  <input
                    type="text"
                    placeholder="Reason for discount"
                    value={editForm.discount?.reason || ''}
                    onChange={(e) => handleDiscountChange('reason', e.target.value)}
                    className="w-full p-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100"
                    disabled={!editForm.discount?.type}
                    aria-label="Discount reason"
                  />
                </div>
              </div>

              {/* Notes Section */}
              <div className="bg-white rounded shadow-sm border border-gray-200 overflow-hidden">
                <div className="bg-gray-100 p-3 border-b border-gray-200">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-gray-600" />
                    <h3 className="text-sm font-medium text-gray-800">Order Notes</h3>
                  </div>
                </div>
                <div className="p-3">
                  <textarea
                    value={editForm.notes}
                    onChange={(e) => handleNotesChange(e.target.value)}
                    placeholder="Add special instructions..."
                    className="w-full p-1.5 text-sm border border-gray-300 rounded resize-y focus:ring-1 focus:ring-blue-500"
                    rows="2"
                    aria-label="Order notes"
                  />
                </div>
              </div>

              {/* Order Summary */}
              <div className="bg-white rounded shadow-sm border border-gray-200 overflow-hidden">
                <div className="bg-gray-800 p-3 text-white">
                  <div className="flex items-center gap-2">
                    <Calculator className="w-4 h-4 text-blue-300" />
                    <h3 className="text-sm font-medium">Order Summary</h3>
                  </div>
                </div>
                <div className="p-3 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal:</span>
                    <span className="font-medium">{formatRupee(subtotal)}</span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Discount:</span>
                      <span className="text-red-600 font-medium">-{formatRupee(discountAmount)}</span>
                    </div>
                  )}
                  <div className="border-t border-gray-200 pt-2">
                    <div className="flex justify-between">
                      <span className="font-semibold">Total:</span>
                      <span className="font-bold text-blue-600">{formatRupee(total)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 bg-gray-100 p-3">
            <div className="flex justify-between items-center">
              <button
                onClick={() => setIsPreviewOpen(true)}
                className="flex items-center gap-1 px-3 py-1.5 bg-gray-600 text-white rounded text-sm hover:bg-gray-700"
                aria-label="Preview updated bill"
              >
                <Eye size={14} />
                Preview
              </button>
              <div className="flex gap-2">
                <button
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-3 py-1.5 bg-gray-300 text-gray-700 rounded text-sm hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  onClick={saveOrderChanges}
                  className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:bg-blue-300"
                  disabled={editForm.products.every(p => !p.productId || p.quantity <= 0)}
                  aria-label="Save order changes"
                >
                  <Save size={14} />
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bill Preview Modal */}
      {isPreviewOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-2">
          <div className="bg-white rounded shadow-xl w-full max-w-md max-h-[85vh] overflow-hidden">
            {/* Preview Header */}
            <div className="bg-gray-800 p-4 text-white">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-blue-300" />
                  <h3 className="text-base font-semibold">Bill Preview</h3>
                </div>
                <button
                  onClick={() => setIsPreviewOpen(false)}
                  className="text-gray-300 hover:text-white"
                  aria-label="Close preview"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Preview Content */}
            <div className="p-4 overflow-y-auto">
              <div className="bg-white rounded p-4 border border-gray-200">
                <div className="mb-4 text-xs">
                  <p className="text-gray-600 mb-1">
                    <strong>Order ID:</strong> #{editingOrder?._id.slice(-6).toUpperCase()}
                  </p>
                  <p className="text-gray-600">
                    <strong>Date:</strong> {new Date().toLocaleString()}
                  </p>
                </div>

                <div className="overflow-x-auto mb-4 text-xs">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border border-gray-300 p-1.5 text-left font-medium">Product</th>
                        <th className="border border-gray-300 p-1.5 text-center font-medium">Qty</th>
                        <th className="border border-gray-300 p-1.5 text-right font-medium">Price</th>
                        <th className="border border-gray-300 p-1.5 text-right font-medium">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {editForm.products
                        .filter(p => p.productId)
                        .map((item, index) => {
                          const product = products.find(p => p._id === item.productId);
                          return (
                            <tr key={index}>
                              <td className="border border-gray-300 p-1.5">{product?.name || 'N/A'}</td>
                              <td className="border border-gray-300 p-1.5 text-center">{item.quantity}</td>
                              <td className="border border-gray-300 p-1.5 text-right">{formatRupee(product?.price || 0)}</td>
                              <td className="border border-gray-300 p-1.5 text-right font-medium text-green-600">
                                {formatRupee((product?.price || 0) * item.quantity)}
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>

                <div className="bg-gray-100 rounded p-3 space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal:</span>
                    <span className="font-medium">{formatRupee(subtotal)}</span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">
                        Discount {editForm.discount?.reason ? `(${editForm.discount.reason})` : ''}:
                      </span>
                      <span className="text-red-600 font-medium">-{formatRupee(discountAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between border-t border-gray-300 pt-1">
                    <span className="font-semibold">Total Amount:</span>
                    <span className="font-bold text-blue-600">{formatRupee(total)}</span>
                  </div>
                </div>

                {editForm.notes && (
                  <div className="mt-3 bg-gray-50 rounded p-2 text-xs">
                    <p className="text-gray-700">
                      <strong>Notes:</strong> {editForm.notes}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Preview Footer */}
            <div className="p-3 border-t border-gray-200 bg-gray-100 flex justify-end">
              <button
                onClick={() => setIsPreviewOpen(false)}
                className="px-3 py-1.5 bg-gray-600 text-white rounded text-sm hover:bg-gray-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default EditOrderModal;