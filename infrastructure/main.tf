terraform {
  required_version = ">= 1.5"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    tls = {
      source  = "hashicorp/tls"
      version = "~> 4.0"
    }
    local = {
      source  = "hashicorp/local"
      version = "~> 2.0"
    }
  }
  # Uncomment to use S3 backend for team collaboration:
  # backend "s3" {
  #   bucket = "your-tfstate-bucket"
  #   key    = "pixelflora/terraform.tfstate"
  #   region = "ap-northeast-2"
  # }
}

provider "aws" {
  region = var.aws_region
}

module "networking" {
  source       = "./modules/networking"
  project_name = var.project_name
}

module "database" {
  source       = "./modules/database"
  project_name = var.project_name
  vpc_id       = module.networking.vpc_id
  subnet_ids   = module.networking.private_subnet_ids
  ec2_sg_id    = module.compute.ec2_sg_id
}

module "compute" {
  source            = "./modules/compute"
  project_name      = var.project_name
  vpc_id            = module.networking.vpc_id
  public_subnet_ids = module.networking.public_subnet_ids
  ami_id            = var.ami_id
  instance_type     = var.instance_type
  min_size          = var.min_size
  max_size          = var.max_size
  desired_capacity  = var.desired_capacity
  cpu_target        = var.cpu_target
  redis_host        = module.database.redis_endpoint
}
