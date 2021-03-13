import React, { useRef, useEffect } from 'react'
import * as d3 from 'd3'
import { sparkline } from 'd3-sparkline-chart'

export const SparklineExample = () => {
  const svg = useRef<SVGSVGElement>(null)

  useEffect(() => {
    d3.select(svg.current)
      .datum([1,1,2,3,5,8,13,21])
      .call(sparkline()
            .baseline(5)
            .baselineLabel('five')
            .title('Fibinacci Numbers')
            .xLabel(d => `f(${d})`)
            .on('highlight', d => console.log(d))
            .layout('left')
            .size([360, 60]))
  })

  return (
    <svg ref={svg} width="360" height="120">
      <rect width="100%" height="100%" stroke="black" fill="none" />
    </svg>
  )
}