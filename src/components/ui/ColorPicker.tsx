import { CARD_COLORS } from '@/lib/constants'

interface ColorPickerProps {
  value: string
  onChange: (color: string) => void
  label?: string
}

export function ColorPicker({ value, onChange, label }: ColorPickerProps) {
  return (
    <div>
      {label && (
        <label className="mb-1.5 block text-sm font-medium text-text-primary">
          {label}
        </label>
      )}
      <div className="flex flex-wrap gap-2">
        {CARD_COLORS.map((color) => (
          <button
            key={color}
            type="button"
            onClick={() => onChange(color)}
            className={`h-8 w-8 rounded-full transition-all ${
              value === color
                ? 'ring-2 ring-offset-2 ring-accent scale-110'
                : 'hover:scale-110'
            }`}
            style={{ backgroundColor: color }}
            aria-label={`Selecionar cor ${color}`}
          />
        ))}
      </div>
    </div>
  )
}