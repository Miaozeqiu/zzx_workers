import os
from supabase import create_client, Client

url: str = "https://urpwmepjyjntedvjgccc.supabase.co"
key: str = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVycHdtZXBqeWpudGVkdmpnY2NjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzEwMDEwOTUsImV4cCI6MjA0NjU3NzA5NX0.qVFRSkBHtbfBUCeC8ZO25mU_mmCAIcG_QgZDT4ajWgg"
supabase: Client = create_client(url, key)

# response = (
#     supabase.table("users")
#     .insert({"id": 1, "name": "Denmark"})
#     .execute()
# )

response = supabase.table("users").select("*").execute()


print(response.data)
