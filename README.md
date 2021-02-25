# d3-sparkline-chart

> D3 plugin for creating super simple sparkline charts

[![NPM](https://img.shields.io/npm/v/d3-sparkline-chart.svg)](https://www.npmjs.com/package/d3-sparkline-chart) [![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)

## Install

```bash
npm install --save d3-sparkline-chart
```

D3 is a peer dependency, so it must be included in your project.

## API Reference

### sparkline()

Creates a sparkline object. The object is suitable for use in a D3 selection `.call(sparkline)` call. It will render the bound data of the selection
as a sparkline chart with the given properties. The bound data is expected to be a list, with x and y values accessed using the `x` and `y` properties.

### sparkline.baseline([*value*])

If *value* is specified, sets the baseline and returns the sparkline. If *value* is not specified, returns the current baseline.

The baseline is a flat line across the chart that acts as a goal line, deliniating data values as 'good' and 'bad'.

The value of baseline can either be a number, or a function of the form: ```(d: data) => number```. Unlike other accessors, the entire data set it provided.

### sparkline.better([*value*])

If *value* is specified, sets better and returns the sparkline. If *value* is not specified, returns the current better value.

Valid values for better are `higher` and `lower`. Default is 'higher'. *better* controls whether data values above or below the baseline are considered good or bad.
Setting better to 'lower' flips this so that values above the baseline are considered bad (and highlighted accordingly).

### sparkline.domain([*value*])

If *value* is specified, sets the domain and returns the sparkline. If *value* is not specified, returns the current domain value.

If domain is not set, it is inferred from the data. However, setting domain overrides whatever the data determines, even if that means that some data will not
be visible.

This is useful for syncronizing multiple sparklines to the same domain, such as a date range.

Default is *null*. Accepted values are *[number, number]* or *[Date, Date]*.

### sparkline.margin([*value*])

If *value* is specified, sets the margin and returns the sparkline. If *value* is not specified, returns the current margin value.

Sets the margins around the edge of the chart, within the given *size*.

Default is [4, 4].

### sparkline.on('highlight', *listener*)

Adds an event listener for when the highlighted value changes. By default, the last data point is highlighted, and this event is dispatched
when the chart is first created and subsequently any time the highlighted value changes. The *listener* signature is of the form
`(d: datum, i: index) => void`.

This is useful for changing any data labels to react to when the user mouses over the chart.

Currently, 'highlight' is the only event type.

### sparkline.size([*value*])

If *value* is specified, sets the size and returns the sparkline. If *value* is not specified, returns the current size value.

Sets the size of chart in the form [width, height].

Default is [180, 40].

### sparkline.x([*value*])

If *value* is specified, sets the x accessor and returns the sparkline. If *value* is not specified, returns the current `x` accessor value.

The accessor is used to get x values from each datum.

Default value is `(d, i) => i`. So, the default just charts the given values equally spaced.

### sparkline.y([*value*])

If *value* is specified, sets the y accessor and returns the sparkline. If *value* is not specified, returns the current `y` accessor value.

The accessor is used to get y values from each datum.

Default value is `(d, i) => d`. So, the default just assumes that the input is a list of numbers.

## Example

Creates 3 sparklines in the same SVG.

```tsx
import React, { useRef, useEffect } from 'react'
import * as d3 from 'd3'
import { sparkline } from 'd3-sparkline'

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
      .attr('transform', (_d, i) => `translate(0, ${i*40})`)
      .call(sparks)

  })

  return (
    <svg ref={svg} width="180" height="120">
      <rect width="100%" height="100%" stroke="black" fill="none" />
    </svg>
  )
}
```

## License

MIT © [omnizach](https://github.com/omnizach)
