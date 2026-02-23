import { lazy, Suspense } from 'react'
import Layout from './components/Layout'
import Hero from './components/Hero'
import Services from './components/Services'
import SectionSkeleton from './components/SectionSkeleton'

const About = lazy(() => import('./components/About'))
const Gallery = lazy(() => import('./components/Gallery'))
const Contact = lazy(() => import('./components/Contact'))

function App() {
  return (
    <Layout>
      <Hero />
      <Services />
      <Suspense fallback={<SectionSkeleton />}>
        <About />
        <Gallery />
        <Contact />
      </Suspense>
    </Layout>
  )
}

export default App
