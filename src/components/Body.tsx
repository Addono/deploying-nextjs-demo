import { useEffect, useState } from "react"

export interface BodyProps {
    time: string
    number: number
  }
  
  const Body = ({ time, number }: BodyProps) => {
    const [, setCounter] = useState<number>(0)
    useEffect(() => {
      const timeout = setInterval(() => setCounter(v => v + 1), 100)
  
      return () => clearInterval(timeout)
    }, [])
  
    return (
        <div style={{ fontSize: 30 }}>
          <p>Generation time: {new Date(Number.parseInt(time)).toISOString()} ({time})</p>
          <p><b>{Math.floor((new Date().getTime() - Number.parseInt(time)) / 1000).toString().padStart(6, "0")}</b> seconds passed since this page was generated</p>
          <p>BuildId: <b>{number.toString().padStart(6, "0")}</b></p>
        </div>
    )
  }
  

export default Body