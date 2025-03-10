import React from 'react'
import AppRoutes from './routes/AppRoutes'
import { UserProvider } from './context/user.context'
//Main App

const App = () => {
  return (
    <UserProvider>
      <AppRoutes />
    </UserProvider>
  )
}

export default App