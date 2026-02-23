import { Outlet } from 'react-router-dom'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import Navbar from '../components/Navbar'
import AuthenticatedNavbar from '../components/AuthenticatedNavbar'
import { useAuth } from '../hooks/useAuth'

const MainLayout = () => {
  const { user } = useAuth()

  return (
    <div className="min-h-screen bg-gray-100">
      {user ? <AuthenticatedNavbar /> : <Navbar />}
      <main className="container mx-auto px-4 py-8">
        <Outlet />
      </main>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
    </div>
  )
}

export default MainLayout 