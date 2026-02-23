from bs4 import BeautifulSoup

def parse_leave_status(html_content):
    soup = BeautifulSoup(html_content, 'html.parser')
    
    # Debug: Check what we received
    print(f"DEBUG: Parsing HTML length: {len(html_content)}")
    
    # 1. Try to find the specific table
    table = soup.find('table', id='LeaveAppliedTable')
    
    # 2. Fallback: Find ANY table that mentions "Leave Id" or "Visit Place"
    if not table:
        print("DEBUG: Exact table ID not found, trying fuzzy search...")
        for t in soup.find_all('table'):
            if 'Leave Id' in t.text or 'Visit Place' in t.text:
                table = t
                print("DEBUG: Found table via fuzzy search!")
                break
    
    leaves = []
    
    if not table:
        print("DEBUG: No table found in response.")
        return leaves

    # Iterate over ALL rows (skipping checking for tbody which sometimes fails)
    rows = table.find_all('tr')
    print(f"DEBUG: Found {len(rows)} rows in table.")
    
    for i, row in enumerate(rows):
        cols = row.find_all('td')
        
        # Debug the first row to ensure we are mapping correctly
        if i == 1: # Index 1 is usually the first data row
            print(f"DEBUG: First Data Row Columns: {len(cols)}")
        
        # Ensure row has enough columns
        # The snippet you sent has ~10 columns. We need at least 8.
        if not cols or len(cols) < 8:
            continue
            
        # Extract Text
        try:
            # Based on your HTML snippet:
            # Index 2 = Leave ID (L2510391)
            # Index 3 = Place (Marina mall)
            # Index 4 = Reason (Outing)
            # Index 5 = Type (OUTING)
            # Index 6 = From Date
            # Index 7 = To Date
            # Index 8 = Status
            
            status_text = cols[8].get_text(strip=True)
            leave_id = cols[2].get_text(strip=True)
            
            # Skip rows where ID is empty (sometimes happens in empty spacer rows)
            if not leave_id:
                continue

            leave = {
                'id': leave_id,
                'place': cols[3].get_text(strip=True),
                'reason': cols[4].get_text(strip=True),
                'type': cols[5].get_text(strip=True),
                'from_date': cols[6].get_text(strip=True),
                'to_date': cols[7].get_text(strip=True),
                'status': status_text,
                'color': get_status_color(status_text)
            }
            leaves.append(leave)
        except Exception as e:
            print(f"DEBUG: Error parsing row {i}: {e}")
            continue
            
    print(f"DEBUG: Successfully parsed {len(leaves)} leaves.")
    return leaves

def get_status_color(status):
    status = status.upper()
    if 'PENDING' in status or 'REQUEST RAISED' in status:
        return 'yellow'
    elif 'APPROVED' in status:
        return 'green'
    elif 'REJECTED' in status or 'CANCELLED' in status:
        return 'red'
    return 'gray'