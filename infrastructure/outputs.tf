output "alb_dns_name" {
  description = "ALB DNS name - use this to access the application"
  value       = module.compute.alb_dns_name
}

output "redis_endpoint" {
  description = "ElastiCache Redis primary endpoint"
  value       = module.database.redis_endpoint
}

output "asg_name" {
  description = "Auto Scaling Group name"
  value       = module.compute.asg_name
}
