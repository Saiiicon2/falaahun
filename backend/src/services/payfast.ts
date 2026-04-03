import crypto from 'crypto'
import https from 'https'
import querystring from 'querystring'

export const PAYFAST_SANDBOX_URL = 'https://sandbox.payfast.co.za/eng/process'
export const PAYFAST_LIVE_URL = 'https://www.payfast.co.za/eng/process'

const PAYFAST_VALIDATE_SANDBOX = 'https://sandbox.payfast.co.za/eng/query/validate'
const PAYFAST_VALIDATE_LIVE = 'https://www.payfast.co.za/eng/query/validate'

/**
 * Replicate PHP's urlencode() exactly.
 * Differences from encodeURIComponent:
 *   - Spaces → '+' (not %20)
 *   - ! ~ ' ( ) are encoded (encodeURIComponent leaves them raw)
 *   - * is NOT encoded (PHP leaves it raw, encodeURIComponent does too — no change needed)
 */
function phpUrlencode(str: string): string {
  return encodeURIComponent(str)
    .replace(/!/g, '%21')
    .replace(/'/g, '%27')
    .replace(/\(/g, '%28')
    .replace(/\)/g, '%29')
    .replace(/~/g, '%7E')
    .replace(/%20/g, '+')
}

/**
 * Generate a PayFast signature.
 * Must match PHP's reference implementation exactly:
 *   sort keys alphabetically, phpUrlencode each value, join with &, MD5.
 */
export function generateSignature(
  params: Record<string, string>,
  passphrase?: string
): string {
  const parts = Object.keys(params)
    .filter((k) => k !== 'signature' && params[k].trim() !== '')
    .sort()
    .map((k) => `${k}=${phpUrlencode(params[k].trim())}`)
    .join('&')

  const str = passphrase
    ? `${parts}&passphrase=${phpUrlencode(passphrase.trim())}`
    : parts

  return crypto.createHash('md5').update(str).digest('hex')
}

/**
 * Build the complete set of PayFast checkout fields including signature.
 * For SaaS subscriptions pass isRecurring=true.
 */
export function buildCheckoutParams(opts: {
  merchantId: string
  merchantKey: string
  passphrase?: string
  returnUrl: string
  cancelUrl: string
  notifyUrl: string
  nameFirst: string
  nameLast: string
  email: string
  mPaymentId: string
  amount: string       // e.g. "350.00"  always 2dp ZAR
  itemName: string
  isRecurring: boolean
}): Record<string, string> {
  const params: Record<string, string> = {
    merchant_id:   opts.merchantId,
    merchant_key:  opts.merchantKey,
    return_url:    opts.returnUrl,
    cancel_url:    opts.cancelUrl,
    notify_url:    opts.notifyUrl,
    name_first:    opts.nameFirst,
    email_address: opts.email,
    m_payment_id:  opts.mPaymentId,
    amount:        opts.amount,
    item_name:     opts.itemName,
  }

  if (opts.nameLast && opts.nameLast.trim()) {
    params.name_last = opts.nameLast.trim()
  }

  if (opts.isRecurring) {
    params.subscription_type  = '1'
    params.frequency          = '3'        // monthly
    params.cycles             = '0'        // ongoing
    params.recurring_amount   = opts.amount
  }

  // Drop empty values
  const clean: Record<string, string> = {}
  for (const [k, v] of Object.entries(params)) {
    if (v !== '' && v != null) clean[k] = v
  }

  clean.signature = generateSignature(clean, opts.passphrase)
  return clean
}

/**
 * Verify a PayFast ITN notification by posting it back to PayFast's
 * validate endpoint. Returns true if PayFast responds with "VALID".
 */
export async function verifyItn(
  body: Record<string, string>,
  isSandbox: boolean
): Promise<boolean> {
  const validateUrl = isSandbox ? PAYFAST_VALIDATE_SANDBOX : PAYFAST_VALIDATE_LIVE

  // Post everything except our computed signature
  const { signature: _sig, ...postParams } = body
  const postData = querystring.stringify(postParams)

  return new Promise((resolve) => {
    const url = new URL(validateUrl)
    const options = {
      hostname: url.hostname,
      port:     443,
      path:     url.pathname,
      method:   'POST',
      headers:  {
        'Content-Type':   'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postData),
        'User-Agent':     'FalaahunCRM/1.0',
      },
    }

    const req = https.request(options, (res) => {
      let data = ''
      res.on('data', (chunk) => { data += chunk })
      res.on('end', () => { resolve(data.trim() === 'VALID') })
    })

    req.on('error', () => resolve(false))
    req.write(postData)
    req.end()
  })
}
