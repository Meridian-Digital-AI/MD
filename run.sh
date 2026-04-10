#!/bin/bash
# Load API key from .env file and run the campaign builder
export $(cat .env | xargs)
python3 example_usage.py
