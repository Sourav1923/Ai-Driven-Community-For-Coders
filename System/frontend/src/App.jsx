import React from 'react'
import AppRoutes from './routes/AppRoutes'
import { UserProvider } from './context/user.context'
import ErrorBoundary from './components/ErrorBoundary'
//Main App

const App = () => {
  return (
    <ErrorBoundary>
      <UserProvider>
        <AppRoutes />
      </UserProvider>
    </ErrorBoundary>
  )
}

export default App