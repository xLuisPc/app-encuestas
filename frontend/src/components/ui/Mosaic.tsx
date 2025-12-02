import React from 'react'

interface MosaicProps {
  color?: string
  size?: 'small' | 'medium' | 'large'
  text?: string
  textColor?: string
}

const Mosaic: React.FC<MosaicProps> = ({
  color = '#32cd32',
  size = 'medium',
  text = '',
  textColor = '#000000'
}) => {
  const sizeMap = {
    small: 'w-8 h-8',
    medium: 'w-12 h-12',
    large: 'w-16 h-16'
  }

  return (
    <div className="flex flex-col items-center justify-center gap-2">
      <div className={`${sizeMap[size]} relative`}>
        <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 gap-1">
          {Array.from({ length: 9 }).map((_, i) => (
            <div
              key={i}
              className="rounded-sm animate-pulse"
              style={{
                backgroundColor: color,
                animationDelay: `${i * 0.1}s`,
                opacity: 0.7 + (i % 3) * 0.1
              }}
            />
          ))}
        </div>
      </div>
      {text && (
        <p style={{ color: textColor }} className="text-sm">
          {text}
        </p>
      )}
    </div>
  )
}

export default Mosaic

