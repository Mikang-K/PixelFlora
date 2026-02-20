output "alb_dns_name" {
  value = aws_lb.main.dns_name
}

output "asg_name" {
  value = aws_autoscaling_group.main.name
}

output "ec2_sg_id" {
  value = aws_security_group.ec2.id
}
