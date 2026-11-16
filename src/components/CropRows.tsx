import { motion } from 'motion/react'

/**
 * The section's signature band: furrowed rows in the section colour (set as --role on an ancestor).
 * The rows slide in once along the band when it mounts, like a plough pass. Only transform animates,
 * so the furrow angle never distorts.
 */
export function CropRows({
  direction = 'horizontal',
  delay = 0,
  className = '',
}: {
  direction?: 'horizontal' | 'vertical'
  delay?: number
  className?: string
}) {
  const horizontal = direction === 'horizontal'
  return (
    <span aria-hidden="true" className={`block overflow-hidden ${className}`}>
      <motion.span
        className="crop-rows block size-full"
        initial={horizontal ? { x: '-100%' } : { y: '-100%' }}
        animate={horizontal ? { x: 0 } : { y: 0 }}
        transition={{ duration: 0.9, delay, ease: [0.22, 1, 0.36, 1] }}
      />
    </span>
  )
}
