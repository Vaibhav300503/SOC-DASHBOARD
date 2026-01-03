/**
 * Chart configuration utilities for dark theme support
 */

export const darkThemeColors = {
  primary: '#00E1FF',
  secondary: '#A855F7',
  accent: '#FF2D78',
  success: '#05FFA1',
  warning: '#FFD700',
  danger: '#FF3860',
  info: '#9D4EDD',
  background: '#0F172A',
  surface: '#1E293B',
  border: 'rgba(255, 255, 255, 0.1)',
  text: '#F8FAFC',
  textSecondary: '#94A3B8',
  textMuted: '#64748B'
}

export const getApexChartsDarkTheme = () => ({
  theme: {
    mode: 'dark',
    palette: 'palette1',
    monochrome: {
      enabled: false,
      color: darkThemeColors.primary,
      shadeTo: 'light',
      shadeIntensity: 0.65
    }
  },
  chart: {
    background: 'transparent',
    foreColor: darkThemeColors.text,
    toolbar: {
      tools: {
        download: true,
        selection: true,
        zoom: true,
        zoomin: true,
        zoomout: true,
        pan: true,
        reset: true
      },
      autoSelected: 'zoom'
    },
    sparkline: {
      enabled: false
    }
  },
  colors: [
    darkThemeColors.primary,
    darkThemeColors.secondary,
    darkThemeColors.accent,
    darkThemeColors.success,
    darkThemeColors.warning,
    darkThemeColors.info
  ],
  stroke: {
    show: true,
    curve: 'smooth',
    lineCap: 'butt',
    colors: [darkThemeColors.primary],
    width: 2,
    dashArray: 0
  },
  fill: {
    opacity: 0.1,
    type: 'gradient',
    gradient: {
      shadeIntensity: 1,
      opacityFrom: 0.45,
      opacityTo: 0.05,
      stops: [0, 100]
    }
  },
  grid: {
    show: true,
    borderColor: darkThemeColors.border,
    strokeDashArray: 3,
    position: 'back',
    xaxis: {
      lines: {
        show: false
      }
    },
    yaxis: {
      lines: {
        show: true
      }
    },
    padding: {
      top: 0,
      right: 0,
      bottom: 0,
      left: 0
    }
  },
  xaxis: {
    type: 'datetime',
    axisBorder: {
      show: false,
      color: darkThemeColors.border
    },
    axisTicks: {
      show: false,
      color: darkThemeColors.border
    },
    labels: {
      show: true,
      style: {
        colors: darkThemeColors.textSecondary,
        fontSize: '12px',
        fontFamily: 'Inter, sans-serif'
      }
    },
    tooltip: {
      enabled: true,
      theme: 'dark'
    }
  },
  yaxis: {
    axisBorder: {
      show: false,
      color: darkThemeColors.border
    },
    axisTicks: {
      show: false,
      color: darkThemeColors.border
    },
    labels: {
      show: true,
      style: {
        colors: darkThemeColors.textSecondary,
        fontSize: '12px',
        fontFamily: 'Inter, sans-serif'
      }
    }
  },
  tooltip: {
    enabled: true,
    theme: 'dark',
    style: {
      fontSize: '12px',
      fontFamily: 'Inter, sans-serif'
    },
    x: {
      show: true,
      format: 'dd MMM yyyy HH:mm'
    },
    y: {
      formatter: undefined
    },
    marker: {
      show: true
    }
  },
  legend: {
    show: true,
    showForNullSeries: true,
    showForZeroSeries: true,
    position: 'bottom',
    horizontalAlign: 'center',
    floating: false,
    fontSize: 12,
    fontFamily: 'Inter, sans-serif',
    labels: {
      colors: darkThemeColors.textSecondary,
      useSeriesColors: false
    },
    markers: {
      width: 12,
      height: 12,
      strokeWidth: 0,
      strokeColor: '#fff',
      fillColors: undefined,
      radius: 12,
      customHTML: undefined,
      onClick: undefined,
      offsetX: 0,
      offsetY: 0
    },
    itemMargin: {
      horizontal: 15,
      vertical: 8
    },
    onItemClick: {
      toggleDataSeries: true
    },
    onItemHover: {
      highlightDataSeries: true
    }
  },
  dataLabels: {
    enabled: false
  },
  plotOptions: {
    bar: {
      horizontal: false,
      columnWidth: '55%',
      borderRadius: 4,
      dataLabels: {
        position: 'top'
      },
      distributed: false,
      colors: {
        ranges: [
          {
            from: -100,
            to: 0,
            color: darkThemeColors.danger
          },
          {
            from: 1,
            to: 100,
            color: darkThemeColors.success
          }
        ]
      }
    },
    line: {
      dataLabels: {
        position: 'top'
      }
    },
    area: {
      fillTo: 'origin'
    },
    pie: {
      donut: {
        size: '65%',
        background: 'transparent',
        labels: {
          show: true,
          name: {
            show: true,
            fontSize: '12px',
            fontFamily: 'Inter, sans-serif',
            color: darkThemeColors.textSecondary
          },
          value: {
            show: true,
            fontSize: '14px',
            fontFamily: 'Inter, sans-serif',
            color: darkThemeColors.text,
            fontWeight: 600
          },
          total: {
            show: true,
            label: 'Total',
            fontSize: '12px',
            fontFamily: 'Inter, sans-serif',
            color: darkThemeColors.textSecondary
          }
        }
      }
    }
  },
  states: {
    normal: {
      filter: {
        type: 'none',
        value: 0
      }
    },
    hover: {
      filter: {
        type: 'darken',
        value: 0.15
      }
    },
    active: {
      filter: {
        type: 'darken',
        value: 0.15
      }
    }
  },
  responsive: [
    {
      breakpoint: 1024,
      options: {
        chart: {
          height: 300
        }
      }
    },
    {
      breakpoint: 768,
      options: {
        chart: {
          height: 250
        },
        legend: {
          position: 'bottom'
        }
      }
    }
  ]
})

