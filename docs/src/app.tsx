import { useState, useEffect, useCallback, lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { Menu, X, Moon, Sun, Search, BookOpen } from 'lucide-react'
import { Sidebar } from './components/sidebar'

// Pages — lazy loaded
const GettingStarted = lazy(() => import('./pages/getting-started/index').then(m => ({ default: m.GettingStarted })))
const SigningIn = lazy(() => import('./pages/getting-started/signing-in').then(m => ({ default: m.SigningIn })))
const Navigation = lazy(() => import('./pages/getting-started/navigation').then(m => ({ default: m.Navigation })))
const Dashboard = lazy(() => import('./pages/dashboard/index').then(m => ({ default: m.Dashboard })))
const OrdersOverview = lazy(() => import('./pages/orders/index').then(m => ({ default: m.OrdersOverview })))
const CreatingOrders = lazy(() => import('./pages/orders/creating').then(m => ({ default: m.CreatingOrders })))
const OrderDetails = lazy(() => import('./pages/orders/details').then(m => ({ default: m.OrderDetails })))
const OrderFiltering = lazy(() => import('./pages/orders/filtering').then(m => ({ default: m.OrderFiltering })))
const AssigningUsers = lazy(() => import('./pages/orders/assigning').then(m => ({ default: m.AssigningUsers })))
const ProposalsOverview = lazy(() => import('./pages/proposals/index').then(m => ({ default: m.ProposalsOverview })))
const CreatingProposals = lazy(() => import('./pages/proposals/creating').then(m => ({ default: m.CreatingProposals })))
const ConvertingProposals = lazy(() => import('./pages/proposals/converting').then(m => ({ default: m.ConvertingProposals })))
const CustomersOverview = lazy(() => import('./pages/customers/index').then(m => ({ default: m.CustomersOverview })))
const CustomerDetails = lazy(() => import('./pages/customers/details').then(m => ({ default: m.CustomerDetails })))
const ManagingCustomers = lazy(() => import('./pages/customers/managing').then(m => ({ default: m.ManagingCustomers })))
const ProductsOverview = lazy(() => import('./pages/products/index').then(m => ({ default: m.ProductsOverview })))
const ProductConfigurations = lazy(() => import('./pages/products/configurations').then(m => ({ default: m.ProductConfigurations })))
const CartAndCheckout = lazy(() => import('./pages/products/cart').then(m => ({ default: m.CartAndCheckout })))
const PickListsOverview = lazy(() => import('./pages/picking/index').then(m => ({ default: m.PickListsOverview })))
const StartPicking = lazy(() => import('./pages/picking/creating').then(m => ({ default: m.StartPicking })))
const ShippingRatesAndLabels = lazy(() => import('./pages/picking/shipping').then(m => ({ default: m.ShippingRatesAndLabels })))
const ManagingPickLists = lazy(() => import('./pages/picking/managing').then(m => ({ default: m.ManagingPickLists })))
const TasksOverview = lazy(() => import('./pages/tasks/index').then(m => ({ default: m.TasksOverview })))
const CreatingTasks = lazy(() => import('./pages/tasks/creating').then(m => ({ default: m.CreatingTasks })))
const ManagingTasks = lazy(() => import('./pages/tasks/managing').then(m => ({ default: m.ManagingTasks })))
const SettingsOverview = lazy(() => import('./pages/settings/index').then(m => ({ default: m.SettingsOverview })))
const FieldConfiguration = lazy(() => import('./pages/settings/fields').then(m => ({ default: m.FieldConfiguration })))
const FilterPresets = lazy(() => import('./pages/settings/filters').then(m => ({ default: m.FilterPresets })))
const ShippingAddresses = lazy(() => import('./pages/settings/shipping').then(m => ({ default: m.ShippingAddresses })))
const UserManagement = lazy(() => import('./pages/settings/users').then(m => ({ default: m.UserManagement })))
const ShipmentsList = lazy(() => import('./pages/shipping/index').then(m => ({ default: m.ShipmentsList })))
const TrackingAndVoiding = lazy(() => import('./pages/shipping/tracking').then(m => ({ default: m.TrackingAndVoiding })))

function useDarkMode() {
  const [dark, setDark] = useState(() => {
    if (typeof window === 'undefined') return false
    const stored = localStorage.getItem('ebms-docs-dark')
    if (stored !== null) return stored === 'true'
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  })

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    localStorage.setItem('ebms-docs-dark', String(dark))
  }, [dark])

  return [dark, setDark] as const
}

