variable "project_name"      { type = string }
variable "vpc_id"            { type = string }
variable "public_subnet_ids" { type = list(string) }
variable "ami_id"            { type = string; default = "" }
variable "instance_type"     { type = string }
variable "key_name"          { type = string }
variable "min_size"          { type = number }
variable "max_size"          { type = number }
variable "desired_capacity"  { type = number }
variable "cpu_target"        { type = number }
variable "redis_host"        { type = string }
