"use client"

import { useState, useEffect } from "react"

// 创建一个钩子来确保代码只在客户端执行
export function useClientOnly() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return mounted
}
