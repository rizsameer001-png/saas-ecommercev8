import { Outlet } from 'react-router-dom'
import GlobalNavbar from './GlobalNavbar'
import GlobalFooter from './GlobalFooter'

export default function RootLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <GlobalNavbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <GlobalFooter />
    </div>
  )
}
