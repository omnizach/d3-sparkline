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

Default value is `null`. A null value indicated that the baseline should be omitted.

### sparkline.baselineLabel([*value*])

If *value* is specified, sets the baselineLabel and returns the sparkline. If *value* is not specified, returns the current baselineLabel.

*baselineLabel* can be either a string or function of the form `data => string`, where *data* is the entire datum provided.

### sparkline.better([*value*])

If *value* is specified, sets better and returns the sparkline. If *value* is not specified, returns the current better value.

Valid values for better are `higher` and `lower`. Default is 'higher'. *better* controls whether data values above or below the baseline are considered good or bad.
Setting better to 'lower' flips this so that values above the baseline are considered bad (and highlighted accordingly).

### sparkline.data([*value*])

if *value* is specified, sets the data accessor and returns the sparkline. If *value* is not specified, returns the current data accessor.

If the data given to the sparkline is not an array, then it needs to know how to access the data to make the chart. The given function to *data*
is there to convert the datum into a list/array.

Default value is the identity function, `d => d`, meaning that the incoming data is assumed to be a list.

This is useful if there is additional information that isn't needed for the chart data, but is needed elsewhere. For example, to set the baseline
based on the bound data:

```ts
const data = { myCustomBaseline: 5, myData: [2,4,6,8,10] }
                  
d3.select(svg)
  .datum(data)
  .call(sparkline()
          .baseline(d => d.myCustomBaseline)
          .data(d => d.myData))
```

### sparkline.dataFormat([*value*])

if *value* is specified, sets the dataFormat function and returns the sparkline. If *value* is not specified, returns the current dataFormat function.

This function has the form `(d, i) => string` and controls how the data label is formatted.

### sparkline.domain([*value*])

If *value* is specified, sets the domain and returns the sparkline. If *value* is not specified, returns the current domain value.

If domain is not set, it is inferred from the data. However, setting domain overrides whatever the data determines, even if that means that some data will not
be visible.

This is useful for syncronizing multiple sparklines to the same domain, such as a date range.

Default is *null*. Accepted values are *[number, number]* or *[Date, Date]*.

### sparkline.domainFormat([*value*])

if *value* is specified, sets the domainFormat function and returns the sparkline. If *value* is not specified, returns the current domainFormat function.

This function has the form `(d, i) => string` and controls how the x label is formatted.

### sparkline.layout([*value*])

If *value* is specified, sets the layout and returns the sparkline. If *value* is not specified, returns the current layout value.

Valid values are 'left', 'top', and 'simple'.

* left: The labels are to the left of the chart.
* top: The labels are above the chart.
* simple: Labels are disabled.

### sparkline.margin([*value*])

If *value* is specified, sets the margin and returns the sparkline. If *value* is not specified, returns the current margin value.

Sets the margins around the edge of the chart, within the given *size*.

Default is [4, 4].

### sparkline.on('event', *listener*)

The *event* value should be one of 'highlight' or 'unhighlight'.

Adds an event listener for when the highlighted value changes. The 'unhighlight' event is dispatched
when the chart is first created. The last data point is provided to the listener for this event since
the chart marks that point when there is no interaction.

The 'hightlight' event is dispatched any time the highlighted value
changes. The *listener* signature is of the form
`(d: datum, i: index) => void`.

This is useful for changing any data labels to react to when the user mouses over the chart.

### sparkline.size([*value*])

If *value* is specified, sets the size and returns the sparkline. If *value* is not specified, returns the current size value.

Sets the size of chart in the form [width, height].

Default is [360, 40].

### sparkline.title([*value*])

If *value* is specified, sets the title and returns the sparkline. If *value* is not specified, returns the current title function.

This can be provided as either a string or function of the form `datum => string`, where datum is the entire dataset. The controls
the title of the sparkline, by default in the upper left.

### sparkline.x([*value*])

If *value* is specified, sets the x accessor and returns the sparkline. If *value* is not specified, returns the current `x` accessor value.

The accessor is used to get x values from each datum.

Default value is `(d, i) => i`. So, the default just charts the given values equally spaced.

### sparkline.xLabel([*value*])

If *value* is specified, sets the xLabel function and returns the sparkline. If *value* is not specified, returns the current xLabel function.

This function is of the form `(d, i) => string` and controls how the x value is displayed.

### sparkline.y([*value*])

If *value* is specified, sets the y accessor and returns the sparkline. If *value* is not specified, returns the current `y` accessor value.

The accessor is used to get y values from each datum.

Default value is `(d, i) => d`. So, the default just assumes that the input is a list of numbers.

### sparkline.yLabel([*value*])

If *value* is specified, sets the yLabel function and returns the sparkline. If *value* is not specified, returns the current yLabel function.

This function is of the form `(d, i) => string` and controls how the y value is displayed.

## Example

Creates 3 sparklines in the same SVG.

```tsx
import React, { useRef, useEffect } from 'react'
import * as d3 from 'd3'
import { sparkline } from 'd3-sparkline'

export const SparklineExample = () => {
  const svg = useRef<SVGSVGElement>(null)

  useEffect(() => {

    d3.select(svg.current)
      .datum([1,1,2,3,5,8,13])
      .call(sparkline()
              .baseline(5)
              .on('highlight', d => console.log(d)))

  })

  return (
    <svg ref={svg} width="360" height="120">
      <rect width="100%" height="100%" stroke="black" fill="none" />
    </svg>
  )
}
```

## License

MIT © [omnizach](https://github.com/omnizach)
