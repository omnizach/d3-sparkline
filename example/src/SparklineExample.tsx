import React, { useRef, useEffect } from 'react'
import * as d3 from 'd3'
import { sparkline } from 'd3-sparkline-chart'

export const SparklineExample = () => {
  const svg = useRef<SVGSVGElement>(null)

  useEffect(() => {
    const sparks = sparkline()
                    .baseline(5)
                    .on('highlight', d => console.log(d))

    d3.select(svg.current)
      .selectAll('g')
      .data([[1,1,2,3,5,8,13], [3,3,3,3,5,5,5,5,4,5,3], [10,9,8,10,7]])
      .join('g')
      .attr('transform', (_d, i) => `translate(0,${i*40})`)
      .call(sparks)

  })

  return (
    <svg ref={svg} width="180" height="120">
      <rect width="100%" height="100%" stroke="black" fill="none" />
    </svg>
  )
}