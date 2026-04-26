import { KAS_BENEFICIARY_NAME, KAS_IBAN } from './payment-config'

function hashToTenDigits(input: string): string {
  let hash = 5381
  for (let i = 0; i < input.length; i++) {
    hash = ((hash * 33) ^ input.charCodeAt(i)) & 0x7fffffff
  }
  return hash.toString().padStart(10, '0').slice(-10)
}

function ogmChecksum(tenDigits: string): string {
  const num = BigInt(tenDigits)
  const remainder = num % 97n
  const cs = remainder === 0n ? 97n : remainder
  return cs.toString().padStart(2, '0')
}

export function formatStructuredCommunication(paymentId: string): string {
  const digits = hashToTenDigits(paymentId)
  const cs = ogmChecksum(digits)
  return `+++${digits.slice(0, 3)}/${digits.slice(3, 7)}/${digits.slice(7, 10)}${cs}+++`
}

export function buildEpcQrPayload(params: {
  amount: number
  structuredCommunication: string
  beneficiaryName?: string
  iban?: string
}): string {
  const name = (params.beneficiaryName ?? KAS_BENEFICIARY_NAME).slice(0, 70)
  const iban = (params.iban ?? KAS_IBAN).replace(/\s+/g, '')
  const amount = `EUR${params.amount.toFixed(2)}`
  const comm = params.structuredCommunication

  return [
    'BCD',
    '002',
    '1',
    'SCT',
    '',
    name,
    iban,
    amount,
    '',
    comm,
    '',
    '',
  ].join('\n')
}

export function formatIban(iban: string): string {
  const clean = iban.replace(/\s+/g, '').toUpperCase()
  return clean.replace(/(.{4})/g, '$1 ').trim()
}
