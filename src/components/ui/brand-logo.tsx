'use client'

import { useState } from 'react'
import { BeerStein } from '@phosphor-icons/react'

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg'
  showName?: boolean
}

const SIZES = {
  sm: { img: 56,  icon: 28, text: 'text-xl' },
  md: { img: 88,  icon: 44, text: 'text-2xl' },
  lg: { img: 120, icon: 60, text: 'text-3xl' },
}

export function BrandLogo({ size = 'md', showName = true }: BrandLogoProps) {
  const [imgError, setImgError] = useState(false)
  const { img, icon, text } = SIZES[size]

  return (
    <div className="flex flex-col items-center gap-2">
      {!imgError ? (
        // Zet je logo.png in /public/logo.png
        <img
          src="/logo.png"
          alt="Dranklijst mascotte"
          width={img}
          height={img}
          onError={() => setImgError(true)}
          className="drop-shadow-md"
          style={{ width: img, height: img, objectFit: 'contain' }}
        />
      ) : (
        <div
          className="flex items-center justify-center rounded-3xl bg-brand text-white"
          style={{ width: img, height: img }}
        >
          <BeerStein size={icon} weight="fill" />
        </div>
      )}
      {showName && (
        <span className={`font-display font-normal text-brand ${text}`}>
          Dranklijst
        </span>
      )}
    </div>
  )
}
