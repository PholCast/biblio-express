variable "project_id" {
  type = string
}

variable "service_name" {
  type = string
}

variable "dashboard_name" {
  type = string
}

variable "notification_email" {
  type = string
}

variable "p95_threshold_ms" {
  type    = number
  default = 150
}

variable "max_5xx_rate" {
  type    = number
  default = 0.01
}
