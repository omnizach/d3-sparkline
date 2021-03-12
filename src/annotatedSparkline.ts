import { sparkline, Sparkline } from './sparkline'
import { Accessor, StringAccessor } from './accessor'
import { PropertyGetterSetterFunction } from './propertyGetterSetterFunction'
import { Selection } from 'd3'
import { DATA_COLOR, BASELINE_COLOR, GOOD_COLOR, BAD_COLOR } from './constants'

type Formatter = ((n: number | { valueOf(): number }) => string)

const LEFT_OFFSET_PCT = 0.25,
      TOP_OFFSET_PCT = 0.5

export interface AnnotatedSparkline {
  (selection: Selection<any | null, any, any, any>): void
  size: PropertyGetterSetterFunction<AnnotatedSparkline, [number, number]>
  layout: PropertyGetterSetterFunction<AnnotatedSparkline, 'annotationTop' | 'annotationLeft'>
  margin: PropertyGetterSetterFunction<AnnotatedSparkline, [number, number]>
  baselineLabel: PropertyGetterSetterFunction<AnnotatedSparkline, StringAccessor | string, StringAccessor>
  dataFormat: PropertyGetterSetterFunction<AnnotatedSparkline, Formatter | null, Formatter>
  domainFormat: PropertyGetterSetterFunction<AnnotatedSparkline, Formatter | null, Formatter>
  title: PropertyGetterSetterFunction<AnnotatedSparkline, StringAccessor | string, StringAccessor>
  xLabel: PropertyGetterSetterFunction<AnnotatedSparkline, StringAccessor | string, StringAccessor>
  yLabel: PropertyGetterSetterFunction<AnnotatedSparkline, StringAccessor | string, StringAccessor>

  // Sparkline properties
  baseline: PropertyGetterSetterFunction<AnnotatedSparkline, number | ((data: any) => number | null) | null, ((data: any) => number | null)>
  better: PropertyGetterSetterFunction<AnnotatedSparkline, 'lower' | 'higher'>
  data: PropertyGetterSetterFunction<AnnotatedSparkline, ((d: any) => any[])>
  domain: PropertyGetterSetterFunction<AnnotatedSparkline, [number | Date, number | Date] | null, [number, number] | null>
  //margin: PropertyGetterSetterFunction<AnnotatedSparkline, [number, number]>
  on: (typename: string, listener?: ((d:any, i:number, extra: { isGood: boolean | null, data: any[] }) => void) | null) => AnnotatedSparkline
  //size: PropertyGetterSetterFunction<AnnotatedSparkline, [number, number]>
  x: PropertyGetterSetterFunction<AnnotatedSparkline, Accessor>
  y: PropertyGetterSetterFunction<AnnotatedSparkline, Accessor>
}

