/* eslint-disable @typescript-eslint/no-empty-object-type */
// first copy theme color from https://ui.shadcn.com/themes
// then in chatgpt:
// PROMPT: convert this css to js object. don't convert css variable to cameCase

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type ColorState = {
  availableColors: {
    name: string
    root: {}
  }[]
  defaultColor: string
  userColor?: string
}
const availableColors = [
  {
    name: 'Blue',
    root: {
      '--background': '0 0% 100%',
      '--foreground': '20 14.3% 4.1%',
      '--card': '0 0% 100%',
      '--card-foreground': '20 14.3% 4.1%',
      '--popover': '0 0% 100%',
      '--popover-foreground': '20 14.3% 4.1%',
      '--primary': '210 100% 50%',
      '--primary-foreground': '0 0% 100%',
      '--secondary': '210 100% 50%',
      '--secondary-foreground': '0 0% 100%',
      '--muted': '210 40% 96%',
      '--muted-foreground': '25 5.3% 44.7%',
      '--accent': '210 100% 50%',
      '--accent-foreground': '0 0% 100%',
      '--destructive': '0 84.2% 60.2%',
      '--destructive-foreground': '60 9.1% 97.8%',
      '--border': '210 40% 96%',
      '--input': '210 40% 96%',
      '--ring': '210 100% 50%',
      '--radius': '0.5rem',
      '--chart-1': '210 100% 50%',
      '--chart-2': '210 100% 50%',
      '--chart-3': '200 100% 40%',
      '--chart-4': '180 100% 35%',
      '--chart-5': '220 100% 45%',
    },
  },
      {
      name: 'Gold',
      root: {
        '--background': '0 0% 100%',
        '--foreground': '20 14.3% 4.1%',
        '--card': '0 0% 100%',
        '--card-foreground': '20 14.3% 4.1%',
        '--popover': '0 0% 100%',
        '--popover-foreground': '20 14.3% 4.1%',
        '--primary': '47.9 95.8% 53.1%',
        '--primary-foreground': '26 83.3% 14.1%',
        '--secondary': '60 4.8% 95.9%',
        '--secondary-foreground': '24 9.8% 10%',
        '--muted': '60 4.8% 95.9%',
        '--muted-foreground': '25 5.3% 44.7%',
        '--accent': '60 4.8% 95.9%',
        '--accent-foreground': '24 9.8% 10%',
        '--destructive': '0 84.2% 60.2%',
        '--destructive-foreground': '60 9.1% 97.8%',
        '--border': '20 5.9% 90%',
        '--input': '20 5.9% 90%',
        '--ring': '20 14.3% 4.1%',
        '--radius': '0.5rem',
        '--chart-1': '12 76% 61%',
        '--chart-2': '173 58% 39%',
        '--chart-3': '197 37% 24%',
        '--chart-4': '43 74% 66%',
        '--chart-5': '27 87% 67%',
      },
    },
      {
      name: 'Green',
      root: {
        '--background': '0 0% 100%',
        '--foreground': '240 10% 3.9%',
        '--card': '0 0% 100%',
        '--card-foreground': '240 10% 3.9%',
        '--popover': '0 0% 100%',
        '--popover-foreground': '240 10% 3.9%',
        '--primary': '142.1 76.2% 36.3%',
        '--primary-foreground': '355.7 100% 97.3%',
        '--secondary': '240 4.8% 95.9%',
        '--secondary-foreground': '240 5.9% 10%',
        '--muted': '240 4.8% 95.9%',
        '--muted-foreground': '240 3.8% 46.1%',
        '--accent': '240 4.8% 95.9%',
        '--accent-foreground': '240 5.9% 10%',
        '--destructive': '0 84.2% 60.2%',
        '--destructive-foreground': '0 0% 98%',
        '--border': '240 5.9% 90%',
        '--input': '240 5.9% 90%',
        '--ring': '142.1 76.2% 36.3%',
        '--radius': '0.5rem',
        '--chart-1': '12 76% 61%',
        '--chart-2': '173 58% 39%',
        '--chart-3': '197 37% 24%',
        '--chart-4': '43 74% 66%',
        '--chart-5': '27 87% 67%',
      },
    },
      {
      name: 'Red',
      root: {
        '--background': '0 0% 100%',
        '--foreground': '0 0% 3.9%',
        '--card': '0 0% 100%',
        '--card-foreground': '0 0% 3.9%',
        '--popover': '0 0% 100%',
        '--popover-foreground': '0 0% 3.9%',
        '--primary': '0 72.2% 50.6%',
        '--primary-foreground': '0 85.7% 97.3%',
        '--secondary': '0 0% 96.1%',
        '--secondary-foreground': '0 0% 9%',
        '--muted': '0 0% 96.1%',
        '--muted-foreground': '0 0% 45.1%',
        '--accent': '0 0% 96.1%',
        '--accent-foreground': '0 0% 9%',
        '--destructive': '0 84.2% 60.2%',
        '--destructive-foreground': '0 0% 98%',
        '--border': '0 0% 89.8%',
        '--input': '0 0% 89.8%',
        '--ring': '0 72.2% 50.6%',
        '--radius': '0.5rem',
        '--chart-1': '12 76% 61%',
        '--chart-2': '173 58% 39%',
        '--chart-3': '197 37% 24%',
        '--chart-4': '43 74% 66%',
        '--chart-5': '27 87% 67%',
      },
    },
]
const initialState: ColorState = {
  availableColors,
  defaultColor: availableColors[0].name,
  userColor: undefined,
}
export const colorStore = create<ColorState>()(
  persist(() => initialState, {
    name: 'colorStore',
  })
)

export default function useColorStore(theme: string = 'light') {
  const colorState = colorStore()
  const getColor = () => {
    const userColor = colorState.availableColors.find(
      (t) => t.name === colorState.userColor
    )
    if (userColor) return userColor
    const defaultColor = colorState.availableColors.find(
      (t) => t.name === colorState.defaultColor
    )
    if (defaultColor) return defaultColor

    return colorState.availableColors[0]
  }

  const color = getColor()
  const cssColors: { [key: string]: string } = color.root
  return {
    availableColors,
    cssColors,
    color,
    getColor,
    setColor: (name: string, isUserColor?: boolean) => {
      colorStore.setState(
        isUserColor ? { userColor: name } : { defaultColor: name }
      )
    },
    updateCssVariables: () => {
      const color = getColor()
      const colors: { [key: string]: string } = color.root
      for (const key in colors) {
        document.documentElement.style.setProperty(key, colors[key])
      }
    },
  }
}