export function App() {
  const [dark, setDark] = useDarkMode()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const closeSidebar = useCallback(() => setSidebarOpen(false), [])

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="fixed top-0 right-0 left-0 z-40 flex h-14 items-center border-b border-border bg-background/80 px-4 backdrop-blur-md lg:px-6">
        {/* Mobile hamburger */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="mr-3 flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground lg:hidden"
          aria-label="Toggle sidebar"
        >
          {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
        </button>

        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent text-primary-foreground">
            <BookOpen size={14} />
          </div>
          <span className="text-sm font-semibold tracking-tight">EBMS Docs</span>
        </div>

        <div className="flex-1" />

        {/* Search trigger */}
        <button className="mr-2 flex h-8 items-center gap-2 rounded-lg border border-border bg-muted/50 px-3 text-xs text-muted-foreground transition-colors hover:border-border hover:bg-muted">
          <Search size={14} />
          <span className="hidden sm:inline">Search docs...</span>
          <kbd className="ml-2 hidden rounded border border-border bg-background px-1.5 py-0.5 font-mono text-[10px] sm:inline">
            /
          </kbd>
        </button>

        {/* Dark mode toggle */}
        <button
          onClick={() => setDark(!dark)}
          className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label="Toggle dark mode"
        >
          {dark ? <Sun size={16} /> : <Moon size={16} />}
        </button>
      </header>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-14 bottom-0 left-0 z-30 w-[260px] overflow-y-auto border-r border-border bg-background transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <Sidebar onNavigate={closeSidebar} />
      </aside>

      {/* Main content */}
      <main className="pt-14 lg:pl-[260px]">
        <div className="mx-auto max-w-[720px] px-6 py-10 lg:px-8">
          <Suspense fallback={<div className="py-20 text-center text-sm text-muted-foreground">Loading...</div>}>
            <Routes>
              <Route path="/" element={<Navigate to="/getting-started" replace />} />
              <Route path="/getting-started" element={<GettingStarted />} />
              <Route path="/getting-started/signing-in" element={<SigningIn />} />
              <Route path="/getting-started/navigation" element={<Navigation />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/orders" element={<OrdersOverview />} />
              <Route path="/orders/creating" element={<CreatingOrders />} />
              <Route path="/orders/details" element={<OrderDetails />} />
              <Route path="/orders/filtering" element={<OrderFiltering />} />
              <Route path="/orders/assigning" element={<AssigningUsers />} />
              <Route path="/proposals" element={<ProposalsOverview />} />
              <Route path="/proposals/creating" element={<CreatingProposals />} />
              <Route path="/proposals/converting" element={<ConvertingProposals />} />
              <Route path="/customers" element={<CustomersOverview />} />
              <Route path="/customers/details" element={<CustomerDetails />} />
              <Route path="/customers/managing" element={<ManagingCustomers />} />
              <Route path="/products" element={<ProductsOverview />} />
              <Route path="/products/configurations" element={<ProductConfigurations />} />
              <Route path="/products/cart" element={<CartAndCheckout />} />
              <Route path="/picking" element={<PickListsOverview />} />
              <Route path="/picking/creating" element={<StartPicking />} />
              <Route path="/picking/shipping" element={<ShippingRatesAndLabels />} />
              <Route path="/picking/managing" element={<ManagingPickLists />} />
              <Route path="/tasks" element={<TasksOverview />} />
              <Route path="/tasks/creating" element={<CreatingTasks />} />
              <Route path="/tasks/managing" element={<ManagingTasks />} />
              <Route path="/settings" element={<SettingsOverview />} />
              <Route path="/settings/fields" element={<FieldConfiguration />} />
              <Route path="/settings/filters" element={<FilterPresets />} />
              <Route path="/settings/shipping" element={<ShippingAddresses />} />
              <Route path="/settings/users" element={<UserManagement />} />
              <Route path="/shipping" element={<ShipmentsList />} />
              <Route path="/shipping/tracking" element={<TrackingAndVoiding />} />
              <Route path="*" element={<Navigate to="/getting-started" replace />} />
            </Routes>
          </Suspense>

          {/* Footer */}
          <footer className="mt-20 border-t border-border pt-6 pb-10">
            <p className="text-xs text-text-tertiary">
              &copy; 2026 EBMS. All rights reserved.
            </p>
          </footer>
        </div>
      </main>
    </div>
  )
}
