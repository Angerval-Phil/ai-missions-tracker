import { AppProvider } from './context/AppContext'
import Header from './components/Header'
import Dashboard from './pages/Dashboard'

function App() {
  return (
    <AppProvider>
      <div className="min-h-screen bg-cream">
        <Header />
        <Dashboard />
      </div>
    </AppProvider>
  )
}

export default App
