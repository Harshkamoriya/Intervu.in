import { NextResponse } from 'next/server'
import axios from 'axios'

const JUDGE_BACKEND_URL = process.env.JUDGE_BACKEND_URL || 'http://localhost:4000'

export async function POST(req: Request) {
  try {
    const body = await req.json()
   
    if (!body.code) {
      return NextResponse.json({
        status: 'BAD_REQUEST',
        output: 'No code provided',
      }, { status: 400 })
    }

    const judgeRes = await axios.post(`${JUDGE_BACKEND_URL}/run`, {
      code: body.code,
      language: body.language,
      input: body.input || '',
    })

    if (!judgeRes.data.success) {
      return NextResponse.json({
        status: 'RUNTIME_ERROR',
        output: judgeRes.data.error,
      })
    }

    return NextResponse.json({
      status: 'SUCCESS',
      output: judgeRes.data.output,
    })
  } catch (err: any) {
    console.error('Error in code run API:', err)
    return NextResponse.json({
      status: 'ERROR',
      output: err.response?.data?.error || err.message || 'Unknown error occurred',
    }, { status: err.response?.status || 500 })
  }
}