export function annotatedSparkline(): AnnotatedSparkline {
  let my: any,
      _size: [number, number] = [360, 40],
      _layout: 'annotationTop' | 'annotationLeft' = 'annotationLeft',
      _margin: [number, number] = [4, 4],
      _baselineLabel: StringAccessor = () => '',
      _dataFormat: Formatter = (n: number) => n.toFixed(0), 
      _domainFormat: Formatter = (n: number) => n.toFixed(0),
      _title: StringAccessor = () => '',
      _xLabel: StringAccessor = (d: string) => d.toString(),
      _yLabel: StringAccessor = (d: string) => d.toString()

  let annotation: Selection<any | null, any, any, any>,
      onHighlight = (showTitle: boolean, d: any, i: number, extra: { isGood: boolean | null }) => {
        if (!annotation) {
          return
        }

        annotation.select('.title').attr('opacity', showTitle ? 1 : 0)
        annotation.select('.x-label').attr('opacity', showTitle ? 0 : 1)

        annotation.select('.x-label')
            .text(_xLabel(_domainFormat(_sparkline.x()(d, i))))

        annotation.select('.y-label')
            .text(_yLabel(_dataFormat(_sparkline.y()(d, i))))
            .attr('fill', extra.isGood === null ? DATA_COLOR : extra.isGood ? GOOD_COLOR : BAD_COLOR)
      }

  let _sparkline: Sparkline = sparkline()
      .margin(_margin)
      .size([_size[0]*(1-LEFT_OFFSET_PCT), _size[1]])
      .on('highlight', (d, i, extra) => {
        onHighlight(false, d, i, extra)
      })
      .on('unhighlight', (d, i, extra) => {
        onHighlight(true, d, i, extra)
      })

  my = (selection: Selection<any | null, any, any, any>) => {

    const data = selection.datum()

    console.log(data)

    if (!data) {
      return
    }

    const context = selection.selectAll('.sparkline-chart')
                      .data([data])
                      .join(enter => {
                        const g = enter.append('g')
                                .attr('class', 'sparkline-chart')

                        annotation = g.append('g')
                                    .attr('class', 'annotation')
                                    .attr('font-family', 'sans-serif')
                                    .attr('transform', `translate(${_margin[0]},${_margin[1]})`)
            
                        annotation.append('text')
                                .attr('class', 'title')
                                .attr('text-anchor', 'start')
                                .attr('dominant-baseline', 'hanging')
                                .attr('fill', DATA_COLOR)
                                .attr('font-size', _size[1]*0.35)
                
                        annotation.append('text')
                                .attr('class', 'x-label')
                                .attr('text-anchor', 'start')
                                .attr('dominant-baseline', 'hanging')
                                .attr('fill', DATA_COLOR)
                                .attr('font-size', _size[1]*0.4)
                                .attr('opacity', 0)
                
                        annotation.append('text')
                                .attr('class', 'y-label')
                                .attr('text-anchor', 'start')
                                .attr('y', _size[1]*0.5)
                                .attr('dominant-baseline', 'hanging')
                                .attr('fill', DATA_COLOR)
                                .attr('font-size', _size[1]*0.5)

                        annotation.append('text')
                                .attr('class', 'baseline-label')
                                .attr('text-anchor', 'end')
                                .attr('x', _size[0]*LEFT_OFFSET_PCT)
                                .attr('y', _size[1])
                                .attr('fill', BASELINE_COLOR)
                                .attr('font-size', _size[1]*0.3)

                        g.append('g')
                          .attr('transform', _layout === 'annotationLeft' ? 
                                              `translate(${_size[0]*LEFT_OFFSET_PCT},0)` :
                                              `translate(0,${_size[1]*TOP_OFFSET_PCT})`)
                          .call(_sparkline)

                        return g
                      })

    context.select('.title')
            .text(_title(data))
        
    context.select('.baseline-label')
            .text(_baselineLabel(data))
    
  }

  my.size = (value?: [number, number]): AnnotatedSparkline | [number, number] => {
    if (value === undefined) {
      return _size
    }

    _size = value
    _sparkline.size(_layout === 'annotationLeft'  ? 
                      [_size[0]*(1-LEFT_OFFSET_PCT), _size[1]] : 
                      [_size[0], _size[1]*(1-TOP_OFFSET_PCT)])

    return my
  }

  my.layout = (value?: 'annotationLeft' | 'annotationTop'): AnnotatedSparkline | 'annotationLeft' | 'annotationTop' => {
    if (value === undefined) {
      return _layout
    }

    _layout = value
    my.size(_size)

    return my
  }

  my.margin = (value?: [number, number]): AnnotatedSparkline | [number, number] => {
    if (value === undefined) {
      return _margin
    }

    _margin = value
    _sparkline.margin(_margin)

    return my
  }

  //#region Sparkline properties

  my.baseline = (value?: number | ((data: any) => number)): AnnotatedSparkline | number | ((data: any) => number | null) =>
    !value ? _sparkline.baseline() : (_sparkline.baseline(value), my)
    
  my.better = (value?: 'lower' | 'higher'): AnnotatedSparkline | 'lower' | 'higher' =>
    !value ? _sparkline.better() : (_sparkline.better(value), my)

  my.data = (value?: ((d: any) => any[])): AnnotatedSparkline | ((d: any) => any[]) =>
    !value ? _sparkline.data() : (_sparkline.data(value), my)

  my.domain = (value?: [number | Date, number | Date] | null): AnnotatedSparkline | [number, number] | null =>
    !value ? _sparkline.domain() : (_sparkline.domain(value), my)
    
  my.on = (typename: string, listener: ((d:any, i:number) => void) | null = null): AnnotatedSparkline =>
    (_sparkline.on(typename, listener), my)

  my.x = (value?: Accessor): AnnotatedSparkline | Accessor =>
    !value ? _sparkline.x() : (_sparkline.x(value), my)
  
  my.y = (value?: Accessor): AnnotatedSparkline | Accessor =>
    !value ? _sparkline.y() : (_sparkline.y(value), my)

  //#endregion

  //#region Annotation properties

  my.baselineLabel = (value?: StringAccessor | string): AnnotatedSparkline | StringAccessor => {
    if (value === undefined) {
      return _baselineLabel
    }

    _baselineLabel = typeof value === 'function' ? value : () => value
    return my
  }

  my.dataFormat = (value?: Formatter | null): AnnotatedSparkline | Formatter => {
    if (value === undefined) {
      return _dataFormat
    }

    _dataFormat = value || ((n: number) => n.toString())
    return my
  }

  my.domainFormat = (value?: Formatter | null): AnnotatedSparkline | Formatter => {
    if (value === undefined) {
      return _domainFormat
    }

    _domainFormat = value || ((n: number) => n.toString())
    return my
  }

  my.title = (value?: StringAccessor | string): AnnotatedSparkline | StringAccessor => {
    if (value === undefined) {
      return _title
    }

    _title = typeof value === 'function' ? value : () => value
    return my
  }

  my.xLabel = (value?: StringAccessor | string): AnnotatedSparkline | StringAccessor => {
    if (value === undefined) {
      return _xLabel
    }

    _xLabel = typeof value === 'function' ? value : () => value

    return my
  }

  my.yLabel = (value?: StringAccessor | string): AnnotatedSparkline | StringAccessor => {
    if (value === undefined) {
      return _yLabel
    }

    _yLabel = typeof value === 'function' ? value : () => value
    return my
  }

  //#endregion

  return my as AnnotatedSparkline
}