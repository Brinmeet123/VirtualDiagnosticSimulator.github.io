'use client'

type Message = {
  role: 'doctor' | 'patient'
  content: string
}

type Props = {
  messages: Message[]
}

type HintStatus = {
  category: string
  status: 'explored' | 'partial' | 'not-discussed'
}

export default function HintMeter({ messages }: Props) {
  // Only doctor turns count — patient lines like "Hello, doctor" must not skew coverage.
  const chatText = messages
    .filter((m) => m.role === 'doctor')
    .map((m) => m.content.toLowerCase())
    .join(' ')
  
  const hints: HintStatus[] = [
    {
      category: 'Timing',
      status: (chatText.includes('when') || chatText.includes('start') || chatText.includes('time')) 
        ? 'explored' 
        : (chatText.includes('duration') || chatText.includes('how long')) 
        ? 'partial' 
        : 'not-discussed'
    },
    {
      category: 'Red flags',
      status: (chatText.includes('short of breath') || chatText.includes('sweating') || chatText.includes('nausea') || chatText.includes('dizzy'))
        ? 'explored'
        : (chatText.includes('feel') || chatText.includes('symptom'))
        ? 'partial'
        : 'not-discussed'
    },
    {
      category: 'Background',
      status: (chatText.includes('medication') || chatText.includes('condition') || chatText.includes('medical history'))
        ? 'explored'
        : (chatText.includes('health') || chatText.includes('doctor'))
        ? 'partial'
        : 'not-discussed'
    }
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'explored':
        return 'text-green-600'
      case 'partial':
        return 'text-yellow-600'
      default:
        return 'text-gray-400'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'explored':
        return 'explored'
      case 'partial':
        return 'partially explored'
      default:
        return 'not yet discussed'
    }
  }

  return (
    <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 mb-6">
      <h3 className="text-xs font-medium text-blue-900 mb-2">Coverage</h3>
      <div className="space-y-1.5">
        {hints.map((hint, idx) => (
          <div key={idx} className="flex items-center justify-between text-xs">
            <span className="text-gray-700">{hint.category}:</span>
            <span className={getStatusColor(hint.status)}>
              {getStatusText(hint.status)}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

