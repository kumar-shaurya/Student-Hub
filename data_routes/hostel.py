from flask import jsonify, render_template
from parsers.hostel_parser import parse_leave_status
import datetime

HOSTEL_TARGET = 'hostels/student/leave/4' 

def fetch_leave_status(ctx, data):
    try:
        # Time string matching your successful browser request
        current_time_str = datetime.datetime.now(datetime.timezone.utc).strftime("%a, %d %b %Y %H:%M:%S GMT")
        
        payload = {
            'authorizedID': ctx['authorized_id'],
            '_csrf': ctx['csrf_token'],
            'status': '',
            'form': 'undefined',
            'control': 'status', 
            'x': current_time_str
        }

        # Do NOT set User-Agent here; let the session handle it
        ajax_headers = {
            'X-Requested-With': 'XMLHttpRequest',
            'Referer': f"{ctx['base_url']}/content",
            'Accept': '*/*'
        }

        # Use the session from the context
        res = ctx['session'].post(
            f"{ctx['base_url']}/{HOSTEL_TARGET}", 
            data=payload, 
            headers=ajax_headers, 
            verify=False
        )
        
        if "Unidentified OS" in res.text:
            print("DEBUG: FAIL - Server still rejected the session.")
            return jsonify({'status': 'error', 'message': 'VTOP rejected the request identity.'}), 403

        parsed_data = parse_leave_status(res.text)
        html = render_template('hostel_leave_content.html', leaves=parsed_data)
        return jsonify({'status': 'success', 'html_content': html})
        
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500