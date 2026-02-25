output "alb_dns_name" {
  value = aws_lb.main.dns_name
}

output "asg_name" {
  value = aws_autoscaling_group.main.name
}

output "ec2_sg_id" {
  value = aws_security_group.ec2.id
}

output "key_pair_name" {
  value       = aws_key_pair.main.key_name
  description = "Name of the created EC2 key pair"
}

output "private_key_path" {
  value       = local_sensitive_file.private_key.filename
  description = "Local path to the SSH private key (.pem)"
}
