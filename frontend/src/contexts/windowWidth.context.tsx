import { createContext, useContext, useEffect, useState } from "react";

const windowWidthContext = createContext(window.innerWidth)

export const useWindowWidthContext = () => {
  const ctx = useContext(windowWidthContext)
  return ctx
}

export const WindowWidthProvider = ({ children }: { children: React.ReactNode }) => {
  const [windowWidth, setWindowWidth] = useState(window.innerWidth)

  useEffect(() => {
    const updateWindowWidth = () => {
      setWindowWidth(window.innerWidth)
    }
    updateWindowWidth()    
    window.addEventListener('resize', updateWindowWidth)
    return () => window.removeEventListener('resize', updateWindowWidth)
  }, [])

  return (
    <windowWidthContext.Provider value={windowWidth}>
      {children}
    </windowWidthContext.Provider>
  )
}