"use client"

import * as React from "react"
import { Minus, Plus } from "lucide-react"
import { cn } from "@/lib/utils"

interface NumberInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type" | "onChange"> {
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
}

const NumberInput = React.forwardRef<HTMLInputElement, NumberInputProps>(
  ({ className, min, max, step = 1, onChange, ...props }, ref) => {
    const inputRef = React.useRef<HTMLInputElement>(null)
    const resolvedRef = (ref as React.RefObject<HTMLInputElement>) || inputRef

    function adjust(dir: 1 | -1) {
      const el = resolvedRef.current
      if (!el) return
      const s = Number(step)
      const cur = parseFloat(el.value) || 0
      let next = parseFloat((cur + dir * s).toFixed(10))
      if (min !== undefined) next = Math.max(next, Number(min))
      if (max !== undefined) next = Math.min(next, Number(max))
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype,
        "value"
      )?.set
      nativeInputValueSetter?.call(el, String(next))
      el.dispatchEvent(new Event("input", { bubbles: true }))
    }

    return (
      <div className="relative flex items-center">
        <button
          type="button"
          tabIndex={-1}
          onClick={() => adjust(-1)}
          disabled={props.disabled}
          className={cn(
            "absolute left-0 flex h-full w-11 sm:w-8 items-center justify-center rounded-l-md",
            "border border-input bg-muted/50 text-muted-foreground",
            "transition-colors hover:bg-muted hover:text-foreground",
            "disabled:pointer-events-none disabled:opacity-50"
          )}
        >
          <Minus className="h-3 w-3" />
        </button>
        <input
          type="number"
          ref={resolvedRef}
          min={min}
          max={max}
          step={step}
          onChange={onChange}
          className={cn(
            "flex h-10 w-full rounded-md border border-input bg-background px-12 sm:px-9 py-2 text-center text-base tabular-nums ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
            className
          )}
          {...props}
        />
        <button
          type="button"
          tabIndex={-1}
          onClick={() => adjust(1)}
          disabled={props.disabled}
          className={cn(
            "absolute right-0 flex h-full w-11 sm:w-8 items-center justify-center rounded-r-md",
            "border border-input bg-muted/50 text-muted-foreground",
            "transition-colors hover:bg-muted hover:text-foreground",
            "disabled:pointer-events-none disabled:opacity-50"
          )}
        >
          <Plus className="h-3 w-3" />
        </button>
      </div>
    )
  }
)
NumberInput.displayName = "NumberInput"

export { NumberInput }
