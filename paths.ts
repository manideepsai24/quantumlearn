export function entityPath(type: string | undefined, id: string | undefined): string | undefined {
  if (!id) return undefined
  switch ((type ?? '').toLowerCase()) {
    case 'lesson': return `/learn/lessons/${id}`
    case 'module': return `/learn/modules/${id}`
    case 'course': return `/learn/courses/${id}`
    case 'algorithm': return `/algorithms/${id}`
    case 'challenge': return `/challenges/${id}`
    case 'quiz': return `/quizzes/${id}`
    case 'circuit': return `/circuits/${id}`
    default: return undefined
  }
}
