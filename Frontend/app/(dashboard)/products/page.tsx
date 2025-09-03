'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Plus,
  Grid3X3,
  List,
  Edit2,
  Upload,
  X,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Search,
  Loader2,
  Package
} from 'lucide-react';
import Swal from 'sweetalert2';
import { productApiService, Product } from '@/services/productApiService';

interface ImageItem {
  id: string;
  url: string;
  isExisting: boolean;
  file?: File;
}

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState<{
    name: string;
    price: string;
    description: string;
  }>({
    name: '',
    price: '',
    description: ''
  });
  const [imageItems, setImageItems] = useState<ImageItem[]>([]);
  const itemsPerPage = 6;

  const loadProducts = useCallback(async (page: number = currentPage, search: string = searchQuery) => {
    setIsLoading(true);
    try {
      const response: any = search
        ? await productApiService.getProducts(page, itemsPerPage, search)
        : await productApiService.getProducts(page, itemsPerPage);

      console.log('API response:', response);
      setProducts(response?.data || []);
      setTotalPages(response?.totalPages || 1);
      setTotalProducts(response?.total || 0);
      setCurrentPage(response?.page || page);
    } catch (error) {
      console.error('Error loading products:', error);
      await Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to load products. Please try again.',
        customClass: { popup: 'rounded-lg' }
      });
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, searchQuery, itemsPerPage]);

  useEffect(() => {
    loadProducts(1, searchQuery);
  }, [searchQuery]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages && page !== currentPage) {
      setCurrentPage(page);
      loadProducts(page, searchQuery);
    }
  };

  const resetForm = () => {
    setFormData({ name: '', price: '', description: '' });
    // Clean up blob URLs
    imageItems.forEach(item => {
      if (!item.isExisting && item.url.startsWith('blob:')) {
        URL.revokeObjectURL(item.url);
      }
    });
    setImageItems([]);
    setEditingProduct(null);
  };

  const handleAddProduct = () => {
    resetForm();
    setShowModal(true);
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      price: product.price.toString(),
      description: product.description
    });

    // Convert existing images to ImageItem format - handle null/undefined images
    const productImages = product.images || [];
    const existingImages: ImageItem[] = productImages
      .filter(url => url && url.trim() !== '') // Filter out null/empty URLs
      .map((url, index) => ({
        id: `existing-${index}`,
        url,
        isExisting: true
      }));

    setImageItems(existingImages);
    setShowModal(true);
  };

  const handleDeleteProduct = async (product: Product) => {
    try {
      const result = await Swal.fire({
        title: 'Delete Product?',
        text: `Are you sure you want to delete "${product.name}"? This action cannot be undone.`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#EF4444',
        cancelButtonColor: '#6B7280',
        confirmButtonText: 'Yes, delete it!',
        cancelButtonText: 'Cancel',
        reverseButtons: true,
        customClass: {
          popup: 'rounded-lg',
          confirmButton: 'bg-red-500 hover:bg-red-600 text-white font-medium rounded-lg px-5 py-2 transition-colors',
          cancelButton: 'bg-gray-500 hover:bg-gray-600 text-white font-medium rounded-lg px-5 py-2 transition-colors'
        }
      });

      if (result.isConfirmed) {
        setIsLoading(true);
        const success = await productApiService.deleteProduct(product.id);

        if (success) {
          await Swal.fire({
            icon: 'success',
            title: 'Deleted!',
            text: 'Product has been deleted successfully.',
            timer: 2000,
            showConfirmButton: false,
            customClass: {
              popup: 'rounded-lg'
            }
          });

          // Reload products and adjust page if necessary
          const newTotalProducts = totalProducts - 1;
          const newTotalPages = Math.ceil(newTotalProducts / itemsPerPage);
          const adjustedPage = currentPage > newTotalPages ? Math.max(newTotalPages, 1) : currentPage;

          setTotalProducts(newTotalProducts);
          setTotalPages(newTotalPages);
          loadProducts(adjustedPage, searchQuery);
        } else {
          throw new Error('Failed to delete product');
        }
      }
    } catch (error) {
      console.error('Error deleting product:', error);
      await Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to delete product. Please try again.',
        customClass: {
          popup: 'rounded-lg'
        }
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Enhanced Validation
    const validationErrors = [];

    if (!formData.name.trim()) validationErrors.push('Product name is required');
    if (formData.name.trim().length > 255) validationErrors.push('Product name must be less than 255 characters');
    if (!formData.price.trim()) validationErrors.push('Price is required');
    if (!formData.description.trim()) validationErrors.push('Description is required');
    if (formData.description.trim().length > 1000) validationErrors.push('Description must be less than 1000 characters');

    const price = parseFloat(formData.price);
    if (formData.price.trim() && (isNaN(price) || price < 0)) {
      validationErrors.push('Price must be a valid positive number');
    }
    if (price > 999999.99) {
      validationErrors.push('Price cannot exceed $999,999.99');
    }

    if (validationErrors.length > 0) {
      await Swal.fire({
        icon: 'error',
        title: 'Validation Errors',
        html: `<ul class="text-left text-sm">\n${validationErrors.map(error => `<li>• ${error}</li>`).join('\n')}\n</ul>`,
        customClass: { popup: 'rounded-lg' }
      });
      return;
    }

    setIsSubmitting(true);

    try {
      let result;

      if (editingProduct) {
        // For editing, always use FormData to handle image management
        const form = new FormData();
        form.append('name', formData.name.trim());
        form.append('price', formData.price);
        form.append('description', formData.description.trim());

        // Add existing images that should be kept
        const existingImages = imageItems
          .filter(item => item.isExisting)
          .map(item => item.url);

        form.append('existingImages', JSON.stringify(existingImages));

        // Add new image files
        imageItems
          .filter(item => !item.isExisting && item.file)
          .forEach((item) => {
            if (item.file) {
              form.append('images', item.file);
            }
          });

        result = await productApiService.updateProduct(editingProduct.id, form);

        await Swal.fire({
          icon: 'success',
          title: 'Updated!',
          text: 'Product has been updated successfully.',
          timer: 2000,
          showConfirmButton: false,
          customClass: { popup: 'rounded-lg' },
        });
      } else {
        // Create new product - always use FormData
        const form = new FormData();
        form.append('name', formData.name.trim());
        form.append('price', formData.price);
        form.append('description', formData.description.trim());

        // Add image files for new product
        imageItems
          .filter(item => item.file)
          .forEach((item) => {
            if (item.file) {
              form.append('images', item.file);
            }
          });

        result = await productApiService.createProduct(form);
        await Swal.fire({
          icon: 'success',
          title: 'Created!',
          text: 'Product has been created successfully.',
          timer: 2000,
          showConfirmButton: false,
          customClass: { popup: 'rounded-lg' },
        });
      }

      console.log('Created/Updated product:', result);
      setShowModal(false);
      resetForm();
      loadProducts(currentPage, searchQuery);
    } catch (error: any) {
      console.error('Error saving product:', error);

      let errorMessage = 'Failed to save product. Please try again.';
      let errorTitle = 'Error';

      // Handle specific error types
      if (error?.response) {
        const status = error.response.status;
        const data = error.response.data;

        switch (status) {
          case 400:
            errorTitle = 'Invalid Data';
            errorMessage = data?.message || 'Please check your input and try again.';
            break;
          case 401:
            errorTitle = 'Authentication Error';
            errorMessage = 'Please log in again to continue.';
            break;
          case 413:
            errorTitle = 'File Too Large';
            errorMessage = 'One or more images are too large. Please use smaller images.';
            break;
          case 422:
            errorTitle = 'Validation Error';
            errorMessage = data?.message || 'Please check your input data.';
            break;
          case 500:
            errorTitle = 'Server Error';
            errorMessage = 'Server is experiencing issues. Please try again later.';
            break;
          default:
            errorMessage = data?.message || errorMessage;
        }
      } else if (error?.message) {
        errorMessage = error.message;
      }

      await Swal.fire({
        icon: 'error',
        title: errorTitle,
        text: errorMessage,
        customClass: { popup: 'rounded-lg' },
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const filesArray = Array.from(files);
      const maxFileSize = 10 * 1024 * 1024; // 10MB
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      const maxImages = 5; // Maximum number of images per product

      // Check total image limit
      if (imageItems.length + filesArray.length > maxImages) {
        Swal.fire({
          icon: 'warning',
          title: 'Too Many Images',
          text: `You can only have a maximum of ${maxImages} images per product.`,
          customClass: { popup: 'rounded-lg' }
        });
        e.target.value = '';
        return;
      }

      // Validate files
      const validFiles: File[] = [];
      const errors: string[] = [];

      filesArray.forEach(file => {
        if (file.size > maxFileSize) {
          errors.push(`${file.name} is too large (max 10MB)`);
          return;
        }
        if (!allowedTypes.includes(file.type)) {
          errors.push(`${file.name} is not a valid image file`);
          return;
        }
        validFiles.push(file);
      });

      // Show errors if any
      if (errors.length > 0) {
        Swal.fire({
          icon: 'warning',
          title: 'Upload Errors',
          html: `<ul class="text-left text-sm">\n${errors.map(error => `<li>• ${error}</li>`).join('\n')}\n</ul>`,
          customClass: { popup: 'rounded-lg' }
        });
      }

      if (validFiles.length > 0) {
        // Create new ImageItems for uploaded files
        const newImageItems: ImageItem[] = validFiles.map((file, index) => ({
          id: `new-${Date.now()}-${index}`,
          url: URL.createObjectURL(file),
          isExisting: false,
          file
        }));

        setImageItems(prev => [...prev, ...newImageItems]);

        // Show success message
        if (validFiles.length === 1) {
          console.log('Image uploaded successfully');
        } else {
          console.log(`${validFiles.length} images uploaded successfully`);
        }
      }
    }

    // Reset input value to allow re-uploading the same file
    e.target.value = '';
  };

  const removeImage = (id: string) => {
    setImageItems(prev => {
      const item = prev.find(item => item.id === id);
      // Clean up blob URL if it's a new upload
      if (item && !item.isExisting && item.url.startsWith('blob:')) {
        URL.revokeObjectURL(item.url);
      }
      return prev.filter(item => item.id !== id);
    });
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const pages = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return (
      <div className="flex items-center justify-between mt-8">
        <p className="text-sm text-gray-700">
          Showing {Math.min(((currentPage - 1) * itemsPerPage) + 1, totalProducts)} to {Math.min(currentPage * itemsPerPage, totalProducts)} of {totalProducts} results
        </p>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1 || isLoading}
            className="p-2 rounded-md border border-gray-300 text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            aria-label="Previous page"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          {startPage > 1 && (
            <>
              <button
                onClick={() => handlePageChange(1)}
                disabled={isLoading}
                className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors disabled:opacity-50"
              >
                1
              </button>
              {startPage > 2 && <span className="text-gray-500">...</span>}
            </>
          )}

          {pages.map(page => (
            <button
              key={page}
              onClick={() => handlePageChange(page)}
              disabled={isLoading}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors disabled:opacity-50 ${currentPage === page
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
                }`}
            >
              {page}
            </button>
          ))}

          {endPage < totalPages && (
            <>
              {endPage < totalPages - 1 && <span className="text-gray-500">...</span>}
              <button
                onClick={() => handlePageChange(totalPages)}
                disabled={isLoading}
                className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors disabled:opacity-50"
              >
                {totalPages}
              </button>
            </>
          )}

          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages || isLoading}
            className="p-2 rounded-md border border-gray-300 text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            aria-label="Next page"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  };

  const closeModal = () => {
    // Clean up blob URLs when closing modal
    imageItems.forEach(item => {
      if (!item.isExisting && item.url.startsWith('blob:')) {
        URL.revokeObjectURL(item.url);
      }
    });
    setShowModal(false);
    resetForm();
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Products</h1>
          <p className="text-gray-600 mt-2">Manage your product inventory</p>
        </div>
        <div className="flex items-center space-x-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={handleSearch}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64"
            />
          </div>

          {/* View toggle */}
          <div className="flex items-center bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'
                }`}
              aria-label="Grid view"
            >
              <Grid3X3 className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-md transition-colors ${viewMode === 'list' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'
                }`}
              aria-label="List view"
            >
              <List className="h-4 w-4" />
            </button>
          </div>

          <button
            onClick={handleAddProduct}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Product
          </button>
        </div>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <span className="ml-2 text-gray-600">Loading products...</span>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && products.length === 0 && (
        <div className="text-center py-12">
          <div className="w-24 h-24 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <Package className="h-12 w-12 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchQuery ? 'No products found' : 'No products yet'}
          </h3>
          <p className="text-gray-600 mb-6">
            {searchQuery
              ? `No products match "${searchQuery}". Try a different search term.`
              : 'Get started by adding your first product.'
            }
          </p>
          {!searchQuery && (
            <button
              onClick={handleAddProduct}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Product
            </button>
          )}
        </div>
      )}

      {/* Products grid/list */}
      {!isLoading && products.length > 0 && (
        <>
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {products.map((product) => {
                const hasImages = product.images && product.images.length > 0 && product.images[0];
                return (
                  <div key={product.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-200 group">
                    {hasImages ? (
                      <div className="relative overflow-hidden">
                        <img
                          src={product.images[0]}
                          alt={product.name}
                          className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-200"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            target.parentElement?.classList.add('hidden');
                          }}
                        />
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="flex space-x-1">
                            <button
                              onClick={() => handleEditProduct(product)}
                              className="p-2 bg-white rounded-full shadow-md hover:bg-gray-50 transition-colors"
                              aria-label="Edit product"
                            >
                              <Edit2 className="h-4 w-4 text-gray-600" />
                            </button>
                            <button
                              onClick={() => handleDeleteProduct(product)}
                              className="p-2 bg-white rounded-full shadow-md hover:bg-red-50 transition-colors"
                              aria-label="Delete product"
                            >
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="relative h-48 bg-gray-100 flex items-center justify-center">
                        <div className="text-center">
                          <Package className="h-16 w-16 text-gray-400 mx-auto mb-2" />
                          <p className="text-sm text-gray-500">No image</p>
                        </div>
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="flex space-x-1">
                            <button
                              onClick={() => handleEditProduct(product)}
                              className="p-2 bg-white rounded-full shadow-md hover:bg-gray-50 transition-colors"
                              aria-label="Edit product"
                            >
                              <Edit2 className="h-4 w-4 text-gray-600" />
                            </button>
                            <button
                              onClick={() => handleDeleteProduct(product)}
                              className="p-2 bg-white rounded-full shadow-md hover:bg-red-50 transition-colors"
                              aria-label="Delete product"
                            >
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                    <div className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="text-lg font-semibold text-gray-900 line-clamp-1">{product.name}</h3>
                      </div>
                      <p className="text-2xl font-bold text-blue-600 mb-2">${product.price}</p>
                      <p className="text-gray-600 text-sm line-clamp-2">{product.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden mb-8">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Product
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Price
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Description
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {products.map((product) => {
                      const hasImages = product.images && product.images.length > 0 && product.images[0];
                      return (
                        <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              {hasImages ? (
                                <img
                                  src={product.images[0]}
                                  alt={product.name}
                                  className="h-12 w-12 rounded-lg object-cover mr-4"
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.style.display = 'none';
                                  }}
                                />
                              ) : (
                                <div className="h-12 w-12 rounded-lg bg-gray-100 flex items-center justify-center mr-4">
                                  <Package className="h-6 w-6 text-gray-400" />
                                </div>
                              )}
                              <div>
                                <div className="text-sm font-medium text-gray-900">{product.name}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-bold text-blue-600">${product.price}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-600 max-w-xs truncate">{product.description}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <div className="flex items-center justify-end space-x-2">
                              <button
                                onClick={() => handleEditProduct(product)}
                                className="text-blue-600 hover:text-blue-800 p-1 rounded transition-colors"
                                aria-label="Edit product"
                              >
                                <Edit2 className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteProduct(product)}
                                className="text-red-600 hover:text-red-800 p-1 rounded transition-colors"
                                aria-label="Delete product"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Pagination */}
          {renderPagination()}
        </>
      )}

      {/* Product Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 transition-opacity bg-black bg-opacity-50"
              onClick={closeModal}
              aria-hidden="true"
            />

            <div className="inline-block w-full max-w-2xl p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-lg">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">
                  {editingProduct ? 'Edit Product' : 'Add New Product'}
                </h3>
                <button
                  onClick={closeModal}
                  className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label="Close modal"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Product Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    placeholder="Enter product name"
                    required
                    maxLength={255}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Price <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.price}
                    onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    placeholder="0.00"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    placeholder="Enter product description"
                    required
                    maxLength={1000}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Images
                  </label>

                  {/* Image Upload Area */}
                  <div className={`border-2 border-dashed rounded-lg p-6 transition-all duration-200 ${imageItems.length >= 5
                      ? 'border-gray-200 bg-gray-50'
                      : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'
                    }`}>
                    <input
                      type="file"
                      multiple
                      accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                      onChange={handleImageUpload}
                      className="hidden"
                      id="imageUpload"
                      disabled={imageItems.length >= 5}
                    />
                    <label
                      htmlFor="imageUpload"
                      className={`flex flex-col items-center ${imageItems.length >= 5
                          ? 'cursor-not-allowed opacity-50'
                          : 'cursor-pointer'
                        }`}
                    >
                      <Upload className="h-10 w-10 text-gray-400 mb-3" />
                      <span className="text-sm font-medium text-gray-700 mb-1">
                        {imageItems.length >= 5 ? 'Maximum images reached' : 'Click to upload images'}
                      </span>
                      <span className="text-xs text-gray-500 text-center">
                        {imageItems.length >= 5
                          ? 'Remove some images to add more'
                          : `PNG, JPG, GIF, WebP up to 10MB\n(${imageItems.length}/5 images)`
                        }
                      </span>
                    </label>
                  </div>

                  {/* Image Previews */}
                  {imageItems.length > 0 && (
                    <div className="mt-4">
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {imageItems.map((item) => (
                          <div key={item.id} className="relative group">
                            <div className="relative">
                              <img
                                src={item.url}
                                alt="Product preview"
                                className="w-full h-24 object-cover rounded-lg border"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  const parent = target.parentElement;
                                  if (parent) {
                                    parent.innerHTML = `
                                      <div class="w-full h-24 bg-gray-100 rounded-lg border flex items-center justify-center">
                                        <div class="text-center">
                                          <svg class="h-8 w-8 text-gray-400 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                          </svg>
                                          <p class="text-xs text-gray-500">Error loading</p>
                                        </div>
                                      </div>
                                    `;
                                  }
                                }}
                              />

                              {/* Image type indicator */}
                              <div className="absolute top-1 left-1">
                                <span className={`text-xs px-1.5 py-0.5 rounded text-white font-medium ${item.isExisting ? 'bg-green-500' : 'bg-blue-500'
                                  }`}>
                                  {item.isExisting ? 'Current' : 'New'}
                                </span>
                              </div>

                              {/* Remove button */}
                              <button
                                type="button"
                                onClick={() => removeImage(item.id)}
                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1.5 hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-all duration-200 shadow-lg"
                                aria-label="Remove image"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>

                      
                    </div>
                  )}
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={closeModal}
                    disabled={isSubmitting}
                    className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        {editingProduct ? 'Updating...' : 'Creating...'}
                      </>
                    ) : (
                      <>
                        {editingProduct ? 'Update' : 'Add'} Product
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}