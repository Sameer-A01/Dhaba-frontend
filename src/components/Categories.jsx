// Categories.jsx
import React, { useState, useEffect } from 'react';
import { PlusCircle, Edit, Trash2, Save, X, Search, Loader, AlertTriangle } from 'lucide-react';
import axiosInstance from '../utils/api';

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [filteredCategories, setFilteredCategories] = useState([]);
  const [formCategory, setFormCategory] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteConfirmation, setDeleteConfirmation] = useState({
    isOpen: false,
    id: null,
    name: ''
  });

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get("/category", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("ims_token")}`,
        },
      });
      if (response.data.success) {
        setCategories(response.data.categories);
        setFilteredCategories(response.data.categories);
      }
    } catch (error) {
      toast.error(error.message || 'Failed to fetch categories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formCategory.trim()) return;
    
    setSubmitting(true);
    try {
      if (editingId) {
        const response = await axiosInstance.put(`/category/${editingId}`, 
          { formCategory, formDescription },
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("ims_token")}`,
            },
          }
        );
        if (response.data.success) {
          toast.success('Category updated successfully');
          fetchCategories();
        }
        setEditingId(null);
      } else {
        // Add new category
        const token = localStorage.getItem("ims_token");
        const response = await axiosInstance.post("/category/add", 
          { formCategory, formDescription },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        if (response.data.success) {
          toast.success('Category added successfully');
          fetchCategories();
        }
      }
    } catch (error) {
      toast.error(error.message || 'Operation failed');
    } finally {
      setSubmitting(false);
      setFormCategory('');
      setFormDescription('');
    }
  };

  const handleSearchInput = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    setFilteredCategories(
      categories.filter((category) =>
        category.name.toLowerCase().includes(value.toLowerCase())
      )
    );
  };

  const openDeleteConfirmation = (id, name) => {
    setDeleteConfirmation({
      isOpen: true,
      id,
      name
    });
  };

  const closeDeleteConfirmation = () => {
    setDeleteConfirmation({
      isOpen: false,
      id: null,
      name: ''
    });
  };

 const handleDelete = async () => {
  try {
    const response = await axiosInstance.delete(`/category/${deleteConfirmation.id}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("ims_token")}`,
      },
    });
    if (response.data.success) {
      toast.success('Category deleted successfully');
      setCategories((prev) => prev.filter((category) => category._id !== deleteConfirmation.id));
      setFilteredCategories((prev) => prev.filter((category) => category._id !== deleteConfirmation.id));
      closeDeleteConfirmation();
    }
  } catch (error) {
    if (error.response) {
      // Show more detailed error message
      toast.error(error.response.data.error || 
                 error.response.data.message || 
                 'Failed to delete category');
      // Log additional info for debugging
      if (error.response.data.associatedProducts) {
        console.log('Associated products:', error.response.data.associatedProducts);
      }
    } else {
      toast.error(error.message || 'Failed to delete category');
    }
    closeDeleteConfirmation();
  } 
};

  const handleEdit = (category) => {
    setEditingId(category._id);
    setFormCategory(category.name);
    setFormDescription(category.description);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setFormCategory('');
    setFormDescription('');
  };

  // Toast notification component
  const toast = {
    success: (message) => alert(message), // Replace with your toast implementation
    error: (message) => alert(message)    // Replace with your toast implementation
  };

  return (
    <div className="container mx-auto px-4 md:px-6 py-6 bg-gray-50 min-h-screen">
      <div className="flex flex-col md:flex-row items-center justify-between mb-6 md:mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-4 md:mb-0">Category Management</h1>
        <div className="relative w-full md:w-64">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={handleSearchInput}
            placeholder="Search categories..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>
      
      <div className="flex flex-col lg:flex-row gap-6 md:gap-8">
        {/* Form Card */}
        <div className="w-full lg:w-1/3 order-2 lg:order-1">
          <div className="bg-white p-4 md:p-6 rounded-xl shadow-md border border-gray-100">
            <h2 className="text-xl font-semibold mb-4 md:mb-6 flex items-center text-gray-800">
              {editingId ? (
                <>
                  <Edit className="h-5 w-5 mr-2 text-yellow-500" />
                  Edit Category
                </>
              ) : (
                <>
                  <PlusCircle className="h-5 w-5 mr-2 text-blue-500" />
                  Add New Category
                </>
              )}
            </h2>
            
            <form onSubmit={handleSubmit} className="flex flex-col gap-4 md:gap-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category Name*
                </label>
                <input
                  type="text"
                  required
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  placeholder="Enter category name"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Category description (optional)"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows="3"
                />
              </div>
              
              <div className="flex gap-3 mt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className={`flex-1 flex items-center justify-center ${
                    editingId ? 'bg-yellow-500 hover:bg-yellow-600' : 'bg-blue-500 hover:bg-blue-600'
                  } text-white px-4 py-3 rounded-lg transition duration-200 ease-in-out`}
                >
                  {submitting ? (
                    <Loader className="h-5 w-5 animate-spin mr-2" />
                  ) : editingId ? (
                    <Save className="h-5 w-5 mr-2" />
                  ) : (
                    <PlusCircle className="h-5 w-5 mr-2" />
                  )}
                  {editingId ? 'Save Changes' : 'Add Category'}
                </button>
                
                {editingId && (
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="flex-1 flex items-center justify-center bg-gray-500 text-white px-4 py-3 rounded-lg hover:bg-gray-600 transition duration-200 ease-in-out"
                  >
                    <X className="h-5 w-5 mr-2" />
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>

        {/* Categories Table */}
        <div className="w-full lg:w-2/3 order-1 lg:order-2">
          <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
            <div className="p-4 md:p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-800">Categories List</h2>
            </div>
            
            {loading ? (
              <div className="flex items-center justify-center p-12">
                <Loader className="h-8 w-8 text-blue-500 animate-spin" />
                <span className="ml-2 text-gray-600">Loading categories...</span>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 md:px-6 py-3 md:py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                      <th className="px-3 md:px-6 py-3 md:py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                      <th className="px-3 md:px-6 py-3 md:py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Description</th>
                      <th className="px-3 md:px-6 py-3 md:py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredCategories.length > 0 ? (
                      filteredCategories.map((category, index) => (
                        <tr key={category._id} className={editingId === category._id ? 'bg-blue-50' : 'hover:bg-gray-50'}>
                          <td className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap text-sm text-gray-500">{index + 1}</td>
                          <td className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap text-sm font-medium text-gray-800">{category.name}</td>
                          <td className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap text-sm text-gray-500 hidden md:table-cell">
                            {category.description || '-'}
                          </td>
                          <td className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleEdit(category)}
                                disabled={editingId === category._id}
                                className={`inline-flex items-center px-2 md:px-3 py-1 md:py-1.5 border border-transparent text-xs font-medium rounded-md text-white ${
                                  editingId === category._id
                                    ? 'bg-gray-400 cursor-not-allowed'
                                    : 'bg-yellow-500 hover:bg-yellow-600'
                                } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 transition duration-200 ease-in-out`}
                              >
                                <Edit className="h-3 w-3 md:h-4 md:w-4 mr-1" />
                                <span className="hidden sm:inline">Edit</span>
                              </button>
                              <button
                                onClick={() => openDeleteConfirmation(category._id, category.name)}
                                className="inline-flex items-center px-2 md:px-3 py-1 md:py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-red-500 hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition duration-200 ease-in-out"
                              >
                                <Trash2 className="h-3 w-3 md:h-4 md:w-4 mr-1" />
                                <span className="hidden sm:inline">Delete</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="4" className="px-6 py-12 text-center text-sm text-gray-500">
                          {searchTerm ? (
                            <div className="flex flex-col items-center">
                              <Search className="h-8 w-8 text-gray-400 mb-2" />
                              <p>No categories found matching "{searchTerm}"</p>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center">
                              <PlusCircle className="h-8 w-8 text-gray-400 mb-2" />
                              <p>No categories found. Add your first category!</p>
                            </div>
                          )}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmation.isOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 animate-fade-in">
            <div className="text-center mb-6">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Delete Category</h3>
              <p className="text-sm text-gray-500">
                Are you sure you want to delete the category "<span className="font-semibold">{deleteConfirmation.name}</span>"? 
                This action cannot be undone.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row-reverse gap-3">
              <button
                type="button"
                onClick={handleDelete}
                className="w-full sm:w-auto inline-flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                <Trash2 className="h-4 w-4 mr-1.5" />
                Delete
              </button>
              <button
                type="button"
                onClick={closeDeleteConfirmation}
                className="w-full sm:w-auto inline-flex justify-center items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <X className="h-4 w-4 mr-1.5" />
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Categories;