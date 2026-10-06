import { createContext, useContext } from 'react'

export const GuideContext = createContext(null)

export function useGuide() {
  const value = useContext(GuideContext)
  if (!value) throw new Error('Guide is only available inside the page.')
  return value
}
