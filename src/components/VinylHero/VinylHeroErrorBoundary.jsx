import React from 'react'
import { VinylHeroFallback } from './VinylHeroFallback'

export class VinylHeroErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    console.warn('[VinylHero] 3D module failed or WebGL uninitialized, rendering fallback:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <VinylHeroFallback
          hasEntered={this.props.hasEntered}
          isVideoTransitioning={this.props.isVideoTransitioning}
          handleStartEntryTransition={this.props.handleStartEntryTransition}
        />
      )
    }
    return this.props.children
  }
}
