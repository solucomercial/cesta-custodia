import { useSyncExternalStore, useCallback } from 'react'
import type { Product, CartItem } from './types'
import { calcularFrete, calcularFuespTax } from './types'

type CartListener = () => void

let cartItems: CartItem[] = []
let listeners: CartListener[] = []
const serverSnapshot: CartItem[] = []

function emitChange() {
  for (const listener of listeners) {
    listener()
  }
}

function subscribe(listener: CartListener) {
  listeners = [...listeners, listener]
  return () => {
    listeners = listeners.filter((l) => l !== listener)
  }
}

function getSnapshot(): CartItem[] {
  return cartItems
}

function getServerSnapshot(): CartItem[] {
  return serverSnapshot
}

export function addToCart(product: Product, quantity: number = 1) {
  const existing = cartItems.find((item) => item.product.id === product.id)
  if (existing) {
    cartItems = cartItems.map((item) =>
      item.product.id === product.id
        ? { ...item, quantity: item.quantity + quantity }
        : item
    )
  } else {
    cartItems = [...cartItems, { product, quantity }]
  }
  emitChange()
}

export function removeFromCart(productId: string) {
  cartItems = cartItems.filter((item) => item.product.id !== productId)
  emitChange()
}

export function updateQuantity(productId: string, quantity: number) {
  if (quantity <= 0) {
    removeFromCart(productId)
    return
  }
  cartItems = cartItems.map((item) =>
    item.product.id === productId ? { ...item, quantity } : item
  )
  emitChange()
}

export function clearCart() {
  cartItems = []
  emitChange()
}

export function useCart() {
  const items = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  const subtotal = items.reduce(
    (sum, item) => sum + Number(item.product.price) * item.quantity,
    0
  )
  const deliveryFee = calcularFrete(subtotal)
  const fuespTax = calcularFuespTax(subtotal)
  const total = subtotal + deliveryFee + fuespTax
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0)
  const hasMedicamentos = items.some(
    (item) => item.product.category === 'MEDICAMENTOS'
  )

  return {
    items,
    subtotal,
    deliveryFee,
    fuespTax,
    total,
    itemCount,
    hasMedicamentos,
    addToCart: useCallback(addToCart, []),
    removeFromCart: useCallback(removeFromCart, []),
    updateQuantity: useCallback(updateQuantity, []),
    clearCart: useCallback(clearCart, []),
  }
}
