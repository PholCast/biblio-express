output "instance_name" {
  value = google_sql_database_instance.this.name
}

output "connection_name" {
  value = google_sql_database_instance.this.connection_name
}

output "database_name" {
  value = google_sql_database.this.name
}

output "user_name" {
  value = google_sql_user.this.name
}

output "database_url" {
  sensitive = true
  value     = "postgresql://${urlencode(google_sql_user.this.name)}:${urlencode(random_password.database.result)}@localhost/${urlencode(google_sql_database.this.name)}?host=%2Fcloudsql%2F${urlencode(google_sql_database_instance.this.connection_name)}"
}
