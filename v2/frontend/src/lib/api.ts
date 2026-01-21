import type { Link, LinkListResponse } from '@/types'

const API_BASE = '/api/v1'

// Get token from localStorage
function getAuthHeader(): Record<string, string> {
	const token = localStorage.getItem('token')
	return token ? { Authorization: `Bearer ${token}` } : {}
}

export const api = {
	// Auth
	async login(username: string, password: string) {
		const res = await fetch(`${API_BASE}/auth/login`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ username, password }),
		})
		if (!res.ok) throw new Error('Login failed')
		const data = await res.json()
		localStorage.setItem('token', data.access_token)
		return data
	},

	async register(username: string, email: string, password: string) {
		const res = await fetch(`${API_BASE}/auth/register`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ username, email, password }),
		})
		if (!res.ok) throw new Error('Registration failed')
		return res.json()
	},

	async getMe() {
		const res = await fetch(`${API_BASE}/auth/me`, {
			headers: getAuthHeader(),
		})
		if (!res.ok) throw new Error('Not authenticated')
		return res.json()
	},

	logout() {
		localStorage.removeItem('token')
	},

	// Links
	async getLinks(cursor = 0, archived?: boolean): Promise<LinkListResponse> {
		const params = new URLSearchParams({ cursor: cursor.toString() })
		if (archived !== undefined) params.set('archived', archived.toString())

		const res = await fetch(`${API_BASE}/links?${params}`, {
			headers: getAuthHeader(),
		})
		if (!res.ok) throw new Error('Failed to fetch links')
		return res.json()
	},

	async getLink(id: number): Promise<Link> {
		const res = await fetch(`${API_BASE}/links/${id}`, {
			headers: getAuthHeader(),
		})
		if (!res.ok) throw new Error('Failed to fetch link')
		return res.json()
	},

	async createLink(url: string, tags?: string[]): Promise<Link> {
		const res = await fetch(`${API_BASE}/links`, {
			method: 'POST',
			headers: {
				...getAuthHeader(),
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({ url, tags }),
		})
		if (!res.ok) throw new Error('Failed to create link')
		return res.json()
	},

	async updateLink(id: number, data: Partial<Pick<Link, 'title' | 'description' | 'is_archived' | 'reading_progress'>>) {
		const res = await fetch(`${API_BASE}/links/${id}`, {
			method: 'PUT',
			headers: {
				...getAuthHeader(),
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(data),
		})
		if (!res.ok) throw new Error('Failed to update link')
		return res.json()
	},

	async deleteLink(id: number) {
		const res = await fetch(`${API_BASE}/links/${id}`, {
			method: 'DELETE',
			headers: getAuthHeader(),
		})
		if (!res.ok) throw new Error('Failed to delete link')
	},

	async refreshLink(id: number): Promise<Link> {
		const res = await fetch(`${API_BASE}/links/${id}/refresh`, {
			method: 'POST',
			headers: getAuthHeader(),
		})
		if (!res.ok) throw new Error('Failed to refresh link')
		return res.json()
	},
}
