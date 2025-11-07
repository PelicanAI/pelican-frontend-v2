// FIX 39: Form Validation Helper

export const validateEmail = (email: string): boolean => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return re.test(email)
}

export const validateRequired = (value: string): boolean => {
  return value.trim().length > 0
}

export const validateMinLength = (value: string, min: number): boolean => {
  return value.trim().length >= min
}

export const validateMaxLength = (value: string, max: number): boolean => {
  return value.trim().length <= max
}

export const validateFileSize = (file: File, maxSizeMB: number): boolean => {
  return file.size <= maxSizeMB * 1024 * 1024
}

export const validateFileType = (file: File, allowedTypes: string[]): boolean => {
  return allowedTypes.some(type => file.type.startsWith(type))
}

export const validationMessages = {
  required: 'This field is required',
  email: 'Please enter a valid email address',
  minLength: (min: number) => `Must be at least ${min} characters`,
  maxLength: (max: number) => `Must be no more than ${max} characters`,
  fileSize: (max: number) => `File must be smaller than ${max}MB`,
  fileType: (types: string[]) => `File must be of type: ${types.join(', ')}`,
}