/**
 * Get line chart options with dark theme
 */
export const getLineChartOptions = (overrides = {}) => {
  const baseOptions = getApexChartsDarkTheme()
  return {
    ...baseOptions,
    chart: {
      ...baseOptions.chart,
      type: 'line',
      zoom: {
        enabled: true,
        type: 'x',
        autoScaleYaxis: true
      }
    },
    stroke: {
      ...baseOptions.stroke,
      curve: 'smooth',
      width: 2
    },
    ...overrides
  }
}

/**
 * Get bar chart options with dark theme
 */
export const getBarChartOptions = (overrides = {}) => {
  const baseOptions = getApexChartsDarkTheme()
  return {
    ...baseOptions,
    chart: {
      ...baseOptions.chart,
      type: 'bar'
    },
    ...overrides
  }
}

/**
 * Get area chart options with dark theme
 */
export const getAreaChartOptions = (overrides = {}) => {
  const baseOptions = getApexChartsDarkTheme()
  return {
    ...baseOptions,
    chart: {
      ...baseOptions.chart,
      type: 'area',
      stacked: false
    },
    stroke: {
      ...baseOptions.stroke,
      curve: 'smooth'
    },
    fill: {
      ...baseOptions.fill,
      type: 'gradient'
    },
    ...overrides
  }
}

/**
 * Get pie chart options with dark theme
 */
export const getPieChartOptions = (overrides = {}) => {
  const baseOptions = getApexChartsDarkTheme()
  return {
    ...baseOptions,
    chart: {
      ...baseOptions.chart,
      type: 'pie'
    },
    ...overrides
  }
}

/**
 * Get donut chart options with dark theme
 */
export const getDonutChartOptions = (overrides = {}) => {
  const baseOptions = getApexChartsDarkTheme()
  return {
    ...baseOptions,
    chart: {
      ...baseOptions.chart,
      type: 'donut'
    },
    plotOptions: {
      ...baseOptions.plotOptions,
      pie: {
        donut: {
          size: '65%'
        }
      }
    },
    ...overrides
  }
}

/**
 * Format chart data for time series
 */
export const formatTimeSeriesData = (data, dateField = 'timestamp', valueField = 'value') => {
  return data.map(item => ({
    x: new Date(item[dateField]).getTime(),
    y: item[valueField]
  }))
}

/**
 * Format chart data for categories
 */
export const formatCategoryData = (data, categoryField = 'name', valueField = 'value') => {
  return {
    categories: data.map(item => item[categoryField]),
    values: data.map(item => item[valueField])
  }
}
