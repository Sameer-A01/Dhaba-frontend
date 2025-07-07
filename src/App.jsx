import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Summary from "./components/Summary";
import AuthProvider from "./context/AuthContext";
import Root from "./utils/Root";
import ProtectedRoute from "./utils/ProtectedRoute";
import Products from "./components/Products";
import Categories from "./components/Categories";
import Suppliers from "./components/Suppliers";
import Users from "./components/Users";
import Logout from "./components/Logout";
import EmployeeProducts from "./components/EmployeeProducts";
import Orders from "./components/Orders";
import Profile from "./components/Profile";
import Inventory from "./components/Inventory";
import InventorySupplier from "./components/InventorySupplier";
import Staff from "./components/Staff";
import Expense from "./components/Expense";
import Table from "./components/Table";
import KOTInterface from "./components/KOTInterface";
import ActiveKOTsPage from "./components/ActiveKOTsPage";
import Revenue from "./components/Revenue";
// import DeletionHistoryPage from "./components/DeletionHistoryPage";

const App = () => (
  <AuthProvider>
    <Router>
      <Routes>
        <Route path="/" element={<Root />} />
        <Route path="/login" element={<Login />} />

        {/* Admin & User Dashboard */}
        <Route
          path="/admin-dashboard"
          element={
            <ProtectedRoute requiredRole={["admin", "user"]}>
              <Dashboard />
            </ProtectedRoute>
          }
        >
          {/* Summary only for Admin */}
          <Route
            index
            element={
              <ProtectedRoute requiredRole={["admin"]}>
                <Summary />
              </ProtectedRoute>
            }
          />
          <Route
            path="products"
            element={
              <ProtectedRoute requiredRole={["admin", "user"]}>
                <Products />
              </ProtectedRoute>
            }
          />
          <Route
            path="categories"
            element={
              <ProtectedRoute requiredRole={["admin", "user"]}>
                <Categories />
              </ProtectedRoute>
            }
          />
          <Route
            path="supplier"
            element={
              <ProtectedRoute requiredRole={["admin", "user"]}>
                <Suppliers />
              </ProtectedRoute>
            }
          />
          <Route
            path="Table"
            element={
              <ProtectedRoute requiredRole={["admin", "user"]}>
                <Table />
              </ProtectedRoute>
            }
          />
          <Route
            path="kot/:roomId/:tableId"
            element={
              <ProtectedRoute requiredRole={["admin", "user"]}>
                <KOTInterface />
              </ProtectedRoute>
            }
          />
          <Route
            path="active-kots"
            element={
              <ProtectedRoute requiredRole={["admin", "user"]}>
                <ActiveKOTsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="orders"
            element={
              <ProtectedRoute requiredRole={["admin"]}>
                <Orders />
              </ProtectedRoute>
            }
          />
          <Route
            path="Revenue"
            element={
              <ProtectedRoute requiredRole={["admin"]}>
                <Revenue />
              </ProtectedRoute>
            }
          />
          <Route
            path="Inventory"
            element={
              <ProtectedRoute requiredRole={["admin"]}>
                <Inventory />
              </ProtectedRoute>
            }
          />
          <Route
            path="InventorySupplier"
            element={
              <ProtectedRoute requiredRole={["admin"]}>
                <InventorySupplier />
              </ProtectedRoute>
            }
          />
          <Route
            path="Staff"
            element={
              <ProtectedRoute requiredRole={["admin"]}>
                <Staff />
              </ProtectedRoute>
            }
          />
          <Route
            path="Expense"
            element={
              <ProtectedRoute requiredRole={["admin"]}>
                <Expense />
              </ProtectedRoute>
            }
          />
          <Route
            path="users"
            element={
              <ProtectedRoute requiredRole={["admin"]}>
                <Users />
              </ProtectedRoute>
            }
          />
          <Route
            path="profile"
            element={
              <ProtectedRoute requiredRole={["admin", "user"]}>
                <Profile />
              </ProtectedRoute>
            }
          />
        </Route>

        {/* Employee Dashboard */}
        <Route
          path="/employee-dashboard"
          element={
            <ProtectedRoute requiredRole={["user"]}>
              <Dashboard />
            </ProtectedRoute>
          }
        >
          <Route index element={<EmployeeProducts />} />
          <Route path="orders" element={<Orders />} />
          <Route path="profile" element={<Profile />} />
          <Route
            path="kot/:roomId/:tableId"
            element={
              <ProtectedRoute requiredRole={["user"]}>
                <KOTInterface />
              </ProtectedRoute>
            }
          />
          <Route
            path="active-kots"
            element={
              <ProtectedRoute requiredRole={["user"]}>
                <ActiveKOTsPage />
              </ProtectedRoute>
            }
          />
        </Route>

        <Route path="/logout" element={<Logout />} />
        <Route path="/unauthorized" element={<div>Unauthorized...</div>} />
      </Routes>
    </Router>
  </AuthProvider>
);

export default App;