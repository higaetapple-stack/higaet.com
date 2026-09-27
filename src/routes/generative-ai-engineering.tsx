import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/generative-ai-engineering')({
  beforeLoad: () => {
    throw redirect({
      to: '/blog/$slug',
      params: { slug: 'generative-ai-engineering' }
    })
  }
})
