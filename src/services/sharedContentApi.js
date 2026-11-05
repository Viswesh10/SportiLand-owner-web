const API_BASE = import.meta.env.VITE_API_BASE_URL || `${window.location.protocol}//${window.location.hostname}:8080`
let csrfToken = ''

async function readResponse(response) {
  const body = await response.json().catch(() => ({}))
  if (!response.ok || body.success === false) {
    throw new Error(body.message || body.error || `FieldFinder API request failed (${response.status})`)
  }
  return body.data ?? body
}

async function getCsrfToken() {
  const response = await fetch(`${API_BASE}/api/auth/csrf`, { credentials: 'include' })
  const data = await readResponse(response)
  csrfToken = data.token || ''
  return csrfToken
}

export async function ownerApi(path, options = {}) {
  const method = (options.method || 'GET').toUpperCase()
  const headers = { ...(options.headers || {}) }
  let body = options.body
  if (body && !(body instanceof FormData) && typeof body !== 'string') {
    headers['Content-Type'] = 'application/json'
    body = JSON.stringify(body)
  }
  if (!['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    const token = await getCsrfToken()
    if (token) headers['X-XSRF-TOKEN'] = token
  }
  const response = await fetch(`${API_BASE}${path}`, { ...options, method, headers, body, credentials: 'include' })
  return readResponse(response)
}

export async function backendOwnerLogin(username, password) {
  const result = await ownerApi('/api/auth/login', { method: 'POST', body: { username, password, role: 'owner' } })
  if (!result.user) throw new Error('The backend did not return an owner account.')
  const turf = await ownerApi('/api/owner/turf')
  return { user: result.user, turf }
}

export async function backendOwnerRegister(form) {
  const result = await ownerApi('/api/auth/register/owner', {
    method: 'POST',
    body: {
      ownerName: form.ownerName,
      turfName: form.turfName,
      contactNumber: form.contactNumber,
      email: form.email,
      password: form.password,
      area: form.area,
      address: form.address,
      primarySport: form.sport
    }
  })
  if (!result.user) throw new Error('The backend did not return the registered owner.')
  const turf = await ownerApi('/api/owner/turf')
  return { user: result.user, turf }
}
