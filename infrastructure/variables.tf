variable "aws_region" {
  description = "AWS region to deploy resources (AWS Academy uses us-east-1)"
  type        = string
  default     = "us-east-1"
}

variable "key_name" {
  description = "EC2 Key Pair name for SSH access (create this in the AWS Console first)"
  type        = string
}

variable "project_name" {
  description = "Project name prefix for resource naming"
  type        = string
  default     = "pixelflora"
}

variable "ami_id" {
  description = "AMI ID created from the base EC2 instance with the app pre-installed"
  type        = string
}

variable "instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t3.micro"
}

variable "min_size" {
  description = "ASG minimum instance count"
  type        = number
  default     = 1
}

variable "max_size" {
  description = "ASG maximum instance count"
  type        = number
  default     = 4
}

variable "desired_capacity" {
  description = "ASG desired instance count"
  type        = number
  default     = 2
}

variable "cpu_target" {
  description = "Target CPU utilization (%) for Target Tracking scaling policy"
  type        = number
  default     = 60
}
