import StickFigure from './StickFigure'
import type { Exercise } from '../types'

const BASE = import.meta.env.BASE_URL

/** Animação do exercício: 2 fotos do free-exercise-db em crossfade, ou boneco SVG. */
export default function ExerciseAnim({ exercise, className = '' }: { exercise?: Exercise; variant?: 'thumb' | 'large'; className?: string }) {
  const fit = 'object-cover'
  if (exercise?.fedbId) {
    const src = (i: number) => `${BASE}exercises/${exercise.fedbId}/${i}.jpg`
    return (
      <div className={`relative overflow-hidden bg-card2 ${className}`}>
        <img src={src(0)} alt={exercise.name} className={`absolute inset-0 h-full w-full ${fit}`} draggable={false} />
        <img src={src(1)} alt="" aria-hidden className={`xfade-top absolute inset-0 h-full w-full ${fit}`} draggable={false} />
      </div>
    )
  }
  return (
    <div className={`overflow-hidden bg-card2 ${className}`}>
      <StickFigure anim={exercise?.svg ?? 'generico'} className="h-full w-full" />
    </div>
  )
}
