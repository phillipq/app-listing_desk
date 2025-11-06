declare module 'google-trends-api' {
  interface InterestOverTimeOptions {
    keyword: string | string[]
    geo?: string
    startTime?: Date
    endTime?: Date
    hl?: string
    timezone?: number
  }

  interface InterestOverTimeResult {
    default: {
      timelineData: Array<{
        time: string
        formattedTime: string
        formattedAxisTime: string
        value: number[]
        hasData: boolean[]
        formattedValue: string[]
      }>
      averages: number[]
    }
  }

  function interestOverTime(
    options: InterestOverTimeOptions,
    callback?: (err: Error | null, results: string) => void
  ): Promise<string>

  export default {
    interestOverTime
  }
}

