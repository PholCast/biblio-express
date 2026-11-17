# Alert delivery (plan C9). Pub/Sub is the measured channel: measure.sh pulls t_detect from it.
# Email is optional and only for the live demo.

resource "google_pubsub_topic" "alerts" {
  name    = "gd-alerts"
  project = var.project_id
}

resource "google_pubsub_subscription" "alerts_pull" {
  name                 = "gd-alerts-pull"
  topic                = google_pubsub_topic.alerts.id
  project              = var.project_id
  ack_deadline_seconds = 20
  message_retention_duration = "86400s"
}

# Cloud Monitoring publishes incidents through its service agent, so it needs publisher rights.
resource "google_pubsub_topic_iam_member" "monitoring_publisher" {
  topic   = google_pubsub_topic.alerts.id
  project = var.project_id
  role    = "roles/pubsub.publisher"
  member  = "serviceAccount:service-${data.google_project.this.number}@gcp-sa-monitoring-notification.iam.gserviceaccount.com"
}

resource "google_monitoring_notification_channel" "pubsub" {
  project      = var.project_id
  display_name = "Game day alerts (Pub/Sub)"
  type         = "pubsub"
  labels = {
    topic = google_pubsub_topic.alerts.id
  }
  depends_on = [google_pubsub_topic_iam_member.monitoring_publisher]
}

resource "google_monitoring_notification_channel" "email" {
  count        = var.notification_email == "" ? 0 : 1
  project      = var.project_id
  display_name = "Game day alerts (email)"
  type         = "email"
  labels = {
    email_address = var.notification_email
  }
}

locals {
  alert_channels = concat(
    [google_monitoring_notification_channel.pubsub.id],
    var.notification_email == "" ? [] : [google_monitoring_notification_channel.email[0].id],
  )
}
