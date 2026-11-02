variable "project_id" {
  type = string
}

variable "region" {
  type = string
}

variable "name" {
  type = string
}

variable "stable_service_name" {
  type = string
}

variable "canary_service_name" {
  type = string
}

variable "stable_traffic_percent" {
  type = number
}

variable "canary_traffic_percent" {
  type = number
}
