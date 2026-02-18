export interface UpdateProfilePayload {
  first_name?: string
  last_name?: string
}

export interface ChangePasswordPayload {
  old_password: string
  new_password: string
  new_password_confirm: string
}
