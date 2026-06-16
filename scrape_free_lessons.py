import urllib.request
import json
import csv
import re
from datetime import datetime

def slugify(title):
    title = title.lower()
    # Replace non-alphanumeric characters with hyphens
    title = re.sub(r'[^a-z0-9]+', '-', title)
    # Remove leading/trailing hyphens
    title = re.sub(r'(^-|-$)+', '', title)
    return title

def fetch_page(page, limit=1000):
    url = f"https://api.maven.com/free_lessons/discoverable?limit={limit}&page={page}"
    print(f"Fetching page {page} (limit {limit})...")
    req = urllib.request.Request(
        url,
        headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'}
    )
    with urllib.request.urlopen(req) as response:
        content = response.read().decode('utf-8')
    return json.loads(content)

def main():
    page = 1
    limit = 1000
    all_items = []
    
    # First fetch to get total pages and initial batch
    data = fetch_page(page, limit)
    metadata = data.get("metadata", {})
    total = metadata.get("total", 0)
    total_pages = metadata.get("pages", 1)
    items = data.get("items", [])
    
    print(f"Total lessons to fetch: {total}")
    print(f"Total pages: {total_pages}")
    
    all_items.extend(items)
    print(f"Page 1 fetched {len(items)} items. Total collected: {len(all_items)}")
    
    while len(all_items) < total and page < total_pages:
        page += 1
        try:
            data = fetch_page(page, limit)
            items = data.get("items", [])
            if not items:
                break
            all_items.extend(items)
            print(f"Page {page} fetched {len(items)} items. Total collected: {len(all_items)}")
        except Exception as e:
            print(f"Error fetching page {page}: {e}")
            break
            
    print(f"\nSuccessfully fetched {len(all_items)} lessons.")
    
    # Process and write to CSV
    csv_file = "maven_free_lessons.csv"
    headers = [
        "Course Name", 
        "Authors", 
        "Link", 
        "Signup Count", 
        "Start Date (UTC)", 
        "Duration (Minutes)", 
        "Item ID"
    ]
    
    with open(csv_file, mode="w", encoding="utf-8", newline="") as f:
        writer = csv.writer(f)
        writer.writerow(headers)
        
        for item in all_items:
            title = item.get("title", "")
            slug = item.get("slug", "")
            
            # Authors/Instructors
            instructors = item.get("instructors", [])
            instructor_names = ", ".join([inst.get("name", "") for inst in instructors if inst.get("name")])
            
            # Format link
            link = f"https://maven.com/p/{slug}/{slugify(title)}" if slug else ""
            
            # Format date
            start_date_str = item.get("start_datetime", "")
            formatted_date = ""
            if start_date_str:
                try:
                    # e.g., 2026-06-17T08:00:00Z
                    dt = datetime.strptime(start_date_str, "%Y-%m-%dT%H:%M:%SZ")
                    formatted_date = dt.strftime("%Y-%m-%d %H:%M")
                except ValueError:
                    formatted_date = start_date_str
            
            signup_count = item.get("signup_count", 0)
            duration = item.get("duration_minutes", 0)
            item_id = item.get("item_id", "")
            
            writer.writerow([
                title,
                instructor_names,
                link,
                signup_count,
                formatted_date,
                duration,
                item_id
            ])
            
    print(f"Successfully exported {len(all_items)} records to {csv_file}")

if __name__ == "__main__":
    main()
