export interface Link {
	id: number
	url: string
	title: string | null
	description: string | null
	content: string | null
	image_url: string | null
	screenshot_path: string | null
	favicon_url: string | null
	status: 'pending' | 'archived' | 'failed'
	created_at: string
	updated_at: string
	archived_at: string | null
	is_archived: boolean
	reading_progress: number
	tags: Tag[]
}

export interface Tag {
	id: number
	name: string
}

export interface User {
	id: number
	username: string
	email: string
	created_at: string
}

export interface LinkListResponse {
	links: Link[]
	total: number
	cursor: number | null
}
